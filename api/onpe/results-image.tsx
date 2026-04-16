import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await req.json().catch(() => ({}));

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#ffffff",
            fontSize: 40,
          }}
        >
          <div>📊 RESULTADOS ONPE</div>
          <div style={{ fontSize: 30, marginTop: 20 }}>
            Imagen generada correctamente
          </div>
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
