/** Compare exact source lines in order, including repeated lines and indentation. */
export function codeDifference(before: string, after: string) {
  const a = before.replace(/\r\n/g, "\n").split("\n");
  const b = after.replace(/\r\n/g, "\n").split("\n");
  const yours = new Set<number>(), solution = new Set<number>();
  // Bound memory for very large reports; preserve an exact common prefix/suffix.
  if (a.length * b.length > 250000) {
    let start = 0, endA = a.length, endB = b.length;
    while (start < endA && start < endB && a[start] === b[start]) start++;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
    for (let i = start; i < endA; i++) yours.add(i);
    for (let j = start; j < endB; j++) solution.add(j);
    return { yours, solution };
  }
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { i++; j++; }
    else if (i < a.length && (j === b.length || table[i + 1][j] >= table[i][j + 1])) yours.add(i++);
    else solution.add(j++);
  }
  return { yours, solution };
}
