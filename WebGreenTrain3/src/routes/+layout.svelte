<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>🚂 绿色列车 - 临时陌生人聊天平台</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- 全局导航栏 -->
	<nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors">
				<span class="text-2xl">🚂</span>
				<span>绿色列车</span>
			</a>

			<div class="flex items-center gap-4">
				<a
					href="/"
					class={`px-3 py-2 rounded-lg transition-colors ${
						$page.url.pathname === '/'
							? 'bg-blue-100 text-blue-600 font-medium'
							: 'text-gray-600 hover:text-gray-900'
					}`}
				>
					列车列表
				</a>
				<a
					href="/tickets"
					class={`px-3 py-2 rounded-lg transition-colors ${
						$page.url.pathname.startsWith('/tickets')
							? 'bg-blue-100 text-blue-600 font-medium'
							: 'text-gray-600 hover:text-gray-900'
					}`}
				>
					我的票据
				</a>
				<button
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
					onclick={() => alert('登出功能')}
				>
					登出
				</button>
			</div>
		</div>
	</nav>

	<!-- 页面内容 -->
	<div class="flex-1">
		{@render children?.()}
	</div>

	<!-- 页脚 -->
	<footer class="bg-gray-900 text-gray-300 py-8 mt-12">
		<div class="max-w-6xl mx-auto px-4">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
				<div>
					<h3 class="text-white font-bold mb-4">关于我们</h3>
					<p class="text-sm">🚂 绿色列车是一个临时陌生人聊天平台，让您在虚拟列车旅程中与陌生人交流。</p>
				</div>
				<div>
					<h3 class="text-white font-bold mb-4">快速链接</h3>
					<ul class="text-sm space-y-2">
						<li><a href="/" class="hover:text-white transition-colors">列车列表</a></li>
						<li><a href="/tickets" class="hover:text-white transition-colors">我的票据</a></li>
						<li><button onclick={() => alert('服务条款')} class="hover:text-white transition-colors">服务条款</button></li>
						<li><button onclick={() => alert('隐私政策')} class="hover:text-white transition-colors">隐私政策</button></li>
					</ul>
				</div>
				<div>
					<h3 class="text-white font-bold mb-4">联系我们</h3>
					<p class="text-sm">
						📧 Email: support@greentrain.com<br />
						💬 微信: greentrain_official<br />
						🐦 微博: @绿色列车
					</p>
				</div>
			</div>
			<div class="border-t border-gray-700 pt-8 text-center text-sm">
				<p>&copy; 2025 绿色列车. 保留所有权利。</p>
				<p class="mt-2 text-gray-400">阅后即焚 · 临时聊天 · 陌生人社交</p>
			</div>
		</div>
	</footer>
</div>
