export function parseSnapshotEntries(snapshot: string, topCount: number = 3) {
  const parsed = JSON.parse(snapshot);

  const rows = Array.isArray(parsed?.data) ? parsed.data : [];

  if (!rows.length) {
    throw new Error("No candidate rows found in ONPE snapshot");
  }

  return rows
    .map((entry: any) => ({
      nombreCandidato: String(entry.nombreCandidato ?? "").trim(),
      totalVotosValidos: Number(entry.totalVotosValidos ?? 0),
      porcentajeVotosValidos: Number(entry.porcentajeVotosValidos ?? 0),
    }))
    .filter(
      (e) =>
        e.nombreCandidato &&
        Number.isFinite(e.totalVotosValidos) &&
        Number.isFinite(e.porcentajeVotosValidos)
    )
    .sort((a, b) => b.totalVotosValidos - a.totalVotosValidos)
    .slice(0, topCount);
}
