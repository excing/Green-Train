import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
  return json({ message: '正在开发...' }, { status: 501 });
};
