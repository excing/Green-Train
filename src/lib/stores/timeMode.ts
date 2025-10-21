// 用户时间显示偏好存储，带本地持久化
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { TimeMode } from '$lib/types';

const KEY = 'gt-time-mode';

/**
 * 创建时间显示模式 store
 * 从 localStorage 读取初始值，并在变更时自动保存
 * @returns Svelte writable store
 */
function createStore() {
  let initial: TimeMode = 'local';
  // 浏览器环境下从 localStorage 恢复上次设置
  if (browser) {
    const saved = window.localStorage.getItem(KEY) as TimeMode | null;
    if (saved === 'local' || saved === 'train_tz') initial = saved;
  }
  const store = writable<TimeMode>(initial);
  // 自动持久化到 localStorage
  if (browser) {
    store.subscribe((v) => {
      window.localStorage.setItem(KEY, v);
    });
  }
  return store;
}

/**
 * 全局时间显示模式 store
 * 值为 'local' 或 'train_tz'
 */
export const timeMode = createStore();
