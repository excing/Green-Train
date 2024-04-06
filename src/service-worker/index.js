import { firebaseConfig } from "$lib/firebase";
import { getApps, initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
if (0 == getApps().length) {
  initializeApp(firebaseConfig);
  console.log('firebase initializ app in bg');
}

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = getMessaging();
console.log('firebase get messaging');

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New message';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.png',
  };

  var notification = new Notification(notificationTitle, notificationOptions);

  notification.onclick = function () {
    // 这里可以添加点击通知后的操作，比如打开一个链接
    window.open("./");
  };
});