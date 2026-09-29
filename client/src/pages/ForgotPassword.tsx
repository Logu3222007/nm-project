import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";
import { useAuth } from "@/features/auth/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { useState } from "react";
import { Scale, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    await requestPasswordReset(values.email);
    // Always show the same success state, regardless of whether the email
    // exists — never let this UI confirm or deny an account's existence.
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-semibold">LegalEase</span>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <h1 className="text-lg font-semibold text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for that email, we've sent password reset instructions.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-foreground">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we'll send you reset instructions.
            </p>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" invalid={!!errors.email} {...register("email")} />
                <FieldError message={errors.email?.message} />
              </div>
              <Button type="submit" loading={isSubmitting}>
                Send reset link
              </Button>
            </form>
          </>
        )}

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
