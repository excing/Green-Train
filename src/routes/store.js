import { writable } from 'svelte/store';

// token will store the Firebase Cloud Messaging token
export const firebaseToken = writable('');