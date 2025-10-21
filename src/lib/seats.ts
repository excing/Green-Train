// 座位分配辅助：提供顺序占位与种子伪随机选座算法

/**
 * 座位信息结构
 */
export interface Seat {
  carriage: number; // 车厢号
  row: number; // 排号
  seat: string; // 座位号（A/B/C/D）
}

/**
 * 顺序分配座位：从第一节车厢、第一排、A 座开始依次分配
 * @param totalCarriages 总车厢数
 * @param rowsPerCarriage 每车厢排数
 * @param count 需要分配的座位数量
 * @returns 座位列表
 */
export function sequential(totalCarriages: number, rowsPerCarriage: number, count: number): Seat[] {
  const out: Seat[] = [];
  // 依次遍历车厢、排、座位
  outer: for (let c = 1; c <= totalCarriages; c++) {
    for (let r = 1; r <= rowsPerCarriage; r++) {
      for (const s of ['A', 'B', 'C', 'D']) {
        out.push({ carriage: c, row: r, seat: s });
        if (out.length >= count) break outer; // 达到数量即退出
      }
    }
  }
  return out;
}

/**
 * Mulberry32 伪随机数生成器（基于种子）
 * @param a 随机种子
 * @returns 返回一个生成 [0, 1) 范围内随机数的函数
 */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 智能随机分配座位：使用伪随机算法分散分配座位
 * @param totalCarriages 总车厢数
 * @param rowsPerCarriage 每车厢排数
 * @param count 需要分配的座位数量
 * @param seed 随机种子，相同种子生成相同结果
 * @returns 座位列表
 */
export function smart_random(totalCarriages: number, rowsPerCarriage: number, count: number, seed = 1): Seat[] {
  const rng = mulberry32(seed);
  const seats: Seat[] = [];
  const taken = new Set<string>(); // 记录已分配的座位
  const totalRows = totalCarriages * rowsPerCarriage;
  // 随机选取座位直至满足数量
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * totalRows);
    const carriage = Math.floor(idx / rowsPerCarriage) + 1;
    const row = (idx % rowsPerCarriage) + 1;
    const seat = ['A', 'B', 'C', 'D'][Math.floor(rng() * 4)];
    const key = `${carriage}-${row}-${seat}`;
    if (taken.has(key)) { i--; continue; } // 已占用则重试
    taken.add(key);
    seats.push({ carriage, row, seat });
  }
  return seats;
}
