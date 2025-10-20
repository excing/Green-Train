# 设计 Token（Design Tokens）

本项目采用 Tailwind CSS v4（通过 `@tailwindcss/vite`）与 CSS 变量的方式统一管理主题与视觉风格。Token 以 CSS 自定义属性（变量）定义，并可直接通过 Tailwind 实用类使用，例如：`bg-primary`、`text-secondary`、`border-divider`、`shadow-md`、`rounded-lg` 等。

前端入口文件：`src/lib/styles/tokens.css`（已在 `src/app.css` 中 `@import`）

## 配色体系

- 主色（Primary）：`--color-primary`（列车绿）
- 辅色（Secondary / Tertiary）：`--color-secondary`、`--color-tertiary`
- 强调色（Accent）：`--color-accent`（金色点缀）
- 背景/表面（Background/Surface）：`--color-bg`、`--color-surface`
- 文本（Text）：`--color-text`、`--color-text-muted`、`--color-text-inverse`
- 分隔线（Divider）：`--color-divider`

## 状态色（States）
- `--color-state-active`：活跃/在线
- `--color-state-paused`：暂停/挂起
- `--color-state-deprecated`：废弃/禁用

## 圆角（Radius）
- `--radius-xs | sm | md | lg | xl | 2xl | full`

## 阴影（Shadows）
- `--shadow-xs | sm | md | lg | xl`

---

## 使用示例（Tailwind 工程内）

```svelte
<!-- 按钮示例 -->
<button class="bg-primary text-color-white text-white rounded-lg shadow-sm px-4 py-2 hover:bg-secondary">
  购票
</button>

<!-- 卡片示例 -->
<div class="bg-surface text-text border border-divider rounded-xl shadow-md p-4">
  <h3 class="text-text font-semibold">今日车次</h3>
  <p class="text-text-muted">下一班车预计 12:30 发车</p>
</div>

<!-- 状态徽标 -->
<span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
      style="background: var(--color-state-active); color: var(--color-text-inverse)">
  Active
</span>
```

> 说明：Tailwind v4 会将 `@theme` 中声明的 `--color-*`、`--radius-*`、`--shadow-*` 暴露为可直接使用的类名，如 `text-primary`、`bg-surface`、`rounded-lg`、`shadow-md` 等。

---

## Token 源文件（摘录）
文件：`src/lib/styles/tokens.css`

```css
@theme {
  /* Brand */
  --color-primary: #2d5016;            /* Train Green */
  --color-secondary: #4a7c2c;          /* Train Light Green */
  --color-tertiary: #6ba547;           /* Train Lighter Green */
  --color-accent: #d4a574;             /* Gold accent */

  /* Neutrals */
  --color-bg: #f5f1e8;                 /* Cream background */
  --color-surface: #ffffff;            /* Default surface */
  --color-divider: #e5e7eb;            /* Divider/border color */

  /* Text */
  --color-text: #2d5016;               /* Primary text */
  --color-text-muted: #4b5563;         /* Secondary text */
  --color-text-inverse: #ffffff;       /* On dark/brand */

  /* States */
  --color-state-active: #22c55e;
  --color-state-paused: #f59e0b;
  --color-state-deprecated: #9ca3af;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
}
```

---

## 与现有样式的关系
- `src/app.css` 中已包含列车主题相关变量（如 `--color-train-green`、`--color-train-cream` 等），`tokens.css` 在此基础上提供了统一的 Token 命名，方便后续用 Tailwind 原子类直接引用。
- 如需多主题（dark / high-contrast），可在 `:root` 或 `[data-theme=dark]` 下覆盖相同 Token 名称。
