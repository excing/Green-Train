<script lang="ts">
	// Import the functions you need from the SDKs you need
	import { initializeApp } from 'firebase/app';
	import { getAnalytics } from 'firebase/analytics';
	// TODO: Add SDKs for Firebase products that you want to use
	// https://firebase.google.com/docs/web/setup#available-libraries

	import { onMount } from 'svelte';
	import { getMessaging, getToken, onMessage } from 'firebase/messaging';
	// import { type Messaging } from 'firebase/messaging';
	import { firebaseConfig } from '$lib/firebase';

	var open = false;

	// token will store the Firebase Cloud Messaging token
	var token = null;

	// messages will hold the array of messages received
	var messages = [];

	// **Request Notification Permission and Get Token:**
	//   - When the component is mounted, request the user's permission for notifications.
	//   - If granted, use `getToken` to fetch the Firebase Cloud Messaging token.
	//   - Replace `'YOUR_VAPID_KEY'` with the VAPID key from your Firebase project settings.

	onMount(() => {});

	// ... existing imports and variables

	function requestNotificationPermission() {
		// Logic for requesting notification permissions

		Notification.requestPermission().then((permission) => {
			if (permission === 'granted') {
				// User has granted permission
				console.log('Notification permission granted.');

				// Fetch the FCM token
				const messaging = getMessaging(initializeApp(firebaseConfig));
				getToken(messaging, {
					vapidKey:
						'BF7KMoDxFEhaDawO3c1lvJXozBhFCVudP8nnd-akz9oArcREzl1jOMhW0vGtIbsd24AgPA3Hvi2YIawOl5JgUFs'
				})
					.then((fetchedToken) => {
						// Store and use the fetched token
						token = fetchedToken;
						console.log('Token:');
						console.log(token);

						fetch('/api/firebase/token', {
							method: 'POST',
							body: JSON.stringify({ token: token }),
							headers: {
								'Content-Type': 'application/json'
							}
						});
					})
					.catch((error) => {
						console.error('Error fetching token:', error);
					});
				// Listen for messages when the app is open
				onMessage(messaging, (payload) => {
					console.log('Message received. ', payload);

					// Add the new message to the messages array
					messages[messages.length] = payload;
				});
			} else if (permission === 'denied') {
				// User has denied permission
				console.error('Notification permission denied.');
			}
		});
	}
</script>

<slot />

<button on:click={requestNotificationPermission}>Enable Notifications</button>

{#each messages as message, i}
	<p>{i}: {message.notification?.title}, {message.notification?.body}</p>
{/each}
