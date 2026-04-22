import { ImageResponse } from "@vercel/og";

export default async function handler(req: Request) {
  try {
    const body = await req.json();

    return new ImageResponse(
      (
        <div style={{ fontSize: 40 }}>
          Imagen OK
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
