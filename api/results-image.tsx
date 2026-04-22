import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function POST(req) {
  try {
    const body = await req.json();

    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 40,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ONPE OK
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}
