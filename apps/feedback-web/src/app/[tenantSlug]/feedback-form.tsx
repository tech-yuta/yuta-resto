'use client';

import type {
  FeedbackTopic,
  PublicFeedbackSubmission,
} from '@yuta/contracts/reputation';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Label,
  PoweredByYuta,
  Textarea,
  YutaBrandMark,
  cn,
} from '@yuta/ui';
import {
  ArrowLeft,
  Check,
  Clock3,
  ExternalLink,
  HandPlatter,
  LockKeyhole,
  MoreHorizontal,
  Sparkles,
  Star,
  Store,
  Tags,
  Utensils,
  Waves,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

type ExternalLinks = {
  google: string | null;
  facebook: string | null;
  instagram: string | null;
};

type FeedbackFormProps = {
  tenantSlug: string;
  establishmentName: string;
  externalLinks: ExternalLinks;
};

type FlowStep = 1 | 2 | 3 | 4;

const initialForm: PublicFeedbackSubmission = {
  rating: 0,
  topics: [],
  comment: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  consentToContact: false,
  orderReference: '',
  website: '',
};

const topicOptions: Array<{
  value: FeedbackTopic;
  label: string;
  icon: typeof Store;
}> = [
  { value: 'WELCOME', label: 'Accueil', icon: Store },
  { value: 'FOOD_QUALITY', label: 'Qualité des plats', icon: Utensils },
  { value: 'WAITING_TIME', label: "Temps d'attente", icon: Clock3 },
  { value: 'SERVICE', label: 'Service', icon: HandPlatter },
  { value: 'AMBIENCE', label: 'Ambiance', icon: Waves },
  { value: 'PRICE', label: 'Rapport qualité-prix', icon: Tags },
  { value: 'CLEANLINESS', label: 'Propreté', icon: Sparkles },
  { value: 'OTHER', label: 'Autre', icon: MoreHorizontal },
];

const ratingLabels = [
  '',
  'Très décevant',
  'Décevant',
  'Moyen',
  'Très bien',
  'Excellent',
] as const;

const sourceTags = new Set([
  'table',
  'receipt',
  'counter',
  'click_collect',
  'email',
  'other',
]);

export function FeedbackForm({
  tenantSlug,
  establishmentName,
  externalLinks,
}: FeedbackFormProps) {
  const [form, setForm] = useState<PublicFeedbackSubmission>(initialForm);
  const [step, setStep] = useState<FlowStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceTag = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const value = new URLSearchParams(window.location.search).get('source');
    return value && sourceTags.has(value) ? value : undefined;
  }, []);

  function goToStep(nextStep: FlowStep) {
    setError(null);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueFromRating() {
    if (form.rating < 1) {
      setError('Sélectionnez une note avant de continuer.');
      return;
    }
    goToStep(3);
  }

  function toggleTopic(topic: FeedbackTopic) {
    setForm((current) => ({
      ...current,
      topics: current.topics.includes(topic)
        ? current.topics.filter((item) => item !== topic)
        : [...current.topics, topic],
    }));
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if ((form.customerEmail || form.customerPhone) && !form.consentToContact) {
      setError(
        'Acceptez le consentement pour nous permettre de vous recontacter.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/feedback/${tenantSlug}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, sourceTag }),
      });
      const result: unknown = await response.json();
      const message = getResponseErrorMessage(result);
      if (!response.ok) {
        throw new Error(
          message ??
            "Votre message n'a pas pu être envoyé. Veuillez réessayer.",
        );
      }
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError: unknown) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Votre message n'a pas pu être envoyé. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetFeedback() {
    setForm(initialForm);
    setStep(1);
    setIsSubmitted(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isSubmitted) {
    return (
      <FeedbackSuccess
        establishmentName={establishmentName}
        externalLinks={externalLinks}
        onReset={resetFeedback}
      />
    );
  }

  return (
    <FeedbackShell>
      {step === 1 ? (
        <WelcomeStep
          establishmentName={establishmentName}
          onContinue={() => goToStep(2)}
        />
      ) : (
        <>
          <FlowHeader
            step={step}
            onBack={() => goToStep((step - 1) as FlowStep)}
          />
          {step === 2 && (
            <RatingStep
              rating={form.rating}
              error={error}
              onRatingChange={(rating) => {
                setError(null);
                setForm((current) => ({ ...current, rating }));
              }}
              onContinue={continueFromRating}
            />
          )}
          {step === 3 && (
            <TopicsStep
              selectedTopics={form.topics}
              onToggle={toggleTopic}
              onContinue={() => goToStep(4)}
            />
          )}
          {step === 4 && (
            <CommentStep
              form={form}
              establishmentName={establishmentName}
              error={error}
              isSubmitting={isSubmitting}
              onChange={setForm}
              onSubmit={submitFeedback}
            />
          )}
        </>
      )}
    </FeedbackShell>
  );
}

function FeedbackShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface text-primary sm:bg-canvas sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 bg-surface-selected opacity-70 sm:block" />
      <div className="relative mx-auto min-h-dvh w-full max-w-[420px] sm:min-h-0">
        <Card
          padding="none"
          radius="lg"
          className="min-h-dvh overflow-hidden rounded-none border-0 shadow-none sm:min-h-0 sm:rounded-lg sm:border sm:shadow-lg"
        >
          <div className="flex min-h-dvh flex-col px-5 pb-6 pt-5 sm:min-h-[760px] sm:px-7">
            {children}
          </div>
        </Card>
      </div>
    </main>
  );
}

function WelcomeStep({
  establishmentName,
  onContinue,
}: {
  establishmentName: string;
  onContinue: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col text-center">
      <div className="flex items-center justify-between text-sm font-semibold">
        <YutaBrandMark />
        <span className="text-secondary">FR</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Store className="h-12 w-12" aria-hidden="true" />
        </span>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
          Bienvenue chez
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {establishmentName}
        </h1>

        <div className="mt-10 max-w-sm">
          <h2 className="text-xl font-bold">Votre avis compte</h2>
          <p className="mt-3 leading-7 text-secondary">
            Aidez-nous à nous améliorer en partageant votre expérience. Vos
            retours sont confidentiels et transmis directement à notre équipe.
          </p>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={onContinue}>
        Commencer
      </Button>
      <PoweredByYuta className="mt-5" />
    </section>
  );
}

function FlowHeader({ step, onBack }: { step: FlowStep; onBack: () => void }) {
  return (
    <header>
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          aria-label="Revenir à l'étape précédente"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="text-center text-sm font-semibold" aria-live="polite">
          Étape {step} sur 5
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-action-primary transition-[width]"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
    </header>
  );
}

function RatingStep({
  rating,
  error,
  onRatingChange,
  onContinue,
}: {
  rating: number;
  error: string | null;
  onRatingChange: (rating: number) => void;
  onContinue: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col pt-14 text-center">
      <h1 className="text-2xl font-bold leading-tight">
        Quelle note globale donnez-vous à votre expérience ?
      </h1>
      <p className="mt-3 text-sm text-secondary">Sélectionnez une note</p>

      <div
        className="mt-10 flex justify-center gap-2"
        role="radiogroup"
        aria-label="Note globale"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} étoile${value > 1 ? 's' : ''}, ${ratingLabels[value]}`}
            onClick={() => onRatingChange(value)}
            className="rounded-md p-1 text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Star
              className={cn('h-11 w-11', rating >= value && 'fill-brand-500')}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-secondary">
        <span>Très décevant</span>
        <span>Excellent</span>
      </div>
      {rating > 0 && (
        <p className="mt-5 font-semibold text-brand-700">
          {ratingLabels[rating]}
        </p>
      )}

      {error && <InlineError message={error} />}

      <div className="mt-auto space-y-4 pt-10">
        <PrivacyNotice />
        <Button size="lg" fullWidth onClick={onContinue}>
          Continuer
        </Button>
      </div>
    </section>
  );
}

function TopicsStep({
  selectedTopics,
  onToggle,
  onContinue,
}: {
  selectedTopics: FeedbackTopic[];
  onToggle: (topic: FeedbackTopic) => void;
  onContinue: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col pt-9 text-center">
      <h1 className="text-2xl font-bold leading-tight">
        Sur quels aspects souhaitez-vous nous donner votre avis ?
      </h1>
      <p className="mt-3 text-sm text-secondary">
        Sélectionnez tout ce qui s&apos;applique
      </p>

      <div className="mt-7 grid gap-2.5 text-left">
        {topicOptions.map((topic) => {
          const Icon = topic.icon;
          const selected = selectedTopics.includes(topic.value);
          return (
            <button
              key={topic.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(topic.value)}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-xl border bg-surface px-4 py-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                selected
                  ? 'border-brand-400 bg-brand-50 text-brand-800'
                  : 'border-border-default hover:bg-surface-muted',
              )}
            >
              <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <span className="flex-1">{topic.label}</span>
              {selected && (
                <Check className="h-5 w-5 text-brand-600" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <Button className="mt-7" size="lg" fullWidth onClick={onContinue}>
        Continuer
      </Button>
    </section>
  );
}

function CommentStep({
  form,
  establishmentName,
  error,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  form: PublicFeedbackSubmission;
  establishmentName: string;
  error: string | null;
  isSubmitting: boolean;
  onChange: (
    updater: (current: PublicFeedbackSubmission) => PublicFeedbackSubmission,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flex flex-1 flex-col pt-8" onSubmit={onSubmit}>
      <h1 className="text-2xl font-bold">Parlez-nous de votre expérience</h1>
      <p className="mt-2 text-sm text-secondary">
        Votre retour nous aide à nous améliorer.
      </p>

      <div className="mt-7 grid gap-5">
        <FormField label="Votre avis">
          <Textarea
            value={form.comment}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                comment: event.target.value,
              }))
            }
            maxLength={4_000}
            rows={6}
            placeholder="Décrivez ce que vous avez apprécié ou ce qui pourrait être amélioré…"
          />
          <p className="mt-1 text-right text-xs text-muted">
            {form.comment.length} / 4000
          </p>
        </FormField>

        <FormField label="Votre prénom (optionnel)">
          <Input
            value={form.customerName}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                customerName: event.target.value,
              }))
            }
            autoComplete="given-name"
            maxLength={255}
            placeholder="Prénom"
          />
        </FormField>

        <FormField label="Votre e-mail (optionnel)">
          <Input
            type="email"
            value={form.customerEmail}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                customerEmail: event.target.value,
              }))
            }
            autoComplete="email"
            maxLength={320}
            placeholder="email@exemple.com"
          />
          <p className="mt-1 text-xs text-muted">
            Pour un éventuel suivi si nécessaire.
          </p>
        </FormField>

        <Label className="flex cursor-pointer items-start gap-3 text-sm font-normal leading-6">
          <Checkbox
            className="mt-0.5"
            checked={form.consentToContact}
            onCheckedChange={(checked) =>
              onChange((current) => ({
                ...current,
                consentToContact: checked === true,
              }))
            }
          />
          J&apos;accepte que {establishmentName} me contacte si nécessaire
          concernant mon avis.
        </Label>

        <div className="hidden" aria-hidden="true">
          <Label htmlFor="website">Site web</Label>
          <Input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                website: event.target.value,
              }))
            }
          />
        </div>
      </div>

      {error && <InlineError message={error} />}

      <div className="mt-auto pt-8">
        <p className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-brand-700">
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          Votre retour reste privé et confidentiel
        </p>
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Envoyer mon avis
        </Button>
      </div>
    </form>
  );
}

function PrivacyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 text-left">
      <LockKeyhole
        className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
        aria-hidden="true"
      />
      <div>
        <p className="font-semibold text-brand-700">Avis 100% privé</p>
        <p className="mt-1 text-xs leading-5 text-secondary">
          Vos réponses sont confidentielles et ne seront pas publiées.
        </p>
      </div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <Alert className="mt-6" tone="danger">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function FeedbackSuccess({
  establishmentName,
  externalLinks,
  onReset,
}: {
  establishmentName: string;
  externalLinks: ExternalLinks;
  onReset: () => void;
}) {
  const links = [
    { label: 'Donner mon avis sur Google', href: externalLinks.google },
    { label: 'Recommander sur Facebook', href: externalLinks.facebook },
    { label: 'Voir sur Instagram', href: externalLinks.instagram },
  ].filter((link): link is { label: string; href: string } =>
    Boolean(link.href),
  );

  return (
    <FeedbackShell>
      <section className="flex flex-1 flex-col text-center">
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="relative mx-auto h-28 w-40" aria-hidden="true">
            <span className="absolute left-3 top-12 h-1.5 w-1.5 rounded-full bg-brand-400" />
            <span className="absolute left-8 top-5 h-1 w-1 rounded-full bg-status-rating" />
            <span className="absolute left-12 top-16 h-1 w-1 rounded-full bg-brand-300" />
            <span className="absolute right-5 top-9 h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span className="absolute right-10 top-4 h-1 w-1 rounded-full bg-brand-300" />
            <span className="absolute right-2 top-16 h-1 w-1 rounded-full bg-status-rating" />
            <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-status-success text-inverse shadow-sm">
              <Check className="h-11 w-11" />
            </span>
          </div>
          <h1 className="mt-5 text-xl font-bold text-brand-700">
            Merci pour votre retour !
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-secondary">
            Votre avis a bien été transmis à l&apos;équipe de{' '}
            {establishmentName}.
          </p>

          <div className="mt-7">
            <PrivacyNotice />
          </div>

          {links.length > 0 && (
            <div className="mt-5 grid gap-3">
              <p className="text-sm font-semibold text-secondary">
                Partagez aussi votre expérience publiquement
              </p>
              {links.map((link) => (
                <Button key={link.href} variant="secondary" asChild>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            fullWidth
            className="border-brand-400 text-brand-700"
          >
            <a href="/">Fermer</a>
          </Button>
          <button
            type="button"
            onClick={onReset}
            className="mx-auto rounded px-2 py-1 text-sm font-medium text-brand-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Donner un autre avis
          </button>
        </div>
      </section>
    </FeedbackShell>
  );
}

function getResponseErrorMessage(result: unknown): string | null {
  return typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof result.error === 'object' &&
    result.error !== null &&
    'message' in result.error &&
    typeof result.error.message === 'string'
    ? result.error.message
    : null;
}
