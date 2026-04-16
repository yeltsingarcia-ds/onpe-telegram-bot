import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

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
            flexDirection: "column",
            background: "#f5f4f1",
            padding: "40px",
          }}
        >
          <h1 style={{ fontSize: 40 }}>Resultados ONPE</h1>

          <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
            {data.map((c: any, i: number) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 80,
                    height: `${c.porcentaje * 5}px`,
                    background: ["#f47c20", "#3a7dc0", "#f2c230"][i],
                  }}
                />

                <div>{c.nombre}</div>
                <div>{c.porcentaje}%</div>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response("Error generating image: " + e.message, {
      status: 500,
    });
  }
}
