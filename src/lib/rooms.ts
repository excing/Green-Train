export function roomId(trainId: string, date: string, from: string, to: string): string {
  return `gt-${trainId}-${date}-${from}-${to}`.replace(/\s+/g, '_');
}

export function topic(trainName: string, theme: string | undefined, date: string): string {
  return `${trainName} · ${theme ?? '主题列车'} · ${date}`;
}
