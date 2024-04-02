import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    const { token } = await request.json();

    console.log("token:", token)

    return json({ status: 201 });
}
