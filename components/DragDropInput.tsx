import React, { useState } from 'react';

interface Props {
  onProcess: (edi: string) => void;
}

// Production-grade 270 Eligibility Inquiry
const sample270 = `ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*PAYERID        *240228*1430*^*00501*100000001*0*T*:~
GS*HS*SUBMITTERID*PAYERID*20240228*1430*1*X*005010X279A1~
ST*270*0001*005010X279A1~
BHT*0022*13*REQ1234567*20240228*143000~
HL*1**20*1~
NM1*PR*2*ANTHEM BLUE CROSS*****PI*ANTHEM01~
HL*2*1*21*1~
NM1*1P*2*VALLEY MEDICAL GROUP*****XX*1999999999~
N3*123 HEALTH AVE~
N4*SPRINGFIELD*IL*62704~
HL*3*2*22*0~
TRN*1*981726354*9876543210~
NM1*IL*1*SMITH*JONATHAN*A***MI*XJ99887766~
N3*456 MAPLE DRIVE~
N4*SPRINGFIELD*IL*62704~
DMG*D8*19800515*M~
DTP*291*D8*20240228~
EQ*30~
EQ*35~
EQ*88~
SE*19*0001~
GE*1*1~
IEA*1*100000001~`;

// Production-grade 271 Eligibility Response
const sample271 = `ISA*00*          *00*          *ZZ*PAYERID        *ZZ*SUBMITTERID    *240228*1431*^*00501*200000001*0*T*:~
GS*HB*PAYERID*SUBMITTERID*20240228*1431*1*X*005010X279A1~
ST*271*0001*005010X279A1~
BHT*0022*11*RESP987654*20240228*143100~
HL*1**20*1~
NM1*PR*2*ANTHEM BLUE CROSS*****PI*ANTHEM01~
PER*IC*MEMBER SERVICES*TE*8005551234*UR*WWW.ANTHEM.COM~
HL*2*1*21*1~
NM1*1P*2*VALLEY MEDICAL GROUP*****XX*1999999999~
HL*3*2*22*0~
TRN*2*981726354*9876543210~
NM1*IL*1*SMITH*JONATHAN*A***MI*XJ99887766~
N3*456 MAPLE DRIVE~
N4*SPRINGFIELD*IL*62704~
DMG*D8*19800515*M~
DTP*346*D8*20240101~
EB*1*IND*30*PO**26*******Y~
REF*18*PPO GOLD 500~
REF*6P*GRP12345~
DTP*307*RD8*20240101-20241231~
EB*C*IND*30*PO*23*1000*****N~
MSG*CALENDAR YEAR DEDUCTIBLE - IN NETWORK~
EB*C*IND*30*PO*23*3000*****Y~
MSG*CALENDAR YEAR DEDUCTIBLE - OUT OF NETWORK~
EB*G*IND*30*PO*23*5000*****N~
MSG*OUT OF POCKET MAXIMUM - IN NETWORK~
EB*B*IND*98*PO*27*25****Y~
MSG*OFFICE VISIT COPAY~
EB*B*IND*98*PO*27*50****N~
MSG*SPECIALIST VISIT COPAY~
EB*B*IND*UC*PO*27*75~
MSG*URGENT CARE COPAY~
EB*B*IND*86*PO*27*250~
MSG*EMERGENCY ROOM COPAY (WAIVED IF ADMITTED)~
EB*A*IND*47*PO*27*.20~
MSG*INPATIENT HOSPITAL COINSURANCE (AFTER DEDUCTIBLE)~
EB*1*IND*88*PO**26~
EB*B*IND*88*PO*27*10****CA*30~
MSG*GENERIC RX TIER 1 - 30 DAY SUPPLY~
EB*B*IND*88*PO*27*35****CA*30~
MSG*BRAND RX TIER 2 - 30 DAY SUPPLY~
EB*F*IND*PT*PO*23*20****VS~
MSG*PHYSICAL THERAPY VISITS PER YEAR~
EB*D*IND*35*PO~
MSG*DENTAL COVERAGE UNDER SEPARATE POLICY~
EB*I*IND*A0*PO~
MSG*COSMETIC PROCEDURES NOT COVERED~
SE*36*0001~
GE*1*1~
IEA*1*200000001~`;

// Production-grade 276 Claim Status Request
const sample276 = `ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*PAYERID        *240315*0900*^*00501*300000001*0*T*:~
GS*HR*SUBMITTERID*PAYERID*20240315*0900*1*X*005010X212~
ST*276*0001*005010X212~
BHT*0010*13*CLMREQ001*20240315*090000~
HL*1**20*1~
NM1*PR*2*UNITED HEALTHCARE*****PI*UHC999~
HL*2*1*21*1~
NM1*41*2*CITY GENERAL HOSPITAL*****XX*1888888888~
HL*3*2*22*1~
NM1*IL*1*WILLIAMS*SARAH****MI*UHC123456789~
N3*789 PINE STREET~
N4*AUSTIN*TX*73301~
HL*4*3*23*0~
NM1*03*1*WILLIAMS*MICHAEL~
DMG*D8*20150620*M~
TRN*1*PAT20231201A*1888888888~
AMT*T3*1500.00~
DTP*472*D8*20231201~
SVC*HC:99213*150.00~
REF*6R*LINE001~
SVC*HC:73030*250.00~
REF*6R*LINE002~
SE*20*0001~
GE*1*1~
IEA*1*300000001~`;

// Production-grade 277 Claim Status Response (Complex)
const sample277 = `ISA*00*          *00*          *ZZ*PAYERID        *ZZ*SUBMITTERID    *240315*0905*^*00501*400000001*0*T*:~
GS*HN*PAYERID*SUBMITTERID*20240315*0905*1*X*005010X212~
ST*277*0001*005010X212~
BHT*0010*08*CLMRESP001*20240315*090500*RP~
HL*1**20*1~
NM1*PR*2*UNITED HEALTHCARE*****PI*UHC999~
HL*2*1*21*1~
NM1*41*2*CITY GENERAL HOSPITAL*****XX*1888888888~
HL*3*2*22*1~
NM1*IL*1*WILLIAMS*SARAH****MI*UHC123456789~
HL*4*3*23*0~
NM1*03*1*WILLIAMS*MICHAEL~
TRN*2*CLM20240001*1888888888~
STC*F1:20:PR*20240315*UHC001*1250.00*890.00*20240315*CHECK123456~
REF*1K*UHC2401500099~
REF*CK*CHECK123456~
DTP*576*D8*20240315~
DTP*472*D8*20240301~
SVC*HC:99285*450.00*400.00~
STC*F1:1:PR*20240315**450.00*400.00~
DTP*472*D8*20240301~
SVC*HC:71046*150.00*100.00~
STC*F1:1:PR*20240315**150.00*100.00~
DTP*472*D8*20240301~
SVC*HC:85025*50.00*40.00~
STC*F1:1:PR*20240315**50.00*40.00~
DTP*472*D8*20240301~
SVC*HC:72148*600.00*0.00~
STC*F2:197:PR*20240315**600.00*0.00~
REF*BB*AUTHREQUIRED~
DTP*472*D8*20240301~
SE*34*0001~
GE*1*1~
IEA*1*400000001~`;

// 837 Professional Sample
const sample837Prof = `ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*PAYERID        *240320*1000*^*00501*500000001*0*P*:~
GS*HC*SUBMITTERID*PAYERID*20240320*1000*1*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*CLM2024001*20240320*1000*CH~
NM1*41*2*DR SMITH MEDICAL*****46*SUBMITTER01~
PER*IC*BILLING DEPT*TE*5551234567~
NM1*40*2*BLUE SHIELD*****46*PAYER01~
HL*1**20*1~
NM1*85*2*DR SMITH MEDICAL*****XX*1234567890~
N3*100 MAIN ST~
N4*ANYTOWN*CA*90210~
REF*EI*998877665~
HL*2*1*22*0~
SBR*P*18*******CI~
NM1*IL*1*JOHNSON*ROBERT****MI*MBI123456789~
N3*500 OAK AVE~
N4*ANYTOWN*CA*90210~
DMG*D8*19750615*M~
NM1*PR*2*BLUE SHIELD*****PI*PAYER01~
CLM*CLAIM24001*150.00***11:B:1*Y*A*Y*Y~
HI*ABK:R05~
LX*1~
SV1*HC:99213*150.00*UN*1***1~
DTP*472*D8*20240315~
SE*23*0001~
GE*1*1~
IEA*1*500000001~`;

// 837 Institutional Sample
const sample837Inst = `ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*PAYERID        *240320*1005*^*00501*600000001*0*P*:~
GS*HC*SUBMITTERID*PAYERID*20240320*1005*1*X*005010X223A2~
ST*837*0001*005010X223A2~
BHT*0019*00*CLM2024002*20240320*1005*CH~
NM1*41*2*GENERAL HOSPITAL*****46*SUBMITTER02~
PER*IC*BUSINESS OFFICE*TE*5559876543~
NM1*40*2*MEDICARE*****46*CMS001~
HL*1**20*1~
NM1*85*2*GENERAL HOSPITAL*****XX*1987654321~
N3*200 HOSPITAL WAY~
N4*METROPOLIS*NY*10001~
REF*EI*112233445~
HL*2*1*22*0~
SBR*P*18*******MB~
NM1*IL*1*WILLIAMS*MARY****MI*MBI987654321~
N3*300 ELM ST~
N4*METROPOLIS*NY*10001~
DMG*D8*19500101*F~
NM1*PR*2*MEDICARE*****PI*CMS001~
CLM*CLAIM24002*2500.00***111*Y*A*Y*Y~
HI*ABK:A09~
LX*1~
SV2*0450*HC:99283*2500.00*UN*1~
DTP*472*D8*20240318~
SE*23*0001~
GE*1*1~
IEA*1*600000001~`;

// 834 Enrollment Sample
const sample834 = `ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*PAYERID        *240401*1000*^*00501*700000001*0*P*:~
GS*BE*SUBMITTERID*PAYERID*20240401*1000*1*X*005010X220A1~
ST*834*0001*005010X220A1~
BGN*00*700000001*20240401*1000***2~
N1*P5*ACME CORP*FI*998877665~
N1*IN*AETNA*XV*60054~
INS*Y*18*021*01*A***FT~
REF*0F*SUB123456~
REF*SY*123456789~
DTP*356*D8*20240401~
NM1*IL*1*DOE*JOHN****34*123456789~
PER*IP**TE*5551234567~
N3*123 MAIN ST~
N4*AUSTIN*TX*78701~
DMG*D8*19800101*M~
HD*024**HLT~
DTP*348*D8*20240401~
INS*N*19*021*01*A***FT~
REF*0F*SUB123456~
REF*SY*987654321~
DTP*356*D8*20240401~
NM1*IL*1*DOE*JANE~
DMG*D8*20100515*F~
HD*024**HLT~
DTP*348*D8*20240401~
SE*24*0001~
GE*1*1~
IEA*1*700000001~`;

const ButtonGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 w-full">
      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider">{title}</span>
      <div className="flex flex-wrap justify-center gap-2">
          {children}
      </div>
  </div>
);

const SampleButton = ({ label, code, onClick }: { label: string, code: string, onClick: () => void }) => (
    <button 
      onClick={onClick} 
      className="group relative px-3 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
    >
      <span className="font-mono font-bold text-gray-900 dark:text-slate-300 mr-1.5">{code}</span>
      {label}
    </button>
);

export const DragDropInput: React.FC<Props> = ({ onProcess }) => {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 w-full bg-white dark:bg-slate-950 transition-colors duration-200 overflow-y-auto">
      <div className="w-full text-center mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">EDI Inspector</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
          Paste any standard X12 transaction (270, 271, 276, 277, 837) below to visualize, validate, and analyze the data structure. All processing is done locally in your browser.
        </p>
      </div>

      <div className="w-full flex-1 max-w-3xl mb-8 min-h-[200px]">
        <textarea 
          className="w-full h-full p-6 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none text-gray-800 dark:text-slate-200 placeholder-gray-300 dark:placeholder-slate-700 transition-all shadow-sm dark:shadow-none"
          placeholder="ISA*00*          *00*          *ZZ*SUBMITTER..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="w-full max-w-3xl space-y-8">
        <button 
          onClick={() => onProcess(text)}
          disabled={!text.trim()}
          className="w-full py-3.5 bg-black dark:bg-brand-600 hover:bg-gray-800 dark:hover:bg-brand-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-600 text-white rounded-lg text-sm font-medium transition-all shadow-md transform active:scale-[0.99]"
        >
          Analyze Transaction
        </button>
        
        <div className="border-t border-gray-100 dark:border-slate-800 pt-8">
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mb-6">Or load a sample transaction to explore:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ButtonGroup title="Eligibility">
                    <SampleButton code="270" label="Inquiry" onClick={() => setText(sample270)} />
                    <SampleButton code="271" label="Response" onClick={() => setText(sample271)} />
                </ButtonGroup>

                <ButtonGroup title="File Claims">
                    <SampleButton code="837P" label="Professional" onClick={() => setText(sample837Prof)} />
                    <SampleButton code="837I" label="Institutional" onClick={() => setText(sample837Inst)} />
                </ButtonGroup>
                
                <ButtonGroup title="Claims Status">
                    <SampleButton code="276" label="Request" onClick={() => setText(sample276)} />
                    <SampleButton code="277" label="Response" onClick={() => setText(sample277)} />
                </ButtonGroup>

                <ButtonGroup title="Enrollment">
                    <SampleButton code="834" label="Maintenance" onClick={() => setText(sample834)} />
                </ButtonGroup>
            </div>
        </div>
      </div>
    </div>
  );
};