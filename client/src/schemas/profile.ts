import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(120),
  companyName: z.string().max(160).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const logoUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 2 * 1024 * 1024, "Logo must be 2MB or smaller.")
    .refine(
      (f) => ["image/png", "image/jpeg", "image/webp"].includes(f.type),
      "Logo must be a PNG, JPEG, or WEBP image.",
    ),
});
