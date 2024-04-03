// src/lib/firebase.ts

export const firebaseConfig = {
  apiKey: "AIzaSyDGzwKSto5bqOQJ-wLjhRr66gfig6U9ERA",
  authDomain: "green-train.firebaseapp.com",
  projectId: 'green-train',
  storageBucket: 'green-train.appspot.com',
  messagingSenderId: '833757508951',
  appId: '1:833757508951:web:945a98692541fd7a97fa12',
  measurementId: 'G-KRT4TF8Z2G'
};

/**
 * Construct a JSON object that will be used to define the
 * common parts of a notification message that will be sent
 * to any app instance subscribed to the news topic.
 */
export function buildCommonMessage(registrationTokenOrArray, title, body) {
  if (typeof registrationTokenOrArray === 'string') {
    return {
      token: registrationTokenOrArray,
      notification: {
        title: title,
        body: body
      }
    };
  }

  return {
    tokens: registrationTokenOrArray,
    notification: {
      title: title,
      body: body
    }
  };
}
