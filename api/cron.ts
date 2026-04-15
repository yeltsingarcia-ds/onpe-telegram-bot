import { put } from "@vercel/blob";

// 👇 ENV
const BOT_TOKEN = process.env.BOT_TOKEN!;
const CHAT_ID = process.env.CHAT_ID!;

// 👇 TU BASE (IMPORTANTE)
const ONPE_URL = process.env.ONPE_URL!;
const ONPE_SUMMARY_URL = process.env.ONPE_SUMMARY_URL!;

const STATE_PATH = "onpe/latest-state.json";

// ------------------ FETCH ------------------

async function fetchSnapshot() {
  const res = await fetch(ONPE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Snapshot error");
  return res.text();
}

async function fetchSummary() {
  const res = await fetch(ONPE_SUMMARY_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Summary error");

  const json = await res.json();
  return json.data ?? json;
}

// ------------------ TOP 3 ------------------

function extractTop3(snapshotText: string) {
  const data = JSON.parse(snapshotText);

  // ⚠️ Ajustado a estructura típica ONPE
  const candidatos = data?.resultados ?? data ?? [];

  return candidatos
    .map((c: any) => ({
      nombre: c.nombre,
      votos: Number(c.votos),
      porcentaje: Number(c.porcentaje),
    }))
    .sort((a: any, b: any) => b.votos - a.votos)
    .slice(0, 3);
}

// ------------------ UTILS ------------------

function calcDiff(a: any, b: any) {
  return {
    votos: a.votos - b.votos,
    porcentaje: (a.porcentaje - b.porcentaje).toFixed(2),
  };
}

function format(n: number) {
  return new Intl.NumberFormat("es-PE").format(n);
}

// ------------------ MENSAJE ------------------

function buildMessage(summary: any, top3: any[]) {
  const d12 = calcDiff(top3[0], top3[1]);
  const d23 = calcDiff(top3[1], top3[2]);

  return `
📊 *Elecciones Perú - ONPE*

🕒 Actualizado al ${summary.fechaActualizacion}

🗳 *Estado del conteo*
• Actas contabilizadas: ${summary.actasContabilizadas} %
• Total de actas: ${format(summary.totalActas)}
• Contabilizadas: ${format(summary.contabilizadas)}
• Para envío al JEE: ${format(summary.paraEnvioJEE)}
• Pendientes: ${format(summary.pendientes)}

📉 *Diferencias*
• 1 vs 2: +${format(d12.votos)} votos (${d12.porcentaje}%)
• 2 vs 3: +${format(d23.votos)} votos (${d23.porcentaje}%)
`;
}

// ------------------ TELEGRAM ------------------

async function sendTelegram(photo: string, caption: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo,
      caption,
      parse_mode: "Markdown",
    }),
  });
}

// ------------------ IMAGEN ------------------

// 🔥 AQUÍ conectas tu función real
async function renderTop3Image(snapshot: string, summary: any) {
  // 👉 usa tu función existente
  const { renderAndStoreOnpeResultsImage } = await import(
    "@/lib/render-results-image-storage"
  );

  const result = await renderAndStoreOnpeResultsImage({
    snapshot,
    topCount: 3,
    updatedAt: summary.fechaActualizacion,
    actasContabilizadas: summary.actasContabilizadas,
    totalVotosValidos: summary.totalVotosValidos,
  });

  return result.url;
}

// ------------------ STATE ------------------

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
    allowOverwrite: true,
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

// ------------------ HANDLER ------------------

export default async function handler(req: any, res: any) {
  try {
    const [snapshot, summary] = await Promise.all([
      fetchSnapshot(),
      fetchSummary(),
    ]);

    const top3 = extractTop3(snapshot);

    const nextState = {
      updatedAt: summary.fechaActualizacion,
      top3,
    };

    const prevState = await getPrevState();

    if (!hasChanges(prevState, nextState)) {
      return res.status(200).json({ ok: true, sent: false });
    }

    const imageUrl = await renderTop3Image(snapshot, summary);
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
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
