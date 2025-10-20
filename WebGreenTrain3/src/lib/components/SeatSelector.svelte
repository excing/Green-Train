<script lang="ts">
  import type { Train } from '$lib/types';
  import { generateAllSeats } from '$lib/utils/seat';
  import type { Seat } from '$lib/utils/seat';

  interface Props {
    train: Train;
    occupiedSeats?: Set<string>;
    selectedSeat?: Seat | null;
    onSelectSeat?: (seat: Seat) => void;
  }

  let { train, occupiedSeats = new Set(), selectedSeat = null, onSelectSeat }: Props = $props();

  const allSeats = generateAllSeats(train);
  const seatLetters = ['A', 'B', 'C', 'D', 'F'];

  function isSeatOccupied(seat: Seat): boolean {
    return occupiedSeats.has(`${seat.carriage}-${seat.row}-${seat.letter}`);
  }

  function isSeatSelected(seat: Seat): boolean {
    return selectedSeat?.carriage === seat.carriage &&
           selectedSeat?.row === seat.row &&
           selectedSeat?.letter === seat.letter;
  }

  function handleSeatClick(seat: Seat) {
    if (!isSeatOccupied(seat)) {
      onSelectSeat?.(seat);
    }
  }
</script>

<div class="bg-white rounded-lg p-6 border border-gray-200">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">选择座位</h3>
  
  <!-- 图例 -->
  <div class="flex gap-6 mb-6 text-sm">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-gray-100 border border-gray-300 rounded"></div>
      <span>可选</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-blue-500 rounded"></div>
      <span>已选</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-gray-400 rounded cursor-not-allowed"></div>
      <span>已占用</span>
    </div>
  </div>

  <!-- 座位网格 -->
  <div class="overflow-x-auto">
    <div class="inline-block">
      {#each Array.from({ length: train.carriages }, (_, i) => i + 1) as carriage}
        <div class="mb-8">
          <h4 class="text-sm font-medium text-gray-700 mb-3">{carriage} 号车厢</h4>
          <div class="inline-grid gap-2" style="grid-template-columns: repeat(5, 1fr)">
            {#each Array.from({ length: train.rows_per_carriage }, (_, i) => i + 1) as row}
              {#each seatLetters as letter}
                {@const seat = { carriage, row, letter }}
                {@const occupied = isSeatOccupied(seat)}
                {@const selected = isSeatSelected(seat)}
                <button
                  on:click={() => handleSeatClick(seat)}
                  disabled={occupied}
                  class={`w-8 h-8 rounded text-xs font-medium transition-all ${
                    selected
                      ? 'bg-blue-500 text-white'
                      : occupied
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                  title={`${carriage}号车 ${row}排${letter}座`}
                >
                  {letter}
                </button>
              {/each}
              <div class="col-span-5 h-1"></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 选中信息 -->
  {#if selectedSeat}
    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-sm text-gray-600">已选座位：</p>
      <p class="text-lg font-semibold text-blue-600">
        {selectedSeat.carriage} 号车厢 · {String(selectedSeat.row).padStart(2, '0')} 排 · {selectedSeat.letter} 座
      </p>
    </div>
  {/if}
</div>

