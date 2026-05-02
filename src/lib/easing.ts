export function clamp(v: number, lo = 0, hi = 1): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function easeOutPower3(t: number): number {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeOutPower4(t: number): number {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 4);
}

export function easeOutBack(t: number, c1 = 1.70158): number {
  const x = clamp(t);
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
