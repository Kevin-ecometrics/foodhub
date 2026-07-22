const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const DECENAS = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const DECENAS_ESP = {
  10: "DIEZ", 11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE",
  15: "QUINCE", 16: "DIECISÉIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
};
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function convertirGrupo(n: number): string {
  if (n === 0) return "";
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  let r = "";
  if (c === 1 && d === 0 && u === 0) r = "CIEN";
  else {
    if (c > 0) r = CENTENAS[c];
    if (d === 0 && u === 0) return r.trim();
  }
  const dec = d * 10 + u;
  if (dec > 0) {
    const espacio = r.length > 0 ? " " : "";
    if (dec < 10) r += espacio + UNIDADES[u];
    else if (dec < 20) r += espacio + DECENAS_ESP[dec as keyof typeof DECENAS_ESP];
    else {
      r += espacio + DECENAS[d];
      if (u > 0) r += " Y " + UNIDADES[u];
    }
  }
  return r.trim();
}

export function numeroALetras(monto: number): string {
  const entero = Math.floor(monto);
  const decimal = Math.round((monto - entero) * 100);
  if (entero === 0) return `CERO PESOS ${String(decimal).padStart(2, "0")}/100 M.N.`;
  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;
  let r = "";
  if (millones > 0) {
    const g = convertirGrupo(millones);
    r += g === "UN" ? "UN MILLÓN" : `${g} MILLONES`;
  }
  if (miles > 0) {
    const g = convertirGrupo(miles);
    r += r.length > 0 ? " " : "";
    r += g === "UN" ? "UN MIL" : `${g} MIL`;
  }
  if (resto > 0) {
    r += r.length > 0 ? " " : "";
    r += convertirGrupo(resto);
  }
  return `${r.trim()} PESOS ${String(decimal).padStart(2, "0")}/100 M.N.`;
}
