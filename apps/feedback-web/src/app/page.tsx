import { Button, YutaBrandMark } from '@yuta/ui';
import {
  BarChart3,
  ChevronDown,
  Globe2,
  Info,
  Leaf,
  LockKeyhole,
  MessageCircleMore,
  QrCode,
  Send,
  Sparkles,
  Star,
  UserRound,
  Zap,
} from 'lucide-react';

const benefits = [
  {
    title: 'Simple',
    description: 'Un parcours rapide conçu pour mobile.',
    icon: Zap,
  },
  {
    title: 'Privé',
    description: 'Les retours sont transmis directement au restaurant.',
    icon: LockKeyhole,
  },
  {
    title: 'Utile',
    description:
      'Les restaurateurs identifient ce qui fonctionne et ce qui doit être amélioré.',
    icon: BarChart3,
  },
] as const;

const footerLinks = [
  { label: 'Confidentialité', href: 'https://yutapro.fr/privacy' },
  { label: "Conditions d'utilisation", href: 'https://yutapro.fr/terms' },
  { label: 'Mentions légales', href: 'https://yutapro.fr/mentions-legales' },
  { label: 'Contact', href: 'https://yutapro.fr/contact' },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-surface text-primary">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Header />

        <section className="relative grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.06fr_0.94fr] lg:pb-20 lg:pt-16">
          <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="flex items-center justify-center gap-4 lg:justify-start">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-brand-100 bg-brand-50 text-brand-600 sm:h-20 sm:w-20">
                <MessageCircleMore className="h-9 w-9 sm:h-11 sm:w-11" />
              </span>
              <h1 className="text-5xl font-bold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                YUTA <span className="text-action-primary">Avis</span>
              </h1>
            </div>

            <h2 className="mt-7 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2.1rem]">
              Recueillez simplement l&apos;avis de vos clients
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-secondary sm:text-lg lg:mx-0">
              YUTA Avis permet aux restaurants de recevoir les retours de leurs
              clients de manière simple, rapide et confidentielle. Identifiez ce
              qui fonctionne et améliorez l&apos;expérience au quotidien.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl px-8 text-base shadow-sm"
              >
                <a href="https://yutapro.fr">
                  <Leaf className="h-5 w-5" aria-hidden="true" />
                  Découvrir YUTA
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 rounded-xl border-brand-400 px-8 text-base text-brand-700"
              >
                <a href="https://app.yutapro.fr">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  Espace restaurateur
                </a>
              </Button>
            </div>
          </div>

          <HeroVisual />
        </section>

        <section
          className="grid overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/60 md:grid-cols-3"
          aria-label="Les avantages de YUTA Avis"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className={`flex items-center gap-5 px-6 py-7 sm:px-8 ${
                  index > 0
                    ? 'border-t border-brand-100 md:border-l md:border-t-0'
                    : ''
                }`}
              >
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand-100/70 text-brand-600">
                  <Icon className="h-9 w-9" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-brand-700">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 leading-7 text-secondary">
                    {benefit.description}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="my-9 flex items-center gap-5 rounded-2xl border border-border-default bg-surface px-6 py-6 sm:px-9">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-brand-500 text-brand-600">
            <Info className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold sm:text-xl">
              Vous souhaitez donner votre avis à un restaurant ?
            </h2>
            <p className="mt-1 text-secondary">
              Utilisez le lien ou le QR code fourni par l&apos;établissement.
            </p>
          </div>
          <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 sm:grid">
            <QrCode className="h-8 w-8" aria-hidden="true" />
          </span>
        </section>

        <Footer />
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex min-h-24 items-center justify-between gap-5 border-b border-border-default/70 py-5 lg:border-b-0">
      <Brand />
      <div className="flex items-center gap-3">
        <div
          className="hidden h-12 items-center gap-2 rounded-xl border border-border-default px-4 font-semibold sm:flex"
          aria-label="Langue : français"
        >
          <Globe2 className="h-5 w-5" aria-hidden="true" />
          FR
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-xl border-brand-300 px-4 text-brand-700 sm:px-5"
        >
          <a href="https://app.yutapro.fr">
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">Espace restaurateur</span>
            <span className="sm:hidden">Restaurateur</span>
          </a>
        </Button>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <a
      href="https://yutapro.fr"
      className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      aria-label="YUTA, accueil"
    >
      <YutaBrandMark
        iconClassName="h-11 w-11"
        nameClassName="text-2xl sm:text-3xl"
      />
      <span className="hidden h-8 w-px bg-border-default lg:block" />
      <span className="hidden max-w-40 text-sm leading-5 text-secondary lg:block">
        Les avis clients, simplement
      </span>
    </a>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto flex min-h-[520px] w-full max-w-xl items-center justify-center lg:min-h-[590px]">
      <div className="absolute inset-x-8 top-12 h-80 rounded-[45%] bg-brand-50 lg:inset-x-0 lg:h-96" />
      <div className="absolute left-3 top-24 h-44 w-44 rounded-full border border-dashed border-brand-300 sm:left-10" />
      <Send className="absolute right-5 top-16 h-14 w-14 rotate-[-8deg] text-brand-500 sm:right-10" />
      <Sparkles className="absolute left-5 bottom-24 h-9 w-9 text-brand-300" />

      <div className="relative z-10 aspect-[9/19] w-[250px] rounded-[2.8rem] bg-primary p-2.5 shadow-lg sm:w-[270px]">
        <div className="relative h-full overflow-hidden rounded-[2.25rem] bg-surface px-5 pb-7 pt-14 text-center">
          <span className="absolute left-1/2 top-0 h-7 w-28 -translate-x-1/2 rounded-b-2xl bg-primary" />
          <p className="font-semibold italic text-brand-600">Le Jardin</p>
          <p className="text-xs font-bold tracking-[0.16em]">GOURMAND</p>
          <p className="mt-7 text-sm font-bold leading-5">
            Comment s&apos;est passée
            <br />
            votre expérience ?
          </p>
          <div className="mt-6 flex justify-center gap-2 text-brand-500">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star key={rating} className="h-7 w-7" aria-hidden="true" />
            ))}
          </div>
          <div className="mt-6 h-20 rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-left text-[10px] text-muted">
            Parlez-nous de votre expérience…
          </div>
          <div className="mt-4 rounded-lg bg-action-primary px-4 py-3 text-sm font-bold text-inverse">
            Envoyer mon avis
          </div>
          <p className="mt-7 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-secondary">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Avis privé et confidentiel
          </p>
        </div>
      </div>

      <div className="absolute bottom-7 right-2 flex flex-col items-center sm:right-8">
        <Leaf className="h-24 w-24 rotate-[-18deg] text-brand-500" />
        <span className="-mt-4 h-14 w-20 rounded-b-3xl rounded-t-lg border border-border-default bg-surface shadow-sm" />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-7 border-t border-border-default py-9 lg:flex-row">
      <Brand />
      <nav
        className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-secondary"
        aria-label="Liens légaux"
      >
        {footerLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <p className="text-sm text-muted">© 2026 YUTA. Tous droits réservés.</p>
    </footer>
  );
}
