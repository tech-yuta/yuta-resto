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
  Textarea,
  cn,
} from '@yuta/ui';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Heart,
  MessageSquareText,
  Star,
  Store,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

const topicOptions: Array<{ value: FeedbackTopic; label: string }> = [
  { value: 'FOOD_QUALITY', label: 'Qualité des plats' },
  { value: 'WAITING_TIME', label: "Temps d'attente" },
  { value: 'WELCOME', label: 'Accueil' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'CLEANLINESS', label: 'Propreté' },
  { value: 'PRICE', label: 'Rapport qualité-prix' },
  { value: 'ONLINE_ORDER', label: 'Commande en ligne' },
  { value: 'OTHER', label: 'Autre' },
];

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

export function FeedbackForm({
  tenantSlug,
  establishmentName,
  externalLinks,
}: FeedbackFormProps) {
  const [form, setForm] = useState<PublicFeedbackSubmission>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceTag = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get('source') ?? undefined;
  }, []);

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
    if (form.rating < 1) {
      setError('Sélectionnez une note avant de continuer.');
      return;
    }
    if (
      (form.customerEmail || form.customerPhone) &&
      !form.consentToContact
    ) {
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
        body: JSON.stringify({
          ...form,
          sourceTag:
            sourceTag &&
            ['table', 'receipt', 'counter', 'click_collect', 'email', 'other'].includes(
              sourceTag,
            )
              ? sourceTag
              : undefined,
        }),
      });
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(
          result.error?.message ??
            "Votre message n'a pas pu être envoyé. Veuillez réessayer.",
        );
      }
      setIsSubmitted(true);
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

  if (isSubmitted) {
    return (
      <FeedbackSuccess
        establishmentName={establishmentName}
        externalLinks={externalLinks}
      />
    );
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-primary sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-action-primary text-inverse shadow-sm">
            <Store className="h-7 w-7" />
          </div>
          <p className="mt-3 text-sm font-semibold text-secondary">
            {establishmentName}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Votre avis nous aide à nous améliorer
          </h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-secondary">
            Partagez votre expérience en quelques secondes. Votre retour sera
            transmis directement à l&apos;équipe LUNA.
          </p>
        </header>

        <Card padding="lg" radius="lg">
          <form className="grid gap-8" onSubmit={submitFeedback}>
            <FormField
              label={
                <span className="font-medium">
                  Comment s&apos;est passée votre expérience ?{' '}
                  <span className="text-status-danger">*</span>
                </span>
              }
            >
              <div
                className="grid grid-cols-5 gap-2"
                role="radiogroup"
                aria-label="Note de satisfaction"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    role="radio"
                    aria-checked={form.rating === rating}
                    aria-label={`${rating} étoile${rating > 1 ? 's' : ''}`}
                    onClick={() =>
                      setForm((current) => ({ ...current, rating }))
                    }
                    className={cn(
                      'flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border border-border-default bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                      form.rating === rating &&
                        'border-border-strong bg-surface-selected',
                    )}
                  >
                    <Star
                      className={cn(
                        'h-7 w-7 text-border-strong',
                        form.rating >= rating &&
                          'fill-status-rating text-status-rating',
                      )}
                    />
                    <span className="text-xs font-semibold text-secondary">
                      {rating}
                    </span>
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Quels aspects souhaitez-vous commenter ?">
              <div className="grid gap-2 sm:grid-cols-2">
                {topicOptions.map((topic) => {
                  const id = `topic-${topic.value.toLowerCase()}`;
                  return (
                    <Label
                      key={topic.value}
                      htmlFor={id}
                      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border-default bg-surface px-3 py-2 font-medium"
                    >
                      <Checkbox
                        id={id}
                        checked={form.topics.includes(topic.value)}
                        onCheckedChange={() => toggleTopic(topic.value)}
                      />
                      {topic.label}
                    </Label>
                  );
                })}
              </div>
            </FormField>

            <FormField label="Souhaitez-vous ajouter un commentaire ?">
              <Textarea
                value={form.comment}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                maxLength={4_000}
                rows={5}
                placeholder="Dites-nous ce qui s'est bien passé ou ce que nous pouvons améliorer…"
              />
            </FormField>

            <section className="rounded-lg border border-border-default bg-surface-muted p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 h-5 w-5 text-brand-700" />
                <div>
                  <h2 className="font-bold">
                    Souhaitez-vous être recontacté(e) ?
                  </h2>
                  <p className="mt-1 text-sm text-secondary">
                    Ces informations sont facultatives et servent uniquement à
                    répondre à votre retour.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Nom">
                  <Input
                    value={form.customerName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    autoComplete="name"
                  />
                </FormField>
                <FormField label="Référence de commande">
                  <Input
                    value={form.orderReference}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        orderReference: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="E-mail">
                  <Input
                    type="email"
                    value={form.customerEmail}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerEmail: event.target.value,
                      }))
                    }
                    autoComplete="email"
                  />
                </FormField>
                <FormField label="Téléphone">
                  <Input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerPhone: event.target.value,
                      }))
                    }
                    autoComplete="tel"
                  />
                </FormField>
              </div>

              <Label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-normal leading-6">
                <Checkbox
                  className="mt-1"
                  checked={form.consentToContact}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      consentToContact: checked === true,
                    }))
                  }
                />
                J&apos;accepte que LUNA utilise mes coordonnées uniquement afin
                de me recontacter au sujet de ce retour.
              </Label>
            </section>

            <div className="hidden" aria-hidden="true">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    website: event.target.value,
                  }))
                }
              />
            </div>

            {error && (
              <Alert tone="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isSubmitting}
              >
                Envoyer mon retour
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="mt-4 text-center text-xs leading-5 text-muted">
                Vos coordonnées ne sont jamais envoyées à un service
                d&apos;intelligence artificielle.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

function FeedbackSuccess({
  establishmentName,
  externalLinks,
}: {
  establishmentName: string;
  externalLinks: ExternalLinks;
}) {
  const links = [
    { label: 'Google', href: externalLinks.google },
    { label: 'Facebook', href: externalLinks.facebook },
    { label: 'Instagram', href: externalLinks.instagram },
  ].filter(
    (link): link is { label: string; href: string } => Boolean(link.href),
  );

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-primary">
      <Card padding="lg" radius="lg" className="w-full max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-status-success-soft text-status-success">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <p className="mt-5 text-sm font-semibold text-secondary">
          {establishmentName}
        </p>
        <h1 className="mt-2 text-3xl font-black">Merci pour votre retour</h1>
        <p className="mt-3 leading-7 text-secondary">
          Votre message a bien été transmis à l&apos;équipe LUNA.
        </p>

        {links.length > 0 && (
          <section className="mt-8 border-t border-border-default pt-7">
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 text-brand-700" />
              <h2 className="font-bold">
                Vous pouvez également partager votre expérience :
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {links.map((link) => (
                <Button key={link.label} variant="secondary" asChild>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </section>
        )}
      </Card>
    </main>
  );
}
