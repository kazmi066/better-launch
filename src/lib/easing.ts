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

export function easeOutBounce(t: number): number {
  const x = clamp(t);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) {
    const x2 = x - 1.5 / d1;
    return n1 * x2 * x2 + 0.75;
  }
  if (x < 2.5 / d1) {
    const x2 = x - 2.25 / d1;
    return n1 * x2 * x2 + 0.9375;
  }
  const x2 = x - 2.625 / d1;
  return n1 * x2 * x2 + 0.984375;
}

export function easeInOutPower3(t: number): number {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
