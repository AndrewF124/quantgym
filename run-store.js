// One entry per run prevents independent tabs from overwriting each other's history.
const prefix = owner => `quantgym-run-v1:${owner || 'guest'}:`;
export function readRuns(storage, owner) {
  const records = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix(owner))) continue;
    try {
      const entry = JSON.parse(storage.getItem(key));
      if (entry?.row?.id && entry.row.user_id === (owner || null)) records.push(entry);
    } catch { /* A damaged entry must not hide the other runs. */ }
  }
  return records.sort((a,b)=>b.row.completed_at.localeCompare(a.row.completed_at));
}
export function writeRun(storage, row, pending = false) {
  const key=prefix(row.user_id) + row.id, value=JSON.stringify({row, pending});
  if(storage.getItem(key)!==value)storage.setItem(key,value);
}
export function mergeRuns(...groups) {
  return [...new Map(groups.flat().map(row=>[row.id,row])).values()]
    .sort((a,b)=>b.completed_at.localeCompare(a.completed_at));
}
export function migratePending(storage, owner) {
  const key = `quantgym-pending-${owner}`;
  let old;
  try { old = JSON.parse(storage.getItem(key) || '[]'); } catch { return; }
  if (!Array.isArray(old)) return;
  for (const row of old) {
    if (row?.id && row.user_id === owner && !storage.getItem(prefix(owner)+row.id)) writeRun(storage,row,true);
  }
  // Remove only after every legacy run has been retained.
  storage.removeItem(key);
}
