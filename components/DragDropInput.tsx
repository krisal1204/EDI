
import React, { useState, useCallback } from 'react';

const sample270 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1200*^*00501*000000001*0*T*:~GS*HS*SENDER*RECEIVER*20240101*1200*1*X*005010X279A1~ST*270*0001*005010X279A1~BHT*0022*13*10001234*20240101*1200~HL*1**20*1~NM1*PR*2*CMS MEDICARE*****PI*CMS001~HL*2*1*21*1~NM1*1P*2*GENERAL HOSPITAL*****XX*1234567890~HL*3*2*22*0~TRN*1*9300000000001*9876543210~NM1*IL*1*DOE*JOHN****MI*MBI123456789~DMG*D8*19550512~DTP*291*D8*20240101~EQ*30~HL*4*2*22*0~TRN*1*9300000000002*9876543210~NM1*IL*1*SMITH*JANE****MI*MBI987654321~DMG*D8*19800820~DTP*291*D8*20240101~EQ*30~SE*18*0001~GE*1*1~IEA*1*000000001~`;

const sample271 = `ISA*00*          *00*          *ZZ*RECEIVER       *ZZ*SENDER         *240101*1205*^*00501*000000002*0*T*:~GS*HB*RECEIVER*SENDER*20240101*1205*2*X*005010X279A1~ST*271*0002*005010X279A1~BHT*0022*11*10001234*20240101*1205~HL*1**20*1~NM1*PR*2*CMS MEDICARE*****PI*CMS001~HL*2*1*21*1~NM1*1P*2*GENERAL HOSPITAL*****XX*1234567890~HL*3*2*22*0~TRN*2*9300000000001*9876543210~NM1*IL*1*DOE*JOHN****MI*MBI123456789~EB*1**30*MA**26~EB*C**30*MA*23*150.00~MSG*DEDUCTIBLE REMAINING~DTP*291*D8*20240101~HL*4*2*22*0~TRN*2*9300000000002*9876543210~NM1*IL*1*SMITH*JANE****MI*MBI987654321~EB*1**30*MA**26~EB*G**30*MA*23*2500.00~MSG*OUT OF POCKET MET~DTP*291*D8*20240101~SE*19*0002~GE*1*2~IEA*1*000000002~`;

const sample834 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1000*^*00501*000000003*0*P*:~GS*BE*SENDER*RECEIVER*20240101*1000*3*X*005010X220A1~ST*834*0003*005010X220A1~BGN*00*123456*20240101*1000***2~N1*P5*ACME CORP*FI*998877665~N1*IN*AETNA*XV*60054~INS*Y*18*021*01*A***FT~REF*0F*SUB123456~REF*SY*123456789~NM1*IL*1*DOE*JOHN~DMG*D8*19800101*M~HD*024**HLT**FAM~DTP*348*D8*20240101~INS*Y*18*021*01*A***FT~REF*0F*SUB789012~REF*SY*987654321~NM1*IL*1*SMITH*ALICE~DMG*D8*19850515*F~HD*024**HLT**IND~DTP*348*D8*20240201~SE*20*0003~GE*1*3~IEA*1*000000003~`;

const sample837Prof = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1400*^*00501*000000004*0*P*:~GS*HC*SENDER*RECEIVER*20240101*1400*4*X*005010X222A1~ST*837*0004*005010X222A1~BHT*0019*00*000000004*20240101*1400*CH~NM1*41*2*SUBMITTER*****46*SUBID~PER*IC*CONTACT*TE*5551234567~NM1*40*2*PAYER*****46*PAYERID~HL*1**20*1~NM1*85*2*PROVIDER GROUP*****XX*1999999999~N3*123 MAIN ST~N4*AUSTIN*TX*78701~REF*EI*741234567~HL*2*1*22*0~SBR*P*18*******CI~NM1*IL*1*DOE*JOHN****MI*MEMBERID~DMG*D8*19800101*M~NM1*PR*2*PAYER NAME*****PI*PAYERID~CLM*CLM12345*150.00***11:B:1*Y*A*Y*Y~HI*ABK:R05~LX*1~SV1*HC:99213*150.00*UN*1***1~DTP*472*D8*20240101~CLM*CLM12346*75.00***11:B:1*Y*A*Y*Y~HI*ABK:J01.90~LX*1~SV1*HC:99214*75.00*UN*1***1~DTP*472*D8*20240115~SE*24*0004~GE*1*4~IEA*1*000000004~`;

const sample837Inst = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1400*^*00501*000000005*0*P*:~GS*HC*SENDER*RECEIVER*20240101*1400*5*X*005010X223A2~ST*837*0005*005010X223A2~BHT*0019*00*000000005*20240101*1400*CH~NM1*41*2*SUBMITTER*****46*SUBID~PER*IC*CONTACT*TE*5551234567~NM1*40*2*PAYER*****46*PAYERID~HL*1**20*1~NM1*85*2*HOSPITAL*****XX*1888888888~N3*456 HEALTH BLVD~N4*HOUSTON*TX*77002~REF*EI*749876543~HL*2*1*22*0~SBR*P*18*******CI~NM1*IL*1*SMITH*JANE****MI*MEMBERID2~DMG*D8*19750505*F~NM1*PR*2*PAYER NAME*****PI*PAYERID~CLM*CLM67890*5000.00***111*Y*A*Y*Y~HI*ABK:A09~LX*1~SV2*0110*HC:12345*5000.00*UN*1~DTP*472*D8*20240101~CLM*CLM67891*1200.00***111*Y*A*Y*Y~HI*ABK:E11.9~LX*1~SV2*0250*HC:J3420*1200.00*UN*1~DTP*472*D8*20240201~SE*24*0005~GE*1*5~IEA*1*000000005~`;

const sample276 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1500*^*00501*000000006*0*T*:~GS*HR*SENDER*RECEIVER*20240101*1500*6*X*005010X212~ST*276*0006*005010X212~BHT*0010*13*000000006*20240101*1500~HL*1**20*1~NM1*PR*2*PAYER*****PI*PAYERID~HL*2*1*21*1~NM1*41*2*PROVIDER*****XX*1234567890~HL*3*2*22*0~NM1*IL*1*DOE*JOHN****MI*MEMBERID~TRN*1*CLM12345~AMT*T3*150.00~DTP*472*D8*20240101~TRN*1*CLM99887~AMT*T3*225.00~DTP*472*D8*20240215~SE*16*0006~GE*1*6~IEA*1*000000006~`;

const sample277 = `ISA*00*          *00*          *ZZ*RECEIVER       *ZZ*SENDER         *240101*1505*^*00501*000000007*0*T*:~GS*HN*RECEIVER*SENDER*20240101*1505*7*X*005010X212~ST*277*0007*005010X212~BHT*0010*08*000000007*20240101*1505~HL*1**20*1~NM1*PR*2*PAYER*****PI*PAYERID~HL*2*1*21*1~NM1*41*2*PROVIDER*****XX*1234567890~HL*3*2*22*0~NM1*IL*1*DOE*JOHN****MI*MEMBERID~TRN*2*CLM12345~STC*F1:20:PR*20240101**150.00*120.00~REF*1K*999999~DTP*576*D8*20240115~TRN*2*CLM99887~STC*P1:16:PR*20240215**225.00*0.00~REF*1K*888888~SE*19*0007~GE*1*7~IEA*1*000000007~`;

const sample835 = `ISA*00*          *00*          *ZZ*PAYER          *ZZ*PROVIDER       *240201*1600*^*00501*000000008*0*P*:~GS*HP*PAYER*PROVIDER*20240201*1600*8*X*005010X221A1~ST*835*0008*005010X221A1~BPR*I*500.00*C*CHK*CCP*01*999888777*DA*123456789*1512345678**01*987654321*DA*98765*20240201~TRN*1*CHECK12345*1999999999~N1*PR*UNITED HEALTHCARE*XV*87726~N1*PE*MEDICAL GROUP LLC*XX*1234567890~LX*1~CLP*CLM12345*1*150.00*120.00*30.00*12*1234567890123~NM1*QC*1*DOE*JOHN~DTM*232*20240101~CAS*PR*2*30.00~SVC*HC:99213*150.00*120.00~DTM*472*20240101~CAS*CO*45*30.00~LX*2~CLP*CLM99887*3*225.00*0.00*225.00*12*1234567890124~NM1*QC*1*SMITH*ALICE~DTM*232*20240215~CAS*PR*1*225.00~SVC*HC:99214*225.00*0.00~DTM*472*20240215~CAS*CO*45*225.00~SE*20*0008~GE*1*8~IEA*1*000000008~`;

interface Props {
  onProcess: (text: string) => void;
}

const ButtonGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="flex flex-col gap-2">
            {children}
        </div>
    </div>
);

const SampleButton = ({ code, label, onClick }: { code: string, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-md transition-all group text-left shadow-sm"
    >
        <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">{label}</span>
        <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{code}</span>
    </button>
);

export const DragDropInput: React.FC<Props> = ({ onProcess }) => {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setText(content);
        onProcess(content);
      };
      reader.readAsText(file);
    }
  }, [onProcess]);

  const handleProcess = () => {
    if (text.trim()) onProcess(text);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
        
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">X12 EDI Inspector</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg font-light">
                Paste your EDI content below or drop a file to instantly parse, validate, and analyze.
            </p>
        </div>

        <div 
          className={`
            relative rounded-xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center min-h-[300px] mb-10 group
            ${isDragging 
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' 
              : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-600'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <textarea
            className="w-full h-full absolute inset-0 bg-transparent p-6 resize-none focus:outline-none font-mono text-sm text-gray-800 dark:text-slate-300 z-10 text-center placeholder-gray-400 dark:placeholder-slate-600 focus:text-left focus:placeholder-transparent transition-all"
            placeholder="Paste X12 EDI content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          
          {!text && (
             <div className="pointer-events-none flex flex-col items-center text-gray-400 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Drag & Drop file or Paste Text</span>
             </div>
          )}
          
          {text && (
             <div className="absolute bottom-4 right-4 z-20">
                 <button 
                    onClick={handleProcess}
                    className="bg-black dark:bg-brand-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-gray-800 dark:hover:bg-brand-500 transition-all transform hover:scale-105"
                 >
                    Analyze
                 </button>
             </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-8">
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mb-6 font-medium uppercase tracking-widest">Or load a sample transaction</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <ButtonGroup title="Enrollment">
                    <SampleButton code="834" label="Maintenance" onClick={() => { setText(sample834); onProcess(sample834); }} />
                </ButtonGroup>

                <ButtonGroup title="Eligibility">
                    <SampleButton code="270" label="Inquiry" onClick={() => { setText(sample270); onProcess(sample270); }} />
                    <SampleButton code="271" label="Response" onClick={() => { setText(sample271); onProcess(sample271); }} />
                </ButtonGroup>

                <ButtonGroup title="File Claims">
                    <SampleButton code="837P" label="Professional" onClick={() => { setText(sample837Prof); onProcess(sample837Prof); }} />
                    <SampleButton code="837I" label="Institutional" onClick={() => { setText(sample837Inst); onProcess(sample837Inst); }} />
                </ButtonGroup>
                
                <ButtonGroup title="Claim Status">
                    <SampleButton code="276" label="Status Req" onClick={() => { setText(sample276); onProcess(sample276); }} />
                    <SampleButton code="277" label="Status Resp" onClick={() => { setText(sample277); onProcess(sample277); }} />
                </ButtonGroup>

                <ButtonGroup title="Payment">
                    <SampleButton code="835" label="Remittance" onClick={() => { setText(sample835); onProcess(sample835); }} />
                </ButtonGroup>
            </div>
        </div>
      </div>
    </div>
  );
};
