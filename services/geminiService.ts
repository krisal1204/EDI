import { EdiSegment, SegmentAnalysis } from "../types";

// Configuration for Local Ollama Instance
const OLLAMA_HOST = process.env.VITE_OLLAMA_HOST || "http://localhost:11434";
const MODEL_NAME = "llama3"; // Ensure you have pulled this model via 'ollama pull llama3'

/**
 * Analyze a specific segment using Local Ollama
 */
export const analyzeSegment = async (segment: EdiSegment, transactionType: string = "270/271"): Promise<SegmentAnalysis> => {
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
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
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
      summary: "Analysis unavailable. Please ensure Ollama is running locally on port 11434 with llama3.",
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
        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
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
        return "I'm sorry, I couldn't connect to your local Ollama instance. Please make sure it is running (ollama serve) and 'llama3' is pulled.";
    }
};