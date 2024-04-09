import { json } from '@sveltejs/kit';
import { FirebaseCredentialsURL, HttpProxy } from '$env/static/private'
import { buildCommonMessage } from "$lib/firebase";

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";

import { httpsOverHttp } from 'tunnel';

export async function POST({ request, cookies }) {
  const { token, message } = await request.json();

  await sendFcmMessage(buildCommonMessage(token, 'New message', message));

  console.log('send message successful');
  return json({ status: 201 });
}

async function sendFcmMessage(fcmMessage) {
  console.log(fcmMessage);
  console.log("InitializeApp>>>>", getApps());

  if (0 < getApps().length) {
    startSendFcmMessage(fcmMessage);
  } else {
    // syncSendFCM(fcmMessage);

    let response = await fetch(FirebaseCredentialsURL);
    let json = await response.json();
    console.log("firebase credentials: ");
    console.log(json);

    // 是否需要使用 http proxy
    if (HttpProxy !== '/') {
      const proxyAgent = httpsOverHttp({
        proxy: {
          host: '127.0.0.1',
          port: 1080,
        }
      });

      initializeApp({
        credential: cert(json, proxyAgent),
        httpAgent: proxyAgent,
      });
    } else {
      initializeApp({
        credential: cert(json),
      });
    }

    startSendFcmMessage(fcmMessage)
  }
}

function syncSendFCM(fcmMessage) {
  fetch(FirebaseCredentialsURL)
    .then((response) => response.json())
    .then((key) => {
      console.log("firebase credentials: ");
      console.log(key);

      // 是否需要使用 http proxy
      if (HttpProxy) {
        const proxyAgent = httpsOverHttp({
          proxy: {
            host: '127.0.0.1',
            port: 1080,
          }
        });

        initializeApp({
          credential: cert(key, proxyAgent),
          httpAgent: proxyAgent,
        });
      } else {
        initializeApp({
          credential: cert(key),
        });
      }

      startSendFcmMessage(fcmMessage);
    })
    .catch(err => {
      console.error(err);
    })
}

async function startSendFcmMessage(fcmMessage) {
  console.log('fcm start send message');

  // let send = fcmMessage.token
  //   ? getMessaging(getApp()).send(fcmMessage)
  //   : getMessaging(getApp()).sendEachForMulticast(fcmMessage);
  // send.then((response) => {
  //   // Response is a message ID string.
  //   console.log('Successfully sent message:', response);
  // })
  //   .catch((error) => {
  //     console.log('Error sending message:', error);
  //   });
  let messageId = await getMessaging(getApp()).send(fcmMessage);
  console.log('Successfully sent sync message:', messageId.toString());
}