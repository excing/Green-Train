<script lang="ts">
  import { Card, Button, Badge, Alert } from '$lib/components';

  type TicketStatus = 'reserved' | 'paid' | 'checked_in' | 'boarded' | 'completed' | 'cancelled' | 'expired' | 'refunded';

  interface Ticket {
    id: string;
    trainId: string;
    trainName: string;
    serviceDate: string;
    fromStation: string;
    toStation: string;
    seat: string;
    status: TicketStatus;
    departureTime: string;
    arrivalTime: string;
    price: number;
    purchaseTime: string;
  }

  // 模拟票据数据
  let tickets = $state<Ticket[]>([
    {
      id: 'TK001',
      trainId: 'G1001',
      trainName: '绿色列车 001',
      serviceDate: '2025-08-15',
      fromStation: '北京',
      toStation: '上海',
      seat: '3车厢 07排D座',
      status: 'paid',
      departureTime: '2025-08-15T10:00:00+08:00',
      arrivalTime: '2025-08-15T14:35:00+08:00',
      price: 99.00,
      purchaseTime: '2025-08-14T15:30:00+08:00'
    },
    {
      id: 'TK002',
      trainId: 'G1002',
      trainName: '绿色列车 002',
      serviceDate: '2025-08-16',
      fromStation: '上海',
      toStation: '杭州',
      seat: '2车厢 05排A座',
      status: 'completed',
      departureTime: '2025-08-16T09:00:00+08:00',
      arrivalTime: '2025-08-16T11:30:00+08:00',
      price: 79.00,
      purchaseTime: '2025-08-15T10:00:00+08:00'
    },
    {
      id: 'TK003',
      trainId: 'G1003',
      trainName: '绿色列车 003',
      serviceDate: '2025-08-17',
      fromStation: '杭州',
      toStation: '南京',
      seat: '1车厢 03排F座',
      status: 'checked_in',
      departureTime: '2025-08-17T14:00:00+08:00',
      arrivalTime: '2025-08-17T16:45:00+08:00',
      price: 89.00,
      purchaseTime: '2025-08-16T12:00:00+08:00'
    }
  ]);

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { variant: any; label: string; icon: string }> = {
      reserved: { variant: 'warning', label: '已预订', icon: '📋' },
      paid: { variant: 'info', label: '已支付', icon: '💳' },
      checked_in: { variant: 'success', label: '已上车', icon: '✓' },
      boarded: { variant: 'success', label: '已登车', icon: '🚂' },
      completed: { variant: 'default', label: '已完成', icon: '✓' },
      cancelled: { variant: 'error', label: '已取消', icon: '✕' },
      expired: { variant: 'error', label: '已过期', icon: '⏰' },
      refunded: { variant: 'default', label: '已退款', icon: '💰' }
    };
    return statusMap[status] || { variant: 'default', label: status, icon: '?' };
  }

  function formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function handleRefund(ticketId: string) {
    if (confirm('确定要退票吗？')) {
      tickets = tickets.map(t =>
        t.id === ticketId ? { ...t, status: 'refunded' as const } : t
      );
    }
  }

  function handleEnterChat(ticketId: string) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      window.location.href = `/chat/${ticket.trainId}?date=${ticket.serviceDate}`;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- 头部 -->
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">我的票据</h1>
      <a href="/" class="text-blue-600 hover:underline">← 返回首页</a>
    </div>
  </header>

  <!-- 主内容 -->
  <main class="flex-1 max-w-6xl mx-auto w-full px-4 py-8 overflow-y-auto">
    {#if tickets.length === 0}
      <Alert type="info" title="暂无票据">
        <p>您还没有购买任何票据。<a href="/" class="text-blue-600 hover:underline">立即购票</a></p>
      </Alert>
    {:else}
      <div class="space-y-4">
        {#each tickets as ticket (ticket.id)}
          <Card>
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900">{ticket.trainName}</h2>
                <p class="text-gray-600 text-sm mt-1">临时陌生人聊天</p>
              </div>
              <Badge variant={getStatusBadge(ticket.status).variant}>
                <span>{getStatusBadge(ticket.status).icon} {getStatusBadge(ticket.status).label}</span>
              </Badge>
            </div>

            <!-- 路线信息 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p class="text-sm text-gray-500">出发站</p>
                <p class="font-semibold text-gray-900 mt-1">{ticket.fromStation}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">到达站</p>
                <p class="font-semibold text-gray-900 mt-1">{ticket.toStation}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">座位</p>
                <p class="font-semibold text-gray-900 mt-1">{ticket.seat}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">价格</p>
                <p class="font-semibold text-blue-600 mt-1">¥{ticket.price.toFixed(2)}</p>
              </div>
            </div>

            <!-- 时间信息 -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p class="text-sm text-gray-500">出发时间</p>
                <p class="font-mono text-gray-900 mt-1">{formatTime(ticket.departureTime)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">到达时间</p>
                <p class="font-mono text-gray-900 mt-1">{formatTime(ticket.arrivalTime)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">购票时间</p>
                <p class="font-mono text-gray-900 mt-1">{formatTime(ticket.purchaseTime)}</p>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
              {#if ticket.status === 'paid' || ticket.status === 'checked_in'}
                <Button
                  variant="primary"
                  size="sm"
                  onclick={() => handleEnterChat(ticket.id)}
                >
                  进入聊天室
                </Button>
              {/if}
              {#if ticket.status === 'paid' || ticket.status === 'reserved'}
                <Button
                  variant="danger"
                  size="sm"
                  onclick={() => handleRefund(ticket.id)}
                >
                  退票
                </Button>
              {/if}
              <Button
                variant="secondary"
                size="sm"
                onclick={() => alert('票据详情：' + JSON.stringify(ticket, null, 2))}
              >
                查看详情
              </Button>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </main>
</div>

