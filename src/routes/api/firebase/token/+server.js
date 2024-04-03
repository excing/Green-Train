import { json } from '@sveltejs/kit';
import { Redis } from 'ioredis';
import { RedisPath } from '$env/static/private'
import { checkHaveTokenInResult } from "$lib/utils.js";

// redis://:authpassword@127.0.0.1:6380/0
// redis://username:authpassword@127.0.0.1:6380/4
// console.log(RedisPath);
const redis = new Redis(RedisPath);

export async function POST({ request, cookies }) {
  const { token } = await request.json();

  console.log("firebase token:", token)

  redis.get('firebase_tokens', (err, result) => {
    if (err) {
      console.error(err);
    } else {
      // console.log('firebase all token', result);
      if (!checkHaveTokenInResult(token, result)) {
        console.log('save a new token to redis.');
        redis.append('firebase_tokens', `{{${token}}}`);
      }
    }
  });

  return json({ status: 201 });
}
