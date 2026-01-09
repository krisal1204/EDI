import React, { useState } from 'react';

interface Props {
  onProcess: (edi: string) => void;
}

export const DragDropInput: React.FC<Props> = ({ onProcess }) => {
  const [text, setText] = useState('');

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

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 w-full bg-white">
      <div className="w-full text-center mb-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Inspect EDI</h1>
        <p className="text-sm text-gray-400">
          Supported Formats: 270, 271, 276, 277
        </p>
      </div>

      <div className="w-full flex-1 max-w-2xl mb-6">
        <textarea 
          className="w-full h-full p-6 rounded border border-gray-200 bg-white font-mono text-xs focus:outline-none focus:border-black focus:ring-0 resize-none text-gray-800 placeholder-gray-300 transition-colors"
          placeholder="Paste X12 content here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <button 
          onClick={() => onProcess(text)}
          disabled={!text.trim()}
          className="w-full py-3 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded text-sm font-medium transition-colors"
        >
          Analyze Transaction
        </button>
        
        <div className="flex flex-wrap justify-center gap-2 w-full">
            <button onClick={() => setText(sample270)} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors">Load 270</button>
            <button onClick={() => setText(sample271)} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors">Load 271</button>
            <button onClick={() => setText(sample276)} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors">Load 276</button>
            <button onClick={() => setText(sample277)} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors">Load 277</button>
        </div>
      </div>
    </div>
  );
};