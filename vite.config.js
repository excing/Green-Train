import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});

import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:5173"
  }
})

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', '+ ' + msg);
  });
});

io.listen(3000);

console.log('Start WebSocket Server')