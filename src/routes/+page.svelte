<script>
	import { onMount, onDestroy } from 'svelte';
	import { firebaseToken } from './store';

	let message = '';
	let token = '';
	const unsubscribe = firebaseToken.subscribe((value) => {
		token = value;
	});

	onDestroy(unsubscribe);

	function onSendMessage() {
		if (!message) return;

    const data = {
			token: token,
			message: message
		};

		console.log('client sender token', firebaseToken);
		fetch('/api/firebase/message', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Success:', data);
			})
			.catch((error) => {
				console.error('Error:', error);
			});

		message = '';
	}
</script>

<h1>Welcome to Green Train</h1>

<form on:submit|preventDefault={onSendMessage}>
	<label>
		😀
		<input bind:value={message} placeholder="Your message" />
	</label>

	<input type="submit" value="Send" />
</form>
