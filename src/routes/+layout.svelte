<!--
  应用根布局
  挂载全局样式与子页面内容
-->
<script lang="ts">
	import '../app.css'; // 全局样式
	import favicon from '$lib/assets/favicon.svg';
	
	// 接收子路由内容
	let { children } = $props();
</script>

<!-- 设置页面图标 -->
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- 渲染子路由 -->
{@render children?.()}
