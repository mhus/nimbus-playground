export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
