const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Recebe o valor de um <input type="date"> (yyyy-mm-dd) e formata como
// "11 de setembro de 2026" — parseia os componentes na mão em vez de
// `new Date(iso)`, que interpreta yyyy-mm-dd como UTC meia-noite e pode
// exibir o dia anterior em fusos negativos (ex.: Brasil, UTC-3).
export function formatDataPretendida(iso: string): string {
  if (!iso) return "a definir";
  const [ano, mes, dia] = iso.split("-").map(Number);
  const nomeMes = MESES[mes - 1];
  if (!ano || !mes || !dia || !nomeMes) return "a definir";
  return `${dia} de ${nomeMes} de ${ano}`;
}
