// "Skills assessed" on the dashboard reads N/Total, where Total is the number
// of skills the chosen role requires. The matrix can hold the same skill more
// than once (re-assessments) and skills the role does not require, so a raw
// row count could read "12/10". Count each skill once, and never above Total.
export function countAssessedSkills(rows, total) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = new Set();
  list.forEach((row, i) => {
    const id = row?.skill_id ?? row?.skill?.id ?? row?.skillId ?? row?.id ?? `row-${i}`;
    ids.add(String(id));
  });
  const distinct = ids.size;
  const cap = Number(total);
  return Number.isFinite(cap) && cap > 0 ? Math.min(distinct, cap) : distinct;
}
