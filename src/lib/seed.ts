export const mulberry32 = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const seededPick = <T,>(items: T[], seed: number) => {
  const random = mulberry32(seed)();
  const index = Math.floor(random * items.length);
  return items[Math.max(0, Math.min(index, items.length - 1))];
};
