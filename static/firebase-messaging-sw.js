importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDGzwKSto5bqOQJ-wLjhRr66gfig6U9ERA",
    authDomain: "green-train.firebaseapp.com",
    projectId: 'green-train',
    storageBucket: 'green-train.appspot.com',
    messagingSenderId: '833757508951',
    appId: '1:833757508951:web:945a98692541fd7a97fa12',
    measurementId: 'G-KRT4TF8Z2G'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification?.title;
    const notificationOptions = {
        body: payload.notification?.body
    };

    // self.registration.showNotification(notificationTitle,
    //     notificationOptions);
    var notification = new Notification(notificationTitle, notificationOptions);

    notification.onclick = function () {
        // 这里可以添加点击通知后的操作，比如打开一个链接
        window.open("./");
    };
});