// OCR endpoint: 1:1 port of backend/FlowBank.WebAPI/Services/OcrService.cs
// (ExtraerMonto / ExtraerFecha / ExtraerComercio). Same regexes, same fallbacks.
import { createWorker } from "tesseract.js";
import spaLang from "@tesseract.js-data/spa";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// ponytail: default Vercel Hobby max (60s); lower if cold-start allows
export const maxDuration = 60;

interface OcrResultado {
  monto: number;
  fecha: string | null;
  comercio: string;
}

// --- Port of OcrService.ExtraerMonto -------------------------------------
// Patrones de factura ticos: "TOTAL: ₡ 12 345.67", "Total a pagar ₡12,345.67", "MONTO TOTAL"
const PATRONES_MONTO = [
  /(?:TOTAL|MONTO\s+TOTAL|TOTAL\s+A\s+PAGAR|TOTAL\s+PAGAR)[\s:]*₡?\s*([0-9][0-9\s.,]*)/i,
  /([0-9][0-9\s.,]*)\s*(?:colones|CRC)/i,
];

function tryParseMonto(raw: string): number {
  let limpio = raw.trim().replace(/ /g, "");

  if (limpio.includes(".") && limpio.includes(",")) {
    // 12,345.67 o 12.345,67
    if (limpio.indexOf(".") > limpio.indexOf(",")) {
      limpio = limpio.replace(/,/g, ""); // 12.345,67 -> 12345,67
      limpio = limpio.replace(/\./g, ""); // quitar separador miles
    } else {
      limpio = limpio.replace(/\./g, "");
    }
  }

  const monto = Number(limpio);
  return Number.isFinite(monto) ? monto : 0;
}

function extraerMonto(texto: string): number {
  for (const patron of PATRONES_MONTO) {
    const match = texto.match(patron);
    if (match) {
      const monto = tryParseMonto(match[1]);
      if (monto > 0) return monto;
    }
  }

  // Fallback: ultimo numero con decimales (ej: 6550.00, 12.345,67)
  const todos = texto.matchAll(/\b[0-9]{1,3}(?:[.\s][0-9]{3})+(?:[.,][0-9]{2})\b/g);
  for (const m of todos) {
    const monto = tryParseMonto(m[0]);
    if (monto > 0) return monto;
  }

  // Fallback final: ultimo numero con 2 decimales y magnitud razonable
  const numeros = texto.matchAll(/\b[0-9][0-9.,\s]*[0-9](?:[.,][0-9]{2})\b/g);
  let ultimo = 0;
  for (const m of numeros) {
    const monto = tryParseMonto(m[0]);
    if (monto > ultimo) ultimo = monto;
  }
  return ultimo;
}

// --- Port of OcrService.ExtraerFecha -------------------------------------
// dd/mm/yyyy, dd-mm-yyyy, dd/mm/yy
function extraerFecha(texto: string): string | null {
  const match = texto.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/i);
  if (!match) return null;

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  let anio = Number(match[3]);

  if (anio < 100) anio += 2000;
  if (mes > 0 && mes <= 12 && dia > 0 && dia <= 31 && anio > 1900) {
    return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }
  return null;
}

// --- Port of OcrService.ExtraerComercio ----------------------------------
function extraerComercio(texto: string): string {
  // La primera linea con letras suele ser el nombre del comercio
  const lineas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const primera = lineas.find((l) => /[a-zA-Z]/.test(l) && l.length > 3);
  if (primera) {
    // Limpiar numeros sueltos y simbolos raros
    const limpio = primera
      .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9&\s'.-]/g, "")
      .replace(/^[ .-]+|[ .-]+$/g, "");
    if (limpio.length > 1 && limpio.length <= 60) return limpio;
  }
  return "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data with an 'image' file field." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "Missing 'image' file field." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const worker = await createWorker("spa", 1, {
    langPath: spaLang.langPath,
    gzip: true,
    logger: () => {}, // keep serverless logs clean
  });

  try {
    const { data } = await worker.recognize(bytes);
    const texto = data.text;

    const resultado: OcrResultado = {
      monto: extraerMonto(texto),
      fecha: extraerFecha(texto),
      comercio: extraerComercio(texto),
    };
    return Response.json(resultado);
  } finally {
    await worker.terminate();
  }
}
