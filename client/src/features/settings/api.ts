import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/error-handler";
import { MAX_LOGO_SIZE_BYTES, ALLOWED_LOGO_MIME_TYPES } from "@/lib/constants";

export async function uploadLogo(userId: string, file: File): Promise<string> {
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw toAppError({ code: "VALIDATION_ERROR", message: "Logo must be 2MB or smaller." });
  }
  if (!ALLOWED_LOGO_MIME_TYPES.includes(file.type as (typeof ALLOWED_LOGO_MIME_TYPES)[number])) {
    throw toAppError({ code: "VALIDATION_ERROR", message: "Logo must be PNG, JPEG, or WEBP." });
  }

  // Never trust the original filename as a path — generate a safe one.
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/branding/logo-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("branding").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw toAppError({ code: "UPLOAD_FAILED", message: "Logo upload failed." });
  return path;
}
