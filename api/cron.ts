import { parseSnapshotEntries } from "../lib/parse-onpe.js";
import { put } from "@vercel/blob";

// ================= ENV =================
const BOT_TOKEN = process.env.BOT_TOKEN!;
const CHAT_ID = process.env.CHAT_ID!;

const ONPE_URL = process.env.ONPE_URL!;
const STATE_PATH = "onpe/latest-state.json";

// ================= HEADERS ONPE =================
const ONPE_HEADERS = {
  accept: "*/*",
  "accept-language": "es-ES,es;q=0.9",
  "cache-control": "no-cache",
  referer: "https://resultadoelectoral.onpe.gob.pe/main/presidenciales",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
};

// ================= FETCH =================
async function fetchSnapshot() {
  const res = await fetch(ONPE_URL, {
    headers: ONPE_HEADERS,
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Snapshot error");

  const text = await res.text();

  if (text.startsWith("<")) {
    throw new Error("ONPE returned HTML");
  }

  return text;
}

// ================= UTILS =================
function calcDiff(a: any, b: any) {
  return {
    votos: a.votos - b.votos,
    porcentaje: (a.porcentaje - b.porcentaje).toFixed(2),
  };
}

function format(n: number) {
  return new Intl.NumberFormat("es-PE").format(n);
}

// ================= MENSAJE =================
function buildMessage(summary: any, top3: any[]) {
  const d12 = calcDiff(top3[0], top3[1]);
  const d23 = calcDiff(top3[1], top3[2]);

  return `📊 *Elecciones Perú - ONPE*

🕒 Actualizado al ${new Date(summary.fechaActualizacion).toLocaleString("es-PE")}

🗳 *Estado del conteo*
• Actas contabilizadas: ${summary.actasContabilizadas}
• Total votos válidos: ${format(summary.totalVotosValidos)}

📉 *Diferencias*
• 1 vs 2: +${format(d12.votos)} votos (${d12.porcentaje}%)
• 2 vs 3: +${format(d23.votos)} votos (${d23.porcentaje}%)
`;
}

// ================= TELEGRAM =================
async function sendTelegram(photo: string, caption: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo,
      caption,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram error: ${text}`);
  }
}

// ================= IMAGE =================
function cleanName(nombre: string) {
  return nombre.split(" ").slice(0, 2).join(" ");
}

async function generateAndStoreImage(top3: any[]) {
  const data = top3.map((c) => ({
    nombre: cleanName(c.nombre),
    porcentaje: Number(c.porcentaje.toFixed(2)),
    votos: c.votos,
  }));

  const url = `${process.env.BASE_URL}/api/onpe-image?data=${encodeURIComponent(
    JSON.stringify(data)
  )}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image endpoint error: ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("image")) {
    const text = await res.text();
    throw new Error(`Not an image: ${text}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  const blob = await put(`onpe/chart-${Date.now()}.png`, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return blob.url;
}

// ================= STATE =================
async function getPrevState() {
  try {
    const res = await fetch(process.env.STATE_URL!, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function saveState(state: any) {
  const blob = await put(STATE_PATH, JSON.stringify(state), {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}

function hasChanges(prev: any, next: any) {
  if (!prev) return true;

  for (let i = 0; i < 3; i++) {
    if (prev.top3[i].votos !== next.top3[i].votos) {
      return true;
    }
  }

  return false;
}

// ================= HANDLER =================
export default async function handler(req: any, res: any) {
  try {
    const secret = req.query?.secret;

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ ok: false });
    }

    // 🔥 SOLO SNAPSHOT (SIN SUMMARY)
    const snapshot = await fetchSnapshot();

    const parsed = parseSnapshotEntries(snapshot, 3);

    const top3 = parsed.map((c) => ({
      nombre: c.nombreCandidato,
      votos: c.totalVotosValidos,
      porcentaje: c.porcentajeVotosValidos,
      dni: c.dniCandidato,
      partido: c.codigoAgrupacionPolitica,
    }));
    
    // 🔥 SUMMARY DERIVADO (ANTI ERROR)
    const summary = {
      fechaActualizacion: new Date().toISOString(),
      totalVotosValidos: top3.reduce((acc, c) => acc + c.votos, 0),
      actasContabilizadas: "N/D",
    };

    const nextState = {
      updatedAt: summary.fechaActualizacion,
      top3,
    };

    const prevState = await getPrevState();

    if (!hasChanges(prevState, nextState)) {
      return res.status(200).json({ ok: true, sent: false });
    }

    const imageUrl = await generateAndStoreImage(top3);

    const message = buildMessage(summary, top3);

    await sendTelegram(imageUrl, message);

    const stateUrl = await saveState(nextState);

    return res.status(200).json({
      ok: true,
      sent: true,
      imageUrl,
      stateUrl,
    });
  } catch (e: any) {
    console.error("🔥 ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
}
