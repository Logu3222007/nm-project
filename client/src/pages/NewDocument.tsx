import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Shield, Home, Handshake, UserCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { TEMPLATES, type TemplateDefinition } from "@/features/templates/definitions";
import { documentInputSchemaByType } from "@/schemas/document";
import { generateDocument } from "@/features/generation/api";
import { useToast } from "@/components/ui/toast";
import { LEGAL_DISCLAIMER } from "@/lib/constants";
import { z } from "zod";

const ICONS = { briefcase: Briefcase, shield: Shield, home: Home, handshake: Handshake, "user-check": UserCheck };

type Step = "type" | "details" | "review" | "generating";

export default function NewDocument() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialType = params.get("type");
  const initialTemplate = TEMPLATES.find((t) => t.documentType === initialType) ?? null;

  const [step, setStep] = useState<Step>(initialTemplate ? "details" : "type");
  const [template, setTemplate] = useState<TemplateDefinition | null>(initialTemplate);
  const [genPhase, setGenPhase] = useState<string>("Preparing document");
  const [genError, setGenError] = useState<string | null>(null);

  const schema = template
    ? documentInputSchemaByType[template.documentType as keyof typeof documentInputSchemaByType]
    : z.object({});

  const form = useForm({ resolver: zodResolver(schema as z.ZodType) });

  function selectTemplate(t: TemplateDefinition) {
    setTemplate(t);
    setStep("details");
  }

  async function onSubmit(values: Record<string, unknown>) {
    if (!template) return;
    setStep("generating");
    setGenError(null);
    setGenPhase("Preparing document");

    const phases = ["Preparing document", "Generating legal content", "Structuring document", "Finalizing document"];
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, phases.length - 1);
      setGenPhase(phases[i]!);
    }, 1500);

    try {
      const result = await generateDocument({ documentType: template.documentType, input: values });
      clearInterval(interval);
      toast("Document generated.", "success");
      navigate(`/documents/${result.documentId}`);
    } catch (e) {
      clearInterval(interval);
      setGenError(e instanceof Error ? e.message : "Generation couldn't be completed.");
      setStep("review");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New document" description="Follow the steps to generate a document." />

      <StepIndicator step={step} />

      {step === "type" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <button
                key={t.slug}
                onClick={() => selectTemplate(t)}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step === "details" && template && (
        <DetailsForm
          template={template}
          form={form}
          onBack={() => setStep("type")}
          onNext={() => setStep("review")}
        />
      )}

      {step === "review" && template && (
        <ReviewStep
          template={template}
          values={form.getValues()}
          error={genError}
          onBack={() => setStep("details")}
          onGenerate={form.handleSubmit(onSubmit)}
        />
      )}

      {step === "generating" && <GeneratingStep phase={genPhase} />}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "type", label: "Document type" },
    { key: "details", label: "Information" },
    { key: "review", label: "Review" },
    { key: "generating", label: "Generate" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
      {steps.map((s, i) => (
        <li key={s.key} className={`flex items-center gap-2 ${i <= currentIndex ? "text-primary" : ""}`}>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
              i <= currentIndex ? "border-primary bg-primary/10" : "border-border"
            }`}
          >
            {i + 1}
          </span>
          {s.label}
          {i < steps.length - 1 && <span className="mx-1 text-border">/</span>}
        </li>
      ))}
    </ol>
  );
}

function DetailsForm({
  template,
  form,
  onBack,
  onNext,
}: {
  template: TemplateDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onBack: () => void;
  onNext: () => void;
}) {
  const {
    register,
    formState: { errors },
    trigger,
  } = form;

  async function handleNext() {
    const valid = await trigger();
    if (valid) onNext();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{template.name} details</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {template.fields.map((field) => (
          <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea id={field.name} invalid={!!errors[field.name]} {...register(field.name)} />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                {...register(field.name)}
              >
                <option value="">Select...</option>
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input id={field.name} type="checkbox" className="h-4 w-4" {...register(field.name)} />
            ) : (
              <Input
                id={field.name}
                type={field.type === "currency" ? "number" : field.type}
                invalid={!!errors[field.name]}
                {...register(field.name)}
              />
            )}
            <FieldError message={errors[field.name]?.message as string | undefined} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext}>
          Review <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  template,
  values,
  error,
  onBack,
  onGenerate,
}: {
  template: TemplateDefinition;
  values: Record<string, unknown>;
  error: string | null;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const entries = useMemo(
    () => template.fields.filter((f) => values[f.name] !== undefined && values[f.name] !== ""),
    [template, values],
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Review your information</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map((f) => (
          <div key={f.name}>
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd className="text-sm text-foreground">{String(values[f.name])}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
        {LEGAL_DISCLAIMER}
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onGenerate}>Generate document</Button>
      </div>
    </div>
  );
}

function GeneratingStep({ phase }: { phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface px-6 py-20 text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-foreground">{phase}...</p>
      <p className="mt-1 text-xs text-muted-foreground">This can take up to a minute.</p>
    </div>
  );
}
