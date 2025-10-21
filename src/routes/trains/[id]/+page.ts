/**
 * 列车详情页数据加载器
 * 获取指定车次及请求查询参数
 */
import type { PageLoad } from './$types';
import type { Train } from '$lib/types';

export const load: PageLoad = async ({ fetch, params, url }) => {
  // 加载所有列车数据
  const res = await fetch('/data/trains.json');
  const trains: Train[] = await res.json();
  // 查找指定 ID 的列车
  const train = trains.find((t) => t.id === params.id);
  // 返回列车对象及 URL 查询参数（date, from, to 等）
  return { train, query: Object.fromEntries(url.searchParams) };
};
