import { json } from '@sveltejs/kit';
import { Redis } from 'ioredis';
import { RedisPath, FirebaseCredentialsURL } from '$env/static/private'
// import { tokenList } from "$lib/utils.js";
import { buildCommonMessage, firebaseConfig } from "$lib/firebase";

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";

/**
 * Firebase Cloud Messaging (FCM) can be used to send messages to clients on iOS, Android and Web.
 *
 * This sample uses FCM to send two types of messages to clients that are subscribed to the `news`
 * topic. One type of message is a simple notification message (display message). The other is
 * a notification message (display notification) with platform specific customizations. For example,
 * a badge is added to messages that are sent to iOS devices.
 */
import https from 'https';
import { google } from 'googleapis';
import { checkHaveTokenInResult } from '$lib/utils.js';

// const redis = new Redis(RedisPath);

export async function POST({ request, cookies }) {
  const { token, message } = await request.json();

  sendFcmMessageWithSDK(buildCommonMessage(token, 'New message', message));
  // redis.get('firebase_tokens', (err, result) => {
  //   if (err) {
  //     console.error(err);
  //   } else {
  //     if (checkHaveTokenInResult(token, result)) {
  //       console.log(`firebase sender token: ${token}`);
  //       console.log(`firebase send message: ${message}`);
  //       sendFcmMessageWithSDK(buildCommonMessage(token, 'New message', message));
  //     } else {
  //       console.error(`firebase no sender: ${token}`);
  //     }
  //   }
  // });

  return json({ status: 201 });
}

const PROJECT_ID = firebaseConfig.projectId;
const HOST = 'fcm.googleapis.com';
const PATH = '/v1/projects/' + PROJECT_ID + '/messages:send';
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];

// [START retrieve_access_token]
/**
 * Get a valid access token.
 */
function getAccessToken() {
  return new Promise(function (resolve, reject) {
    fetch(FirebaseCredentialsURL)
      .then((response) => response.json())
      .then((key) => {
        console.log("firebase credentials: ");
        console.log(key);
        const jwtClient = new google.auth.JWT(
          key.client_email,
          null,
          key.private_key,
          SCOPES,
          null
        );
        jwtClient.authorize(function (err, tokens) {
          if (err) {
            reject(err);
            return;
          }
          console.log('google auth jwt');
          console.log(tokens?.access_token);
          resolve(tokens?.access_token);
        });
      })
      .catch(err => {
        reject(err);
      })
  });
}
// [END retrieve_access_token]

/**
 * Send HTTP request to FCM with given message.
 *
 * @param {object} fcmMessage will make up the body of the request.
 */
function sendFcmMessage(fcmMessage) {
  getAccessToken().then(function (accessToken) {
    const options = {
      hostname: HOST,
      path: PATH,
      method: 'POST',
      // [START use_access_token]
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
      // [END use_access_token]
    };

    const request = https.request(options, function (resp) {
      resp.setEncoding('utf8');
      resp.on('data', function (data) {
        console.log('Message sent to Firebase for delivery, response:');
        console.log(data);
      });
    });

    request.on('error', function (err) {
      console.log('Unable to send message to Firebase');
      console.log(err);
    });

    request.write(JSON.stringify(fcmMessage));
    request.end();
  });
}

async function sendFcmMessageWithSDK(fcmMessage) {
  console.log(fcmMessage);
  console.log("InitializeApp>>>>", getApps());

  if (0 < getApps().length) {
    let send = fcmMessage.message.token
      ? getMessaging().send(fcmMessage)
      : getMessaging().sendEachForMulticast(fcmMessage);
    send.then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  } else {

    fetch(FirebaseCredentialsURL)
      .then((response) => response.json())
      .then((key) => {
        console.log("firebase credentials: ");
        console.log(key);
        initializeApp({
          credential: cert(key),
        });

        let send = fcmMessage.token
          ? getMessaging().send(fcmMessage)
          : getMessaging().sendEachForMulticast(fcmMessage);
        send.then((response) => {
          // Response is a message ID string.
          console.log('Successfully sent message:', response);
        })
          .catch((error) => {
            console.log('Error sending message:', error);
          });
      })
      .catch(err => {
        console.error(err);
      })

  }
}