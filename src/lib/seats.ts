// 简单占位：顺序与带种子的伪随机

export interface Seat { carriage: number; row: number; seat: string }

export function sequential(totalCarriages: number, rowsPerCarriage: number, count: number): Seat[] {
  const out: Seat[] = [];
  outer: for (let c = 1; c <= totalCarriages; c++) {
    for (let r = 1; r <= rowsPerCarriage; r++) {
      for (const s of ['A', 'B', 'C', 'D']) {
        out.push({ carriage: c, row: r, seat: s });
        if (out.length >= count) break outer;
      }
    }
  }
  return out;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smart_random(totalCarriages: number, rowsPerCarriage: number, count: number, seed = 1): Seat[] {
  const rng = mulberry32(seed);
  const seats: Seat[] = [];
  const taken = new Set<string>();
  const totalRows = totalCarriages * rowsPerCarriage;
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * totalRows);
    const carriage = Math.floor(idx / rowsPerCarriage) + 1;
    const row = (idx % rowsPerCarriage) + 1;
    const seat = ['A', 'B', 'C', 'D'][Math.floor(rng() * 4)];
    const key = `${carriage}-${row}-${seat}`;
    if (taken.has(key)) { i--; continue; }
    taken.add(key);
    seats.push({ carriage, row, seat });
  }
  return seats;
}
