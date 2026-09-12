// OCR SPIKE (Phase 0 gate for Phase 5) — temp route, delete after spike verdict.
// Validates tesseract.js feasibility in a Next.js Route Handler:
// accepts an image, OCRs it with Spanish traineddata, returns text length +
// top 5 lines. Cold-start/memory/accuracy on Vercel = pending manual deploy.
import { createWorker } from "tesseract.js";
import spaLang from "@tesseract.js-data/spa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// ponytail: default Vercel Hobby max (60s); lower if cold-start allows
export const maxDuration = 60;

export async function POST(request: Request) {
  const startedAt = Date.now();

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
    const lines = data.text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return Response.json({
      fileName: file.name,
      sizeBytes: bytes.length,
      textLength: data.text.length,
      lineCount: lines.length,
      topLines: lines.slice(0, 5),
      elapsedMs: Date.now() - startedAt,
      // Confidence reported by Tesseract per word — rough accuracy signal
      meanConfidence: data.confidence,
    });
  } finally {
    await worker.terminate();
  }
}
