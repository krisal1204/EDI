import { EdiSegment, SegmentAnalysis } from "../types";
import { useAppStore } from "../store/useAppStore";

/**
 * Get current configuration from store
 */
const getConfig = () => {
  const state = useAppStore.getState();
  return {
    host: state.ollamaHost,
    model: state.ollamaModel
  };
};

// Exporting model name getter for UI display
export const getModelName = () => getConfig().model;

/**
 * Analyze a specific segment using Local Ollama
 */
export const analyzeSegment = async (segment: EdiSegment, transactionType: string = "270/271"): Promise<SegmentAnalysis> => {
  const { host, model } = getConfig();
  
  const prompt = `
    You are an expert EDI X12 Analyst.
    Analyze the following X12 EDI segment from a ${transactionType} document.
    
    Segment: ${segment.raw}
    
    Provide a human-readable summary of what this segment signifies in the context of healthcare eligibility (270/271).
    Then, break down each data element with its standard X12 name/definition and the meaning of the specific value provided.
    
    You MUST output valid JSON only, matching this structure:
    {
      "summary": "concise one sentence summary",
      "fields": [
        { 
          "code": "element ref (e.g. NM101)", 
          "description": "standard element name", 
          "value": "the value in the segment", 
          "definition": "what this value means (e.g. 'IL' means 'Insured')" 
        }
      ]
    }
  `;

  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false
      })
    });

    if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.message.content) as SegmentAnalysis;
  } catch (error) {
    console.error("Ollama Analysis Failed", error);
    return {
      summary: `Analysis unavailable. Please ensure Ollama is running at ${host} with ${model}.`,
      fields: segment.elements.map(e => ({
        code: `${segment.tag}${e.index.toString().padStart(2, '0')}`,
        description: "Unknown Element",
        value: e.value,
        definition: "-"
      }))
    };
  }
};

/**
 * Chat with the EDI context using Local Ollama
 */
export const askEdiQuestion = async (
    question: string, 
    ediContext: string, 
    history: { role: string; parts: { text: string }[] }[]
) => {
    const { host, model } = getConfig();

    // Map existing history structure (Gemini style) to Ollama format
    const ollamaHistory = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
    }));

    const systemPrompt = `You are an expert Medical EDI (Electronic Data Interchange) analyst specializing in X12 270 (Eligibility Inquiry) and 271 (Eligibility Response) transactions. 
    
    You have access to the raw EDI file content provided by the user. 
    
    Your goal is to answer specific questions about the coverage, patient details, errors, or benefits found in the EDI data.
    
    When answering:
    1. Cite the specific Segment (e.g., EB01, NM1) that contains the answer if possible.
    2. Explain codes clearly (e.g., if you see "EB*1", explain that "1" means "Active Coverage").
    3. Be concise and professional.
    
    Current EDI Document Context:
    ${ediContext}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...ollamaHistory,
        { role: 'user', content: question }
    ];

    try {
        const response = await fetch(`${host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error("Chat error", error);
        return `I'm sorry, I couldn't connect to your local Ollama instance at ${host}. Please make sure it is running and '${model}' is pulled.`;
    }
};

/**
 * Generate form data for EDI 270/276 using Local Ollama
 */
export const generateFormData = async (formType: '270' | '276', description: string = "A realistic healthcare scenario"): Promise<any> => {
    const { host, model } = getConfig();
    
    const schema270 = {
        payerName: "string (e.g. Medicare)",
        payerId: "string (e.g. CMS001)",
        providerName: "string (e.g. General Hospital)",
        providerNpi: "string (10 digits)",
        subscriberFirstName: "string",
        subscriberLastName: "string",
        subscriberId: "string (Member ID)",
        subscriberDob: "YYYY-MM-DD",
        serviceDate: "YYYY-MM-DD (today or recent)",
        serviceTypeCode: "string (e.g. 30, 1, 33)",
        hasDependent: "boolean",
        dependentFirstName: "string (empty if hasDependent is false)",
        dependentLastName: "string (empty if hasDependent is false)",
        dependentDob: "YYYY-MM-DD (empty if hasDependent is false)",
        dependentGender: "string (M, F, or U - empty if false)"
    };

    const schema276 = {
        payerName: "string",
        payerId: "string",
        providerName: "string",
        providerNpi: "string",
        subscriberFirstName: "string",
        subscriberLastName: "string",
        subscriberId: "string",
        hasDependent: "boolean",
        dependentFirstName: "string",
        dependentLastName: "string",
        claimId: "string (Trace Number)",
        chargeAmount: "string (e.g. 150.00)",
        serviceDate: "YYYY-MM-DD"
    };

    const targetSchema = formType === '270' ? schema270 : schema276;
    
    const prompt = `
        You are a medical test data generator. 
        Generate valid JSON data for an EDI ${formType} form based on this scenario: "${description}".
        
        The JSON MUST match this structure exactly:
        ${JSON.stringify(targetSchema, null, 2)}
        
        Rules:
        - Return ONLY raw JSON. No markdown, no explanations.
        - Use realistic names and valid-looking IDs.
        - Dates must be YYYY-MM-DD.
        - Ensure boolean fields are actual booleans (true/false), not strings.
    `;

    try {
        const response = await fetch(`${host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                format: "json"
            })
        });

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        let content = data.message.content;
        
        // Cleanup potential markdown wrapping
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(content);
    } catch (error) {
        console.error("Generation Error", error);
        throw error;
    }
};