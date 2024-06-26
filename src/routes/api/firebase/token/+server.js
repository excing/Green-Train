import { json } from '@sveltejs/kit';
import { checkHaveTokenInResult } from "$lib/utils.js";


export async function POST({ request, cookies }) {
  const { token } = await request.json();

  console.log("firebase token:", token)

  return json({ status: 201 });
}
