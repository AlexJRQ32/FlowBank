// QA seed — fills the cloud project with realistic test data for qa@flowbank.test.
// No app code involved: talks to Supabase REST as the QA user (anon key + JWT),
// so RLS enforces everything exactly like the app would. Idempotent: skips if
// the QA user already has tarjetas.
//
// Re-run: node supabase/seed-qa.mjs   (reads keys from frontend-next/.env.local)
// Banks are already seeded by migration 20260912000003_create_bancos_seed.sql.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- load env from frontend-next/.env.local --------------------------------
const envFile = fs.readFileSync(
  path.join(__dirname, "..", "frontend-next", ".env.local"),
  "utf8",
);
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const QA = { email: "qa@flowbank.test", password: "FlowBankQA2026!" };

if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const api = async (url, body, token) => {
  const res = await fetch(`${URL}${url}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: KEY,
      authorization: `Bearer ${token ?? KEY}`,
      "content-type": "application/json",
      ...(token ? { Prefer: "return=representation" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${url}: ${JSON.stringify(json)}`);
  return json;
};

async function main() {
  // 1. QA user: signup if missing, else password login.
  let auth;
  try {
    auth = await api("/auth/v1/signup", { email: QA.email, password: QA.password });
    if (!auth.user && auth.message) throw new Error(auth.message);
  } catch (err) {
    if (!String(err.message ?? err).includes("already registered")) throw err;
  }
  auth = await api("/auth/v1/token?grant_type=password", {
    email: QA.email,
    password: QA.password,
  });
  const token = auth.access_token;
  const userId = auth.user.id;
  console.log(`Usuario QA: ${QA.email} / ${QA.password}  id=${ userId }`);

  // 2. Banks are seeded by migration; map names -> ids.
  const bancos = await api("/rest/v1/bancos?select=id,nombre", undefined, token);
  const bancoId = (nombre) => {
    const b = bancos.find((x) => x.nombre === nombre);
    if (!b) throw new Error(`Banco no encontrado: ${nombre}`);
    return b.id;
  };

  // 3. Tarjetas (skip only the seed's own cards — e2e may have left others).
  const existentes = await api(
    `/rest/v1/tarjetas?user_id=eq.${userId}&select=nombre&nombre=in.("BN Crédito","BAC Crédito","BCR Débito","Davivienda Crédito")`,
    undefined,
    token,
  );
  if (existentes.length > 0) {
    console.log(`Seed ya aplicado (${existentes.length} tarjetas) — nada que hacer.`);
    return;
  }

  const tarjetas = [
    { banco: "Banco Nacional de Costa Rica", nombre: "BN Crédito", digitos: "4521", tipo: "Crédito", corte: 5, pago: 25, limite: 1500000, saldo: 382500 },
    { banco: "BAC Credomatic", nombre: "BAC Crédito", digitos: "8837", tipo: "Crédito", corte: 20, pago: 10, limite: 2000000, saldo: 1247000 },
    { banco: "Banco de Costa Rica", nombre: "BCR Débito", digitos: "0977", tipo: "Débito", corte: 15, pago: 15, limite: 0, saldo: 465300 },
    { banco: "Banco Davivienda Costa Rica", nombre: "Davivienda Crédito", digitos: "3310", tipo: "Crédito", corte: 12, pago: 2, limite: 1000000, saldo: 689900 },
  ].map((t) => ({
    user_id: userId,
    banco_id: bancoId(t.banco),
    nombre: t.nombre,
    ultimos_cuatro_digitos: t.digitos,
    tipo: t.tipo,
    dia_corte: t.corte,
    dia_pago: t.pago,
    limite_credito: t.limite,
    saldo_actual: t.saldo,
    es_activa: true,
  }));

  const tarjetasCreadas = await api("/rest/v1/tarjetas", tarjetas, token);
  console.log(`Tarjetas insertadas: ${tarjetasCreadas.length}`);

  // 4. Facturas (last 2 months; RLS requires tarjeta_id — all associated).
  const diasAtras = (n) =>
    new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const idPorNombre = (nombre) => tarjetasCreadas.find((t) => t.nombre === nombre).id;
  const facturas = [
    { t: "BN Crédito",           monto: 68900,   moneda: "CRC", hace: 3,   comercio: "Auto Mercado" },
    { t: "BAC Crédito",          monto: 154.9,   moneda: "USD", hace: 6,   comercio: "Walmart Costa Rica" },
    { t: "BN Crédito",           monto: 127500,  moneda: "CRC", hace: 12,  comercio: "Pequeño Mundo" },
    { t: "BCR Débito",           monto: 45200,   moneda: "CRC", hace: 18,  comercio: "Auto Mercado" },
    { t: "Davivienda Crédito",   monto: 89500,   moneda: "CRC", hace: 18,  comercio: "Ropa Deportiva" },
    { t: "BAC Crédito",          monto: 48.75,   moneda: "USD", hace: 25,  comercio: "Walmart Costa Rica" },
    { t: "BN Crédito",           monto: 23400,   moneda: "CRC", hace: 32,  comercio: "Pequeño Mundo" },
    { t: "Davivienda Crédito",   monto: 156000,  moneda: "CRC", hace: 40,  comercio: "Hoolber Motorizados" },
    { t: "BCR Débito",           monto: 52200,   moneda: "CRC", hace: 51,  comercio: "Auto Mercado" },
    { t: "BAC Crédito",          monto: 320400,  moneda: "CRC", hace: 60,  comercio: "Ropa Deportiva" },
  ].map((f) => ({
    tarjeta_id: idPorNombre(f.t),
    monto_total: f.monto,
    moneda: f.moneda,
    fecha_compra: diasAtras(f.hace),
    comercio: f.comercio,
    imagen_url: null,
  }));

  await api("/rest/v1/facturas", facturas, token);
  console.log(`Facturas insertadas: ${facturas.length}`);

  // 5. Verify.
  const verTarjetas = await api(
    `/rest/v1/tarjetas?user_id=eq.${userId}&select=nombre,tipo,saldo_actual`,
    undefined,
    token,
  );
  const verFacturas = await api(
    `/rest/v1/facturas?select=monto_total,moneda,comercio`,
    undefined,
    token,
  );
  console.log(`Verificación: ${verTarjetas.length} tarjetas, ${verFacturas.length} facturas`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
