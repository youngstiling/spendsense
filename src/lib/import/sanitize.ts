/** Strip control chars and limit length for DB safety */
export function sanitizeCell(value: string, maxLen = 500): string {
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}
