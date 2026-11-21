// The SkillSpan logo always sits on a light-blue tile — it disappears on the
// navy bar otherwise (brand rule: never place the logo directly on navy).
export default function SkillSpanMark() {
  return (
    <>
      <span className="cw-logo-tile"><img src="/image/skillspan-mark.png" alt="" /></span>
      <span className="cw-word">Skill<b>Span</b></span>
    </>
  );
}
