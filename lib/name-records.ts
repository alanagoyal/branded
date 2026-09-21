export type NameRecord = { id: string; name: string };

// A display name is not unique. Merge repeated loads of the same record only.
export function mergeNameRecords(...groups: readonly NameRecord[][]): NameRecord[] {
  const records = new Map<string, NameRecord>();
  for (const group of groups) {
    for (const record of group) {
      if (!records.has(record.id)) records.set(record.id, { id: record.id, name: record.name });
    }
  }
  return Array.from(records.values());
}

export function removeNameRecord(records: NameRecord[], id: string): NameRecord[] {
  return records.filter((record) => record.id !== id);
}
