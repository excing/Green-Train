<script lang="ts">
	// Import the functions you need from the SDKs you need
	import { getApps, initializeApp } from 'firebase/app';

	import { onMount, onDestroy } from 'svelte';
	import { getMessaging, getToken, onMessage } from 'firebase/messaging';
	import { firebaseConfig } from '$lib/firebase';

	import { firebaseToken } from './store';

	var hasRequestNotificationPermission = false;

	let token = '';
	const unsubscribe = firebaseToken.subscribe((value) => {
		token = value;
	});

	// messages will hold the array of messages received
	var messages = [];

	// **Request Notification Permission and Get Token:**
	//   - When the component is mounted, request the user's permission for notifications.
	//   - If granted, use `getToken` to fetch the Firebase Cloud Messaging token.
	//   - Replace `'YOUR_VAPID_KEY'` with the VAPID key from your Firebase project settings.

	onMount(() => {
		hasRequestNotificationPermission = Notification.permission === 'granted';
		if (hasRequestNotificationPermission) {
			onNotificationPermissionGranted();
		}
	});

	onDestroy(unsubscribe);

	function onNotificationPermissionGranted() {
		// User has granted permission
		console.log('Notification permission granted.');

		if (0 == getApps().length) {
			initializeApp(firebaseConfig);
			console.log('firebase initializ app on fg');
		}

		// Fetch the FCM token
		const messaging = getMessaging();
		getToken(messaging, {
			vapidKey:
				'BF7KMoDxFEhaDawO3c1lvJXozBhFCVudP8nnd-akz9oArcREzl1jOMhW0vGtIbsd24AgPA3Hvi2YIawOl5JgUFs'
		})
			.then((fetchedToken) => {
				// Store and use the fetched token
				firebaseToken.set(fetchedToken);
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
	}

	function requestNotificationPermission() {
		// Logic for requesting notification permissions

		Notification.requestPermission().then((permission) => {
			if (permission === 'granted') {
				onNotificationPermissionGranted();
			} else if (permission === 'denied') {
				// User has denied permission
				console.error('Notification permission denied.');
				alert('未授权消息通知，无法使用绿皮车。');
			}
		});
	}
</script>

<!-- skeleton.dev -->
<!-- daisyui -->

<title>Green Train</title>

{#if !hasRequestNotificationPermission}
	<button on:click={requestNotificationPermission}>Enable Notifications</button>
{/if}

{#each messages as message, i}
	<p>{i}: {message.notification?.title}, {message.notification?.body}</p>
{/each}

<slot />
