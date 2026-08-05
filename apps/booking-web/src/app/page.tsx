import { Button } from '@yuta/ui';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Heart,
  Store,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';

const benefits = [
  {
    icon: CalendarDays,
    title: 'Réservation rapide',
    description:
      'Choisissez une date, un horaire et confirmez votre réservation en quelques étapes.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirmation claire',
    description:
      'Retrouvez facilement toutes les informations utiles concernant votre réservation.',
  },
  {
    icon: Store,
    title: 'Pensé pour les restaurants',
    description:
      'Une expérience simple pour les clients comme pour les équipes.',
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-surface text-primary">
      <header className="border-b border-border-default bg-surface">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-10">
          <a
            href="/"
            aria-label="Accueil YUTA Réservation"
            className="inline-flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
          >
            <Image
              src="/images/apple-touch-icon.png"
              width={42}
              height={42}
              alt=""
              priority
              className="h-10 w-10"
            />
            <span className="text-xl font-bold tracking-[0.12em] sm:text-2xl">
              YUTA
            </span>
            <span className="hidden h-8 w-px bg-border-default min-[460px]:block" />
            <span className="hidden flex-col text-[11px] font-medium leading-4 text-muted min-[460px]:flex sm:text-xs">
              <span>La réservation simple</span>
              <span>pour les restaurateurs</span>
            </span>
          </a>

          <nav
            aria-label="Navigation principale"
            className="flex items-center gap-3 sm:gap-7"
          >
            <a
              href="https://yutapro.fr"
              className="hidden items-center gap-1.5 rounded-lg text-sm font-semibold hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 sm:inline-flex"
            >
              Découvrir YUTA
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
            <Button asChild variant="outline" className="border-brand-200">
              <a href="https://app.yutapro.fr">
                <UserRound aria-hidden className="h-4 w-4 text-brand-700" />
                <span className="hidden sm:inline">Espace restaurateur</span>
                <span className="sm:hidden">Restaurateur</span>
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border-default">
          <div
            aria-hidden
            className="absolute -bottom-44 -left-28 h-[440px] w-[440px] rounded-full bg-brand-50"
          />
          <div
            aria-hidden
            className="absolute -right-48 top-24 h-[520px] w-[520px] rounded-full bg-brand-50/70"
          />

          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-20 sm:pt-16 lg:pb-20 lg:pt-16">
            <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 sm:text-sm">
              <CalendarDays aria-hidden className="h-4 w-4" />
              La réservation, tout simplement
            </div>

            <h1 className="mt-7 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[58px]">
              La réservation,
              <span className="block">
                tout simplement<span className="text-brand-500">.</span>
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-secondary sm:text-lg sm:leading-8">
              YUTA aide les restaurants à mieux organiser leurs réservations et
              à offrir une expérience plus fluide à leurs clients.
            </p>

            <Button asChild size="lg" className="mt-8 min-w-56 px-8">
              <a href="https://yutapro.fr">
                Découvrir YUTA
                <ArrowRight aria-hidden className="h-4 w-4" />
              </a>
            </Button>

            <div
              className="mt-10 flex w-full max-w-xl items-center gap-4"
              aria-hidden
            >
              <span className="h-px flex-1 bg-border-default" />
              <span className="grid h-10 w-10 place-items-center rounded-full border border-border-default bg-surface text-brand-600 shadow-xs">
                <Heart className="h-4 w-4" />
              </span>
              <span className="h-px flex-1 bg-border-default" />
            </div>

            <div className="mt-7 flex max-w-xl items-start gap-4 text-left">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                <CalendarDays aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">Vous souhaitez réserver une table ?</p>
                <p className="mt-1 text-sm leading-6 text-secondary sm:text-base">
                  Utilisez le lien de réservation partagé par votre restaurant.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="benefits-title" className="bg-surface">
          <h2 id="benefits-title" className="sr-only">
            Les avantages de YUTA Réservation
          </h2>
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-10 lg:py-16">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="flex min-h-72 flex-col rounded-2xl border border-border-default bg-surface p-7 shadow-xs sm:p-8"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <Icon aria-hidden className="h-7 w-7 stroke-[1.75]" />
                  </span>
                  <h3 className="mt-7 text-xl font-bold tracking-[-0.02em]">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-6 text-secondary">
                    {benefit.description}
                  </p>
                  <span className="mt-auto grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/45 via-surface to-brand-50/55 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="relative min-h-72 overflow-hidden px-6 pt-7 sm:px-9 lg:min-h-[290px]">
              <div
                aria-hidden
                className="absolute inset-x-8 bottom-5 h-20 rounded-full bg-brand-100/60 blur-2xl"
              />
              <Image
                src="/images/restaurant-dashboard.png"
                width={1536}
                height={1024}
                alt="Aperçu du tableau de bord YUTA avec des indicateurs d’activité"
                sizes="(min-width: 1024px) 430px, (min-width: 640px) 520px, 90vw"
                className="relative z-10 mx-auto h-auto w-full max-w-[500px] object-contain lg:absolute lg:bottom-0 lg:left-5 lg:w-[440px]"
              />
            </div>

            <div className="px-7 pb-10 pt-5 sm:px-10 lg:py-10 lg:pr-14">
              <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <Store aria-hidden className="h-3.5 w-3.5" />
                Pour les restaurateurs
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-[34px]">
                Vous êtes restaurateur ?
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-secondary">
                YUTA réunit des outils simples pour organiser votre
                établissement, gagner du temps et mieux accompagner vos clients.
              </p>
              <Button asChild size="lg" className="mt-6 px-7">
                <a href="https://yutapro.fr/solutions">
                  Découvrir les solutions YUTA
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-default bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.15fr_0.9fr_0.9fr_0.65fr] lg:px-10">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/apple-touch-icon.png"
                width={32}
                height={32}
                alt=""
                className="h-8 w-8"
              />
              <span className="font-bold tracking-[0.12em]">YUTA</span>
              <span className="ml-1 h-8 w-px bg-border-default" />
              <span className="flex flex-col text-[11px] font-medium leading-4 text-muted">
                <span>La réservation simple</span>
                <span>pour les restaurateurs</span>
              </span>
            </div>
            <p className="mt-7 text-sm text-muted">
              © {new Date().getFullYear()} YUTA
            </p>
          </div>

          <FooterColumn title="Produit">
            <FooterLink href="https://yutapro.fr">Découvrir YUTA</FooterLink>
            <FooterLink href="https://app.yutapro.fr">
              Espace restaurateur
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Ressources">
            <FooterLink href="https://yutapro.fr/privacy">
              Confidentialité
            </FooterLink>
            <FooterLink href="https://yutapro.fr/terms">
              Conditions d’utilisation
            </FooterLink>
            <FooterLink href="mailto:contact@yutapro.fr">Contact</FooterLink>
          </FooterColumn>

          <div>
            <h2 className="text-sm font-bold">Suivez-nous</h2>
            <div className="mt-5 flex gap-2 text-muted" aria-hidden>
              {['f', '◎', 'in'].map((label) => (
                <span
                  key={label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-canvas text-xs font-bold"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-5 flex flex-col items-start gap-3">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-brand-700"
    >
      {children}
      {href.startsWith('http') && (
        <ExternalLink aria-hidden className="h-3 w-3" />
      )}
    </a>
  );
}
