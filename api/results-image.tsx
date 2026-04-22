import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export default async function handler(req: Request) {
  try {
    const method = req.method || "GET";

    if (method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body = null;

    try {
      body = await req.json();
    } catch {
      body = null;
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#ffffff",
            fontSize: 40,
          }}
        >
          📊 RESULTADOS ONPE
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
