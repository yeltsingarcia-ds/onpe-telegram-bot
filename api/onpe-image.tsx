import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export default async function handler(req: Request) {
  try {
    const body = await req.json();

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            fontSize: 40,
          }}
        >
          ONPE IMAGE OK
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
