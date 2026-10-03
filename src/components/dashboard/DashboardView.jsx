import svgPaths from "./dashboard-svg-paths.js";
function RiFileList3Line({ className }) {
    return (<div className={className || "h-[32px] relative w-[31px]"}>
      <div className="absolute inset-[8.33%]">
        <svg className="absolute block inset-0 size-full" fill="none" height="26.6667" preserveAspectRatio="none" viewBox="0 0 25.8333 26.6667" width="25.8333">
          <path d={svgPaths.p5c22af0} fill="black" id="Vector"/>
        </svg>
      </div>
    </div>);
}
function ClarityMapSolidBadged({ className }) {
    return (<div className={className || "relative size-[27px]"}>
      <div className="absolute inset-[14.64%_5.56%_10.72%_5.56%]">
        <svg className="absolute block inset-0 size-full" fill="none" height="20.1525" preserveAspectRatio="none" viewBox="0 0 24 20.1525" width="24">
          <path d={svgPaths.p2df584f0} fill="black" id="Vector"/>
        </svg>
      </div>
      <div className="absolute inset-[2.78%_2.78%_69.44%_69.44%]">
        <svg className="absolute block inset-0 size-full" fill="none" height="7.5" preserveAspectRatio="none" viewBox="0 0 7.5 7.5" width="7.5">
          <path d={svgPaths.p37d6ea80} fill="black" id="Vector"/>
        </svg>
      </div>
      <svg className="absolute block inset-0 size-full" fill="none" height="32" preserveAspectRatio="none" viewBox="0 0 32 32" width="32">
        <g id="Vector"/>
      </svg>
    </div>);
}
function AkarIconsStar({ className }) {
    return (<div className={className || "relative size-[24px]"}>
      <div className="absolute inset-[8.33%_-20.83%_-25%_8.33%]">
        <div className="absolute inset-[-3.57%_-3.69%_-3.63%_-3.69%]">
          <svg className="block size-full" fill="none" height="30.0153" preserveAspectRatio="none" viewBox="0 0 28.9939 30.0153" width="28.9939">
            <path d={svgPaths.p2b8db100} id="Vector" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </div>);
}
function ReiconFolderFiles({ className }) {
    return (<div className={className || "h-[32px] relative w-[31px]"}>
      <div className="absolute inset-[5.2%_5.21%_5.21%_5.21%]">
        <svg className="absolute block inset-0 size-full" fill="none" height="28.668" preserveAspectRatio="none" viewBox="0 0 27.7708 28.668" width="27.7708">
          <path clipRule="evenodd" d={svgPaths.p15e49300} fill="black" fillRule="evenodd" id="Vector"/>
        </svg>
      </div>
    </div>);
}
function Heading({ userName }) {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <p className="[word-break:break-word] font-bold leading-[32px] not-italic relative shrink-0 text-[#0a0b14] text-[36px] whitespace-nowrap">Welcome back, {userName} 👋</p>
    </div>);
}
function Paragraph() {
    return (<div className="content-stretch flex flex-col h-[24px] items-start pt-[4px] relative shrink-0 w-[895.2px]">
      <p className="[word-break:break-word] font-normal leading-[20px] not-italic relative shrink-0 text-[#64748b] text-[24px] whitespace-nowrap">{`Here's your career readiness overview for today.`}</p>
    </div>);
}
function ReadinessGauge() {
    return (<div className="overflow-clip relative shrink-0 size-[140px]">
      <div className="absolute inset-[11.43%]">
        <div className="absolute inset-[-4.63%]">
          <svg className="block size-full" fill="none" height="118" preserveAspectRatio="none" viewBox="0 0 118 118" width="118">
            <path d={svgPaths.p971c880} id="Vector" stroke="white" strokeOpacity="0.06" strokeWidth="10"/>
          </svg>
        </div>
      </div>
      <div className="absolute flex inset-[11.43%] items-center justify-center" style={{ containerType: "size" }}>
        <div className="-rotate-90 flex-none h-[100cqw] w-[100cqh]">
          <div className="relative size-full">
            <div className="absolute inset-[-4.63%]">
              <svg className="block size-full" fill="none" height="118" preserveAspectRatio="none" viewBox="0 0 118 118" width="118">
                <path d={svgPaths.p971c880} id="Vector" stroke="url(#paint0_linear_0_24)" strokeDasharray="227.33 111.97" strokeLinecap="round" strokeWidth="10"/>
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_0_24" x1="5" x2="113" y1="5" y2="5">
                    <stop stopColor="#3B8BFF"/>
                    <stop offset="1" stopColor="#7C3AED"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-bold inset-[26.43%_37.14%_49.29%_37.14%] leading-[normal] not-italic text-[28px] text-center text-white whitespace-nowrap">67</p>
      <p className="[word-break:break-word] absolute font-normal inset-[52.14%_40.71%_38.57%_40.71%] leading-[normal] not-italic text-[11px] text-[rgba(255,255,255,0.4)] text-center whitespace-nowrap">/ 100</p>
    </div>);
}
function ParagraphMargin() {
    return (<div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0">
      <p className="[word-break:break-word] font-semibold leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)] whitespace-nowrap">Readiness Score</p>
    </div>);
}
function ParagraphMargin1() {
    return (<div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.4)] whitespace-nowrap">Software Engineer</p>
    </div>);
}
function Button() {
    return (<div className="bg-gradient-to-r content-stretch flex flex-col from-[#3b8bff] items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 to-[#7c3aed]">
      <p className="[word-break:break-word] font-semibold leading-[16px] not-italic relative shrink-0 text-[12px] text-center text-white whitespace-nowrap">View Roadmap →</p>
    </div>);
}
function ButtonMargin() {
    return (<div className="content-stretch flex flex-col items-start pt-[16px] relative shrink-0">
      <Button />
    </div>);
}
function Container2() {
    return <div className="absolute left-[143.46px] rounded-[26843500px] size-[200px] top-[-60px]" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(0 -14.142 -14.142 0 100 100)'><stop stop-color='rgba(59,139,255,0.15)' offset='0'/><stop stop-color='rgba(59,139,255,0)' offset='0.7'/></radialGradient></defs></svg>\")" }}/>;
}
function Container1() {
    return (<div className="border-[0.8px] border-[rgba(255,255,255,0.08)] border-solid col-1 content-stretch flex flex-col items-center justify-center justify-self-start overflow-clip p-[24px] relative rounded-[16px] row-1 self-stretch shrink-0 w-[313px]" style={{ backgroundImage: "linear-gradient(137.82372276401642deg, rgb(13, 15, 36) 0%, rgb(26, 29, 64) 100%)" }}>
      <ReadinessGauge />
      <ParagraphMargin />
      <ParagraphMargin1 />
      <ButtonMargin />
      <Container2 />
    </div>);
}
function Container4() {
    return <div className="absolute left-[-40px] rounded-[26843500px] size-[200px] top-[-40px]" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(0 -14.142 -14.142 0 100 100)'><stop stop-color='rgba(124,58,237,0.12)' offset='0'/><stop stop-color='rgba(124,58,237,0)' offset='0.7'/></radialGradient></defs></svg>\")" }}/>;
}
function Container7() {
    return (<div className="bg-[rgba(59,139,255,0.15)] border-[0.8px] border-[rgba(59,139,255,0.2)] border-solid content-stretch flex flex-col items-start px-[10px] py-[4px] relative rounded-[26843500px] shrink-0">
      <p className="[word-break:break-word] font-semibold leading-[16px] not-italic relative shrink-0 text-[#7ca8ff] text-[12px] whitespace-nowrap">⚡ Next Best Action</p>
    </div>);
}
function Container6() {
    return (<div className="content-stretch flex items-center relative shrink-0 w-full">
      <Container7 />
    </div>);
}
function Heading1() {
    return (<div className="content-stretch flex flex-col h-[44px] items-start pt-[16px] relative shrink-0 w-[540.538px]">
      <p className="[word-break:break-word] font-bold leading-[28px] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">Complete Python Intermediate Assessment</p>
    </div>);
}
function Paragraph1() {
    return (<div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-[540.538px]">
      <p className="[word-break:break-word] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.5)] w-[541px]">Completing this assessment closes your largest skill gap and unlocks Phase 2 of your roadmap.</p>
    </div>);
}
function Text() {
    return (<div className="bg-[rgba(255,255,255,0.06)] border-[0.8px] border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-start px-[12px] py-[6px] relative rounded-[8px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] whitespace-nowrap">Closes Python gap</p>
    </div>);
}
function Text1() {
    return (<div className="bg-[rgba(255,255,255,0.06)] border-[0.8px] border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-start px-[12px] py-[6px] relative rounded-[8px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] whitespace-nowrap">Unlocks Phase 2</p>
    </div>);
}
function Text2() {
    return (<div className="bg-[rgba(255,255,255,0.06)] border-[0.8px] border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-start px-[12px] py-[6px] relative rounded-[8px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] whitespace-nowrap">Improves score +8pts</p>
    </div>);
}
function Container8() {
    return (<div className="content-stretch flex gap-[12px] h-[69.6px] items-start py-[20px] relative shrink-0 w-[540.538px]">
      <Text />
      <Text1 />
      <Text2 />
    </div>);
}
function Button1() {
    return (<div className="absolute bg-gradient-to-r drop-shadow-[0px_4px_8px_rgba(59,139,255,0.3)] from-[#3b8bff] h-[40px] left-0 rounded-[12px] to-[#7c3aed] top-0 w-[177.475px]">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-semibold leading-[20px] left-[89px] not-italic text-[14px] text-center text-white top-[10.6px] whitespace-nowrap">Start Assessment →</p>
    </div>);
}
function Container9() {
    return (<div className="h-[40px] relative shrink-0 w-full">
      <Button1 />
    </div>);
}
function Container5() {
    return (<div className="absolute content-stretch flex flex-col gap-[3px] items-start left-[53.14px] top-[24.2px] w-[598px]">
      <Container6 />
      <Heading1 />
      <Paragraph1 />
      <Container8 />
      <Container9 />
    </div>);
}
function Container3() {
    return (<div className="border-[0.8px] border-[rgba(255,255,255,0.08)] border-solid col-[2/span_2] h-[284px] justify-self-start overflow-clip relative rounded-[16px] row-1 self-start shrink-0 w-[749px]" style={{ backgroundImage: "linear-gradient(159.2346637054649deg, rgb(13, 15, 36) 0%, rgb(26, 29, 64) 100%)" }}>
      <Container4 />
      <Container5 />
    </div>);
}
function Container() {
    return (<div className="gap-x-[70px] gap-y-[50px] grid grid-cols-[___285.06px_285.06px_285.06px] grid-rows-[_283.58px] relative shrink-0 w-full">
      <Container1 />
      <Container3 />
    </div>);
}
function ContainerMargin() {
    return (<div className="content-stretch flex flex-col items-start pt-[28px] relative shrink-0 w-full">
      <Container />
    </div>);
}
function Text3() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <ReiconFolderFiles className="h-[32px] relative shrink-0 w-[31px]"/>
    </div>);
}
function Text4() {
    return (<div className="bg-[rgba(59,139,255,0.08)] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[26843500px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[#3b8bff] text-[12px] whitespace-nowrap">1 submission due</p>
    </div>);
}
function Container12() {
    return (<div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <Text3 />
      <Text4 />
    </div>);
}
function Paragraph2() {
    return (<div className="content-stretch flex flex-col h-[44px] items-start pt-[12px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-bold leading-[32px] not-italic relative shrink-0 text-[#0a0b14] text-[24px] whitespace-nowrap">2</p>
    </div>);
}
function Paragraph3() {
    return (<div className="content-stretch flex flex-col h-[22px] items-start pt-[2px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-normal leading-[20px] not-italic relative shrink-0 text-[#64748b] text-[14px] whitespace-nowrap">Active Projects</p>
    </div>);
}
function Container11() {
    return (<div className="bg-white border-[#e8eaf0] border-[0.8px] border-solid col-1 content-stretch flex flex-col items-start pl-[43px] pr-[20px] py-[20px] relative rounded-[16px] row-1 self-stretch shrink-0 w-[256px]">
      <Container12 />
      <Paragraph2 />
      <Paragraph3 />
    </div>);
}
function Text5() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <AkarIconsStar className="relative shrink-0 size-[24px]"/>
    </div>);
}
function Text6() {
    return (<div className="bg-[rgba(124,58,237,0.08)] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[26843500px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[#7c3aed] text-[12px] whitespace-nowrap">of 24 required</p>
    </div>);
}
function Container14() {
    return (<div className="content-stretch flex items-start justify-between relative shrink-0 w-[170.2px]">
      <Text5 />
      <Text6 />
    </div>);
}
function Paragraph4() {
    return (<div className="content-stretch flex flex-col h-[44px] items-start pt-[12px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-bold leading-[32px] not-italic relative shrink-0 text-[#0a0b14] text-[24px] whitespace-nowrap">18</p>
    </div>);
}
function Paragraph5() {
    return (<div className="content-stretch flex flex-col h-[22px] items-start pt-[2px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-normal leading-[20px] not-italic relative shrink-0 text-[#64748b] text-[14px] whitespace-nowrap">Skills Assessed</p>
    </div>);
}
function Container13() {
    return (<div className="bg-white border-[#e8eaf0] border-[0.8px] border-solid col-2 content-stretch flex flex-col items-start pl-[36px] pr-[20px] py-[20px] relative rounded-[16px] row-1 self-stretch shrink-0 w-[256px]">
      <Container14 />
      <Paragraph4 />
      <Paragraph5 />
    </div>);
}
function Text7() {
    return (<div className="content-stretch flex flex-col h-[27px] items-start relative shrink-0 w-[34px]">
      <ClarityMapSolidBadged className="relative shrink-0 size-[27px]"/>
    </div>);
}
function Text8() {
    return (<div className="bg-[rgba(5,150,105,0.08)] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[26843500px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[#059669] text-[12px] whitespace-nowrap">Phase 2 of 4</p>
    </div>);
}
function Container16() {
    return (<div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <Text7 />
      <Text8 />
    </div>);
}
function Paragraph6() {
    return (<div className="content-stretch flex flex-col h-[44px] items-start pt-[12px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-bold leading-[32px] not-italic relative shrink-0 text-[#0a0b14] text-[24px] whitespace-nowrap">35%</p>
    </div>);
}
function Paragraph7() {
    return (<div className="content-stretch flex flex-col h-[22px] items-start pt-[2px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-normal leading-[20px] not-italic relative shrink-0 text-[#64748b] text-[14px] whitespace-nowrap">Roadmap Progress</p>
    </div>);
}
function Container15() {
    return (<div className="bg-white border-[#e8eaf0] border-[0.8px] border-solid col-3 content-stretch flex flex-col items-start pl-[43px] pr-[20px] py-[20px] relative rounded-[16px] row-1 self-stretch shrink-0 w-[256px]">
      <Container16 />
      <Paragraph6 />
      <Paragraph7 />
    </div>);
}
function Text9() {
    return (<div className="content-stretch flex flex-col h-[32px] items-start relative shrink-0 w-[29px]">
      <RiFileList3Line className="h-[32px] relative shrink-0 w-[31px]"/>
    </div>);
}
function Text10() {
    return (<div className="bg-[rgba(245,158,11,0.08)] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[26843500px] shrink-0">
      <p className="[word-break:break-word] font-medium leading-[16px] not-italic relative shrink-0 text-[#f59e0b] text-[12px] whitespace-nowrap">4 verified</p>
    </div>);
}
function Container18() {
    return (<div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <Text9 />
      <Text10 />
    </div>);
}
function Paragraph8() {
    return (<div className="content-stretch flex flex-col h-[44px] items-start pt-[12px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-bold leading-[32px] not-italic relative shrink-0 text-[#0a0b14] text-[24px] whitespace-nowrap">9</p>
    </div>);
}
function Paragraph9() {
    return (<div className="content-stretch flex flex-col h-[22px] items-start pt-[2px] relative shrink-0 w-[170.2px]">
      <p className="[word-break:break-word] font-normal leading-[20px] not-italic relative shrink-0 text-[#64748b] text-[14px] whitespace-nowrap">Record Items</p>
    </div>);
}
function Container17() {
    return (<div className="bg-white border-[#e8eaf0] border-[0.8px] border-solid col-4 content-stretch flex flex-col items-start justify-self-start pl-[43px] pr-[20px] py-[20px] relative rounded-[16px] row-1 self-stretch shrink-0 w-[256px]">
      <Container18 />
      <Paragraph8 />
      <Paragraph9 />
    </div>);
}
function Container10() {
    return (<div className="gap-x-[70px] gap-y-[16px] grid-cols-[____211.80px_211.80px_211.80px_211.80px] grid-rows-[_139.57px] inline-grid relative shrink-0">
      <Container11 />
      <Container13 />
      <Container15 />
      <Container17 />
    </div>);
}
function ContainerMargin1() {
    return (<div className="content-stretch flex flex-col items-start pt-[24px] relative shrink-0 w-full">
      <Container10 />
    </div>);
}
function Heading2() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-bold leading-[24px] not-italic relative shrink-0 text-[#0a0b14] text-[16px] whitespace-nowrap">Top Skill Gaps</p>
    </div>);
}
function Button2() {
    return (<div className="content-stretch flex flex-col items-center justify-center relative shrink-0">
      <p className="[word-break:break-word] font-semibold leading-[16px] not-italic relative shrink-0 text-[#5b6ef5] text-[12px] text-center whitespace-nowrap">View All →</p>
    </div>);
}
function Container21() {
    return (<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Heading2 />
      <Button2 />
    </div>);
}
function Text11() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-medium leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">Python</p>
    </div>);
}
function Text12() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#64748b] text-[12px] whitespace-nowrap">Lv 3/4</p>
    </div>);
}
function Container24() {
    return (<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Text11 />
      <Text12 />
    </div>);
}
function Container26() {
    return <div className="bg-[#f59e0b] h-[8px] relative rounded-[26843500px] shrink-0 w-[291px]"/>;
}
function Container25() {
    return (<div className="bg-[#f1f3fa] content-stretch flex flex-col h-[8px] items-start overflow-clip relative rounded-[26843500px] shrink-0 w-full">
      <Container26 />
    </div>);
}
function ContainerMargin3() {
    return (<div className="content-stretch flex flex-col items-start pt-[6px] relative shrink-0 w-full">
      <Container25 />
    </div>);
}
function Container23() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Container24 />
      <ContainerMargin3 />
    </div>);
}
function Text13() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-medium leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">React</p>
    </div>);
}
function Text14() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#64748b] text-[12px] whitespace-nowrap">Lv 2/3</p>
    </div>);
}
function Container28() {
    return (<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Text13 />
      <Text14 />
    </div>);
}
function Container30() {
    return <div className="bg-[#f59e0b] h-[8px] relative rounded-[26843500px] shrink-0 w-[258.663px]"/>;
}
function Container29() {
    return (<div className="bg-[#f1f3fa] content-stretch flex flex-col h-[8px] items-start overflow-clip relative rounded-[26843500px] shrink-0 w-full">
      <Container30 />
    </div>);
}
function ContainerMargin4() {
    return (<div className="content-stretch flex flex-col items-start pt-[6px] relative shrink-0 w-full">
      <Container29 />
    </div>);
}
function Container27() {
    return (<div className="content-stretch flex flex-col h-[50px] items-start pt-[16px] relative shrink-0 w-[388px]">
      <Container28 />
      <ContainerMargin4 />
    </div>);
}
function Text15() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-medium leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">Tableau</p>
    </div>);
}
function Text16() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#64748b] text-[12px] whitespace-nowrap">Lv 0/2</p>
    </div>);
}
function Container32() {
    return (<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Text15 />
      <Text16 />
    </div>);
}
function Container34() {
    return <div className="bg-[#ef4444] h-[8px] relative shrink-0 w-0"/>;
}
function Container33() {
    return (<div className="bg-[#f1f3fa] content-stretch flex flex-col h-[8px] items-start overflow-clip relative rounded-[26843500px] shrink-0 w-full">
      <Container34 />
    </div>);
}
function ContainerMargin5() {
    return (<div className="content-stretch flex flex-col items-start pt-[6px] relative shrink-0 w-full">
      <Container33 />
    </div>);
}
function Container31() {
    return (<div className="content-stretch flex flex-col h-[50px] items-start pt-[16px] relative shrink-0 w-[388px]">
      <Container32 />
      <ContainerMargin5 />
    </div>);
}
function Text17() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-medium leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">Pandas</p>
    </div>);
}
function Text18() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#64748b] text-[12px] whitespace-nowrap">Lv 2/3</p>
    </div>);
}
function Container36() {
    return (<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Text17 />
      <Text18 />
    </div>);
}
function Container38() {
    return <div className="bg-[#f59e0b] h-[8px] relative rounded-[26843500px] shrink-0 w-[258.663px]"/>;
}
function Container37() {
    return (<div className="bg-[#f1f3fa] content-stretch flex flex-col h-[8px] items-start overflow-clip relative rounded-[26843500px] shrink-0 w-full">
      <Container38 />
    </div>);
}
function ContainerMargin6() {
    return (<div className="content-stretch flex flex-col items-start pt-[6px] relative shrink-0 w-full">
      <Container37 />
    </div>);
}
function Container35() {
    return (<div className="content-stretch flex flex-col h-[50px] items-start pt-[16px] relative shrink-0 w-[388px]">
      <Container36 />
      <ContainerMargin6 />
    </div>);
}
function Container22() {
    return (<div className="content-stretch flex flex-col h-[204px] items-start pt-[20px] relative shrink-0 w-[388px]">
      <Container23 />
      <Container27 />
      <Container31 />
      <Container35 />
    </div>);
}
function Container20() {
    return (<div className="bg-white border-[#e8eaf0] border-[0.8px] border-solid col-1 content-stretch flex flex-col items-start justify-self-start pl-[63px] pr-[24px] py-[24px] relative rounded-[16px] row-1 self-stretch shrink-0">
      <Container21 />
      <Container22 />
    </div>);
}
function Heading3() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0">
      <p className="[word-break:break-word] font-bold leading-[24px] not-italic relative shrink-0 text-[#0a0b14] text-[16px] whitespace-nowrap">Recommended Projects</p>
    </div>);
}
function Button3() {
    return (<div className="content-stretch flex flex-col items-center justify-center relative shrink-0">
      <p className="[word-break:break-word] font-semibold leading-[16px] not-italic relative shrink-0 text-[#5b6ef5] text-[12px] text-center whitespace-nowrap">Browse All →</p>
    </div>);
}
function Container40() {
    return (<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Heading3 />
      <Button3 />
    </div>);
}
function Container43() {
    return (<div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" style={{ backgroundImage: "linear-gradient(135deg, rgb(59, 139, 255) 0%, rgb(124, 58, 237) 100%)" }}>
      <p className="[word-break:break-word] font-bold leading-[16px] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">TE</p>
    </div>);
}
function Paragraph10() {
    return (<div className="content-stretch flex flex-col h-[20px] items-start overflow-clip relative shrink-0 w-full">
      <p className="[word-break:break-word] font-semibold leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">Customer Analytics Dashboard</p>
    </div>);
}
function Paragraph11() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#94a3b8] text-[12px] whitespace-nowrap">TechCorp · 4 weeks</p>
    </div>);
}
function Container44() {
    return (<div className="content-stretch flex flex-[258.587_0_0] flex-col items-start min-w-px relative">
      <Paragraph10 />
      <Paragraph11 />
    </div>);
}
function Text19() {
    return (<div className="bg-[rgba(59,139,255,0.08)] content-stretch flex flex-col items-start px-[8px] py-[4px] relative rounded-[8px] shrink-0">
      <p className="[word-break:break-word] font-bold leading-[16px] not-italic relative shrink-0 text-[#3b8bff] text-[12px] whitespace-nowrap">88%</p>
    </div>);
}
function Container42() {
    return (<div className="border-[#f1f3fa] border-[0.8px] border-solid content-stretch flex gap-[12px] items-start p-[12px] relative rounded-[12px] shrink-0 w-[388px]">
      <Container43 />
      <Container44 />
      <Text19 />
    </div>);
}
function Container46() {
    return (<div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" style={{ backgroundImage: "linear-gradient(135deg, rgb(5, 150, 105) 0%, rgb(16, 185, 129) 100%)" }}>
      <p className="[word-break:break-word] font-bold leading-[16px] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">SK</p>
    </div>);
}
function Paragraph12() {
    return (<div className="content-stretch flex flex-col h-[20px] items-start overflow-clip relative shrink-0 w-full">
      <p className="[word-break:break-word] font-semibold leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">E-commerce REST API</p>
    </div>);
}
function Paragraph13() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#94a3b8] text-[12px] whitespace-nowrap">SkillSpan · 3 weeks</p>
    </div>);
}
function Container47() {
    return (<div className="content-stretch flex flex-[259.813_0_0] flex-col items-start min-w-px relative">
      <Paragraph12 />
      <Paragraph13 />
    </div>);
}
function Text20() {
    return (<div className="bg-[rgba(59,139,255,0.08)] content-stretch flex flex-col items-start px-[8px] py-[4px] relative rounded-[8px] shrink-0">
      <p className="[word-break:break-word] font-bold leading-[16px] not-italic relative shrink-0 text-[#3b8bff] text-[12px] whitespace-nowrap">74%</p>
    </div>);
}
function Container45() {
    return (<div className="border-[#f1f3fa] border-[0.8px] border-solid content-stretch flex gap-[12px] items-start p-[12px] relative rounded-[12px] shrink-0 w-[388px]">
      <Container46 />
      <Container47 />
      <Text20 />
    </div>);
}
function ContainerMargin7() {
    return (<div className="content-stretch flex flex-col items-start pt-[12px] relative shrink-0 w-full">
      <Container45 />
    </div>);
}
function Container49() {
    return (<div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]" style={{ backgroundImage: "linear-gradient(135deg, rgb(59, 139, 255) 0%, rgb(124, 58, 237) 100%)" }}>
      <p className="[word-break:break-word] font-bold leading-[16px] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">DA</p>
    </div>);
}
function Paragraph14() {
    return (<div className="content-stretch flex flex-col h-[20px] items-start overflow-clip relative shrink-0 w-full">
      <p className="[word-break:break-word] font-semibold leading-[20px] not-italic relative shrink-0 text-[#0a0b14] text-[14px] whitespace-nowrap">ML Sentiment Analysis</p>
    </div>);
}
function Paragraph15() {
    return (<div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <p className="[word-break:break-word] font-normal leading-[16px] not-italic relative shrink-0 text-[#94a3b8] text-[12px] whitespace-nowrap">DataLabs · 6 weeks</p>
    </div>);
}
function Container50() {
    return (<div className="content-stretch flex flex-[261.238_0_0] flex-col items-start min-w-px relative">
      <Paragraph14 />
      <Paragraph15 />
    </div>);
}
function Text21() {
    return (<div className="bg-[rgba(59,139,255,0.08)] content-stretch flex flex-col items-start px-[8px] py-[4px] relative rounded-[8px] shrink-0">
      <p className="[word-break:break-word] font-bold leading-[16px] not-italic relative shrink-0 text-[#3b8bff] text-[12px] whitespace-nowrap">61%</p>
    </div>);
}
function Container48() {
    return (<div className="border-[#f1f3fa] border-[0.8px] border-solid content-stretch flex gap-[12px] items-start p-[12px] relative rounded-[12px] shrink-0 w-[388px]">
      <Container49 />
      <Container50 />
      <Text21 />
    </div>);
}
function ContainerMargin8() {
    return (<div className="content-stretch flex flex-col items-start pt-[12px] relative shrink-0 w-full">
      <Container48 />
    </div>);
}
function Container41() {
    return (<div className="content-stretch flex flex-col h-[228.8px] items-start pt-[20px] relative shrink-0 w-[388px]">
      <Container42 />
      <ContainerMargin7 />
      <ContainerMargin8 />
    </div>);
}
function Container39() {
    return (<div className="bg-white border-[#e8eaf0] border-[0.8px] border-solid col-2 content-stretch flex flex-col items-start justify-self-start pl-[63px] pr-[24px] py-[24px] relative rounded-[16px] row-1 self-stretch shrink-0 w-[520px]">
      <Container40 />
      <Container41 />
    </div>);
}
function Container19() {
    return (<div className="gap-x-[140px] gap-y-[50px] grid-cols-[__437.60px_437.60px] grid-rows-[_302.40px] inline-grid relative shrink-0">
      <Container20 />
      <Container39 />
    </div>);
}
function ContainerMargin2() {
    return (<div className="content-stretch flex flex-col items-start pt-[24px] relative shrink-0 w-full">
      <Container19 />
    </div>);
}
export default function DashboardView({ userName = "Ahmed" }) {
    return (<div className="flex flex-col gap-[11px] items-start min-h-full px-[32px] py-[32px] relative w-full max-w-[1232px]">
      <Heading userName={userName}/>
      <Paragraph />
      <ContainerMargin />
      <ContainerMargin1 />
      <ContainerMargin2 />
    </div>);
}
