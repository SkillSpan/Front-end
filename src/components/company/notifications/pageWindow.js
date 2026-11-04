// 1 … 4 5 6 … 12 — first, last, current ±1.
export function pageWindow(page, lastPage) {
  const pages = new Set([1, lastPage, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push(p - list[i - 1] === 2 ? p - 1 : `gap-${p}`);
    out.push(p);
  });
  return out;
}
