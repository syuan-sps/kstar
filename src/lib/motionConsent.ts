export function homeEntryMotionClass(flashOk: string | null, entry: boolean): string | undefined {
  if (!entry) return undefined;
  return flashOk === "1" ? "intro-flash" : "wiz-develop";
}
