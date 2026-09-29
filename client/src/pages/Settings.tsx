import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { profileSchema, type ProfileInput } from "@/schemas/profile";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { uploadLogo } from "@/features/settings/api";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: (user?.user_metadata?.full_name as string) ?? "", companyName: "" },
  });

  async function onSubmit(values: ProfileInput) {
    if (!user) return;
    try {
      if (logoFile) {
        await uploadLogo(user.id, logoFile);
      }
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, full_name: values.fullName, company_name: values.companyName || null });
      toast("Profile updated.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" description="Manage your profile and document branding." />

      <form className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" invalid={!!errors.fullName} {...register("fullName")} />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" {...register("companyName")} />
          <FieldError message={errors.companyName?.message} />
        </div>
        <div>
          <Label htmlFor="logo">Company logo</Label>
          <input
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setLogoError(null);
              if (file && file.size > 2 * 1024 * 1024) {
                setLogoError("Logo must be 2MB or smaller.");
                setLogoFile(null);
                return;
              }
              setLogoFile(file);
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, or WEBP. Max 2MB.</p>
          <FieldError message={logoError ?? undefined} />
        </div>
        <Button type="submit" loading={isSubmitting} className="self-start">
          Save changes
        </Button>
      </form>
    </div>
  );
}
