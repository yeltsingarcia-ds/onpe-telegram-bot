export function parseSnapshotEntries(snapshot: string, topCount: number = 3) {
  const parsed = JSON.parse(snapshot);

  const entries = parsed.data
    .map((entry: any) => ({
      nombreCandidato: entry.nombreCandidato,
      totalVotosValidos: Number(entry.totalVotosValidos),
      porcentajeVotosValidos: Number(entry.porcentajeVotosValidos),
    }))
    .filter(
      (e: any) =>
        e.nombreCandidato &&
        !isNaN(e.totalVotosValidos) &&
        !isNaN(e.porcentajeVotosValidos)
    );

  return entries
    .sort((a: any, b: any) => b.totalVotosValidos - a.totalVotosValidos)
    .slice(0, topCount);
}
