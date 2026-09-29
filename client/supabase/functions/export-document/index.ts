// supabase/functions/export-document/index.ts
//
// Generates a PDF/DOCX/TXT from the document's current version, uploads it
// to the private `documents` storage bucket, records it in document_exports,
// and returns a short-lived signed URL. Never returns a public URL.

import { z } from "https://esm.sh/zod@3.23.8";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "https://esm.sh/docx@8.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { requireUser, serviceClient } from "../_shared/auth.ts";

const requestSchema = z.object({
  documentId: z.string().uuid(),
  format: z.enum(["pdf", "docx", "txt"]),
});

interface DocSection {
  id: string;
  title: string;
  content: string;
}
interface DocContent {
  title: string;
  sections: DocSection[];
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let userId: string;
  let userClient;
  try {
    const auth = await requireUser(req);
    userId = auth.userId;
    userClient = auth.client;
  } catch {
    return errorResponse("UNAUTHENTICATED", "Please sign in to continue.", requestId, corsHeaders);
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid export request.", requestId, corsHeaders);
  }
  const { documentId, format } = parsed.data;

  // Ownership + current content, enforced through RLS on the scoped client.
  const { data: doc, error: docErr } = await userClient
    .from("documents")
    .select("id, title, current_version_id")
    .eq("id", documentId)
    .single();
  if (docErr || !doc || !doc.current_version_id) {
    return errorResponse("NOT_FOUND", "Document not found or has no content to export.", requestId, corsHeaders);
  }

  const { data: version, error: versionErr } = await userClient
    .from("document_versions")
    .select("content_json, plain_text")
    .eq("id", doc.current_version_id)
    .single();
  if (versionErr || !version) {
    return errorResponse("NOT_FOUND", "Document content not found.", requestId, corsHeaders);
  }

  const content = version.content_json as DocContent;

  let fileBytes: Uint8Array;
  let contentType: string;
  try {
    if (format === "txt") {
      fileBytes = new TextEncoder().encode(version.plain_text);
      contentType = "text/plain";
    } else if (format === "pdf") {
      fileBytes = await renderPdf(content);
      contentType = "application/pdf";
    } else {
      fileBytes = await renderDocx(content);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  } catch {
    return errorResponse("EXPORT_FAILED", "We couldn't export your document. Please try again.", requestId, corsHeaders);
  }

  const admin = serviceClient();
  const exportId = crypto.randomUUID();
  const path = `${userId}/documents/${documentId}/exports/${exportId}.${format}`;

  const { error: uploadErr } = await admin.storage.from("documents").upload(path, fileBytes, {
    contentType,
    upsert: false,
  });
  if (uploadErr) {
    return errorResponse("EXPORT_FAILED", "We couldn't save your export. Please try again.", requestId, corsHeaders);
  }

  const { data: signed, error: signErr } = await admin.storage
    .from("documents")
    .createSignedUrl(path, 60 * 10); // 10 minutes
  if (signErr || !signed) {
    return errorResponse("EXPORT_FAILED", "We couldn't generate a download link.", requestId, corsHeaders);
  }

  await admin.from("document_exports").insert({
    document_id: documentId,
    user_id: userId,
    format,
    storage_path: path,
  });
  await admin.from("audit_logs").insert({
    user_id: userId,
    action: "DOCUMENT_EXPORTED",
    resource_type: "document",
    resource_id: documentId,
    metadata: { format },
  });

  return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function renderPdf(content: DocContent): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]); // Letter
  const margin = 56;
  let y = 792 - margin;
  const lineHeight = 14;
  const maxWidth = 612 - margin * 2;

  function ensureSpace(needed: number) {
    if (y - needed < margin) {
      page = pdfDoc.addPage([612, 792]);
      y = 792 - margin;
    }
  }

  function drawWrapped(text: string, size: number, useFont = font) {
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = useFont.widthOfTextAtSize(testLine, size);
      if (width > maxWidth) {
        ensureSpace(lineHeight);
        page.drawText(line, { x: margin, y, size, font: useFont, color: rgb(0.06, 0.09, 0.16) });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size, font: useFont, color: rgb(0.06, 0.09, 0.16) });
      y -= lineHeight;
    }
  }

  ensureSpace(28);
  page.drawText(content.title, { x: margin, y, size: 18, font: boldFont, color: rgb(0.06, 0.09, 0.16) });
  y -= 28;

  for (const section of content.sections) {
    ensureSpace(20);
    y -= 6;
    page.drawText(section.title, { x: margin, y, size: 12, font: boldFont, color: rgb(0.31, 0.27, 0.9) });
    y -= 18;
    drawWrapped(section.content, 10.5);
    y -= 8;
  }

  ensureSpace(60);
  y -= 20;
  page.drawText("Signatures", { x: margin, y, size: 12, font: boldFont });
  y -= 24;
  page.drawText("Party 1: ______________________     Date: ____________", { x: margin, y, size: 10, font });
  y -= 24;
  page.drawText("Party 2: ______________________     Date: ____________", { x: margin, y, size: 10, font });

  return pdfDoc.save();
}

async function renderDocx(content: DocContent): Promise<Uint8Array> {
  const children = [
    new Paragraph({ text: content.title, heading: HeadingLevel.TITLE }),
    ...content.sections.flatMap((s) => [
      new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ children: [new TextRun(s.content)] }),
    ]),
    new Paragraph({ text: "Signatures", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: "Party 1: ______________________     Date: ____________" }),
    new Paragraph({ text: "Party 2: ______________________     Date: ____________" }),
  ];
  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
