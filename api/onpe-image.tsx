import { ImageResponse } from "@vercel/og";

export default function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("data");

    if (!raw) {
      return new Response("Missing data", { status: 400 });
    }

    const data = JSON.parse(raw);

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
          OK IMAGE
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
