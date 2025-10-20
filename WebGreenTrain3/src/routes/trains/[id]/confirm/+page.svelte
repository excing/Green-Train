<script lang="ts">
  import { page } from '$app/stores';
  import { trains } from '$lib/stores/trains';
  import { toLocalAbsoluteTime } from '$lib/utils/time';
  import { Card, Button, Badge, Alert } from '$lib/components';

  let train = $derived($trains.find(t => t.id === $page.params.id));
  let fromStationIndex = $derived(parseInt($page.url.searchParams.get('from') || '0'));
  let toStationIndex = $derived(parseInt($page.url.searchParams.get('to') || '1'));
  let seatStr = $derived($page.url.searchParams.get('seat') || '');
  let serviceDate = $derived($page.url.searchParams.get('date') || '');

  let paymentMethod = $state<'wechat' | 'alipay' | 'card'>('wechat');
  let processing = $state(false);

  function formatTime(relTime: string) {
    if (!train) return relTime;
    try {
      return toLocalAbsoluteTime(serviceDate as any, relTime as any, train.timezone as any);
    } catch {
      return relTime;
    }
  }

  function generateQRCode() {
    // 这里应该生成真实的二维码
    // 现在只是返回一个占位符
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23fff" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="%23999"%3EQR Code%3C/text%3E%3C/svg%3E';
  }

  async function handlePayment() {
    processing = true;
    try {
      // 模拟支付处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('支付成功！');
      // 跳转到聊天室
      window.location.href = `/chat/${train?.id}?date=${serviceDate}`;
    } catch (error) {
      alert('支付失败，请重试');
    } finally {
      processing = false;
    }
  }
</script>

{#if !train}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-600">列车不存在</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- 头部 -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">确认订单</h1>
        <a href="/trains/{train.id}/booking" class="text-blue-600 hover:underline">← 返回</a>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：订单详情 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 车次信息 -->
          <Card>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">车次信息</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">车次名称</p>
                <p class="font-semibold text-gray-900 mt-1">{train.name}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">主题</p>
                <p class="font-semibold text-gray-900 mt-1">{train.theme}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">出发日期</p>
                <p class="font-semibold text-gray-900 mt-1">{serviceDate}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">座位</p>
                <Badge variant="info" class="mt-1">{seatStr}</Badge>
              </div>
            </div>
          </Card>

          <!-- 路线信息 -->
          <Card>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">路线信息</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <p class="text-sm text-gray-500">出发站</p>
                  <p class="font-semibold text-gray-900 mt-1">{train.stations[fromStationIndex]?.name}</p>
                  <p class="text-sm text-gray-600 mt-1">
                    {formatTime(train.stations[fromStationIndex]?.departure_time || '')}
                  </p>
                </div>
                <div class="text-gray-400">→</div>
                <div class="flex-1">
                  <p class="text-sm text-gray-500">到达站</p>
                  <p class="font-semibold text-gray-900 mt-1">{train.stations[toStationIndex]?.name}</p>
                  <p class="text-sm text-gray-600 mt-1">
                    {formatTime(train.stations[toStationIndex]?.arrival_time || '')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <!-- 支付方式 -->
          <Card>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">选择支付方式</h2>
            <div class="space-y-3">
              {#each [
                { id: 'wechat', name: '微信支付', icon: '💬' },
                { id: 'alipay', name: '支付宝', icon: '🔵' },
                { id: 'card', name: '银行卡', icon: '💳' }
              ] as method}
                <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" class:border-blue-500={paymentMethod === method.id} class:bg-blue-50={paymentMethod === method.id}>
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    bind:group={paymentMethod}
                    class="w-4 h-4"
                  />
                  <span class="ml-3 text-lg">{method.icon}</span>
                  <span class="ml-2 font-medium text-gray-900">{method.name}</span>
                </label>
              {/each}
            </div>
          </Card>

          <!-- 条款 -->
          <Alert type="info">
            <p class="text-sm">
              购票即表示您同意我们的服务条款。请注意，本平台为临时陌生人聊天服务，所有消息在聊天室关闭后将被清除。
            </p>
          </Alert>
        </div>

        <!-- 右侧：支付卡片 -->
        <div>
          <Card class="sticky top-24">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">订单总计</h2>

            <!-- 价格明细 -->
            <div class="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">车票价格</span>
                <span class="font-medium text-gray-900">¥99.00</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">手续费</span>
                <span class="font-medium text-gray-900">¥0.00</span>
              </div>
            </div>

            <!-- 总价 -->
            <div class="flex justify-between mb-6">
              <span class="font-semibold text-gray-900">总计</span>
              <span class="text-2xl font-bold text-blue-600">¥99.00</span>
            </div>

            <!-- 二维码 -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <img src={generateQRCode()} alt="QR Code" class="w-full" />
              <p class="text-xs text-gray-500 mt-2">扫描二维码进入聊天室</p>
            </div>

            <!-- 支付按钮 -->
            <Button
              variant="primary"
              size="lg"
              class="w-full"
              loading={processing}
              disabled={processing}
              onclick={handlePayment}
            >
              {processing ? '处理中...' : '确认支付'}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              class="w-full mt-2"
              disabled={processing}
              onclick={() => window.history.back()}
            >
              返回
            </Button>
          </Card>
        </div>
      </div>
    </main>
  </div>
{/if}

