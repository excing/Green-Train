<h1>Welcome to Green Train</h1>  

<main>

    <ul>
      {#each messages as msg}
        <li>{msg}</li>
      {/each}
    </ul>
    <input type="text" bind:value={message} on:keydown={(e) => {if (e.key === 'Enter') sendMessage()}}>
    <button on:click={sendMessage}>Send</button>
  </main>

<script>
    import { onMount } from 'svelte';
    import { io } from 'socket.io-client';
  
    let messages = [];
    let message = '';
  
    const socket = io('http://localhost:3000');
  
    socket.on('chat message', (msg) => {
      messages = [...messages, msg];
    });
  
    const sendMessage = () => {
      if (message.trim() !== '') {
        socket.emit('chat message', message);
        message = '';
      }
    };
  </script>
  
  <style>
    /* Add your styles here */
  </style>
