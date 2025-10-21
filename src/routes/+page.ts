/**
 * 首页数据加载器
 * 加载全部车次供首页筛选使用
 */
import type { PageLoad } from './$types';
import type { Train } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
  // 从静态数据文件加载所有列车信息
  const res = await fetch('/data/trains.json');
  const trains: Train[] = await res.json();
  return { trains };
};
