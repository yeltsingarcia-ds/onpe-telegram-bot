import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

import {
  parseSnapshotEntries,
  buildRenderEntry,
  buildChartLayout,
  onpeResultsImagePayloadSchema,
} from "@/lib/render-results";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = onpeResultsImagePayloadSchema.parse(body);

    if (!payload.snapshot) {
      return new Response("Missing snapshot", { status: 400 });
    }

    // 1. Parse snapshot
    const { entries } = parseSnapshotEntries(
      payload.snapshot,
      payload.topCount
    );

    // 2. Build render entries
    const renderEntries = await Promise.all(
      entries.map((entry, i) => buildRenderEntry(entry, i))
    );

    // 3. Summary mock (puedes mejorar luego)
    const summary = {
      fechaActualizacion: payload.updatedAt ?? Date.now(),
      actasContabilizadas: payload.actasContabilizadas ?? 100,
    };

    // 4. Layout
    const layout = buildChartLayout(payload, renderEntries, summary);

    // 5. Render (OG Image)
    const image = new ImageResponse(
      (
        <div
          style={{
            width: "1400px",
            height: "820px",
            background: "#f5f4f1",
            display: "flex",
            flexDirection: "column",
            padding: "40px",
            fontSize: 28,
          }}
        >
          <h1>{layout.title}</h1>
          <p>{layout.subtitle}</p>

          <div style={{ marginTop: 40 }}>
            {layout.bars.map((bar, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <strong>{bar.nombreCandidato}</strong> —{" "}
                {bar.percentageLabel}
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 1400,
        height: 820,
      }
    );

    return new Response(image.body, {
      headers: {
        "content-type": "image/png",
        "x-onpe-updated-at": String(layout.timestamp),
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(err.message || "Error", { status: 500 });
  }
}
