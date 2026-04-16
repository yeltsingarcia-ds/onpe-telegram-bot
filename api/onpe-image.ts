import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);

  const data = JSON.parse(searchParams.get("data") || "[]");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#f5f4f1",
          display: "flex",
          flexDirection: "column",
          padding: "40px",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ fontSize: 40 }}>Resultados ONPE</h1>

        <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
          {data.map((c: any, i: number) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* FOTO */}
              <img
                src={`https://resultadoelectoral.onpe.gob.pe/assets/img-reales/candidatos/${c.dni}.jpg`}
                width={80}
                height={80}
                style={{ borderRadius: "50%" }}
              />

              {/* BARRA */}
              <div
                style={{
                  width: 80,
                  height: `${c.porcentaje * 4}px`,
                  background: ["#f47c20", "#3a7dc0", "#f2c230"][i],
                  marginTop: 10,
                }}
              />

              {/* NOMBRE */}
              <span style={{ marginTop: 10, fontSize: 16 }}>
                {c.nombre}
              </span>

              {/* % */}
              <span style={{ fontWeight: "bold" }}>
                {c.porcentaje}%
              </span>

              {/* LOGO */}
              <img
                src={`https://resultadoelectoral.onpe.gob.pe/assets/img-reales/partidos/${c.partido}.jpg`}
                width={50}
                height={50}
              />
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
}
