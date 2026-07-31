import { Button, cn, type ButtonProps } from '@yuta/ui';
import { ArrowRight, ChevronDown, Mail, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicContainer } from './PublicContainer';

const demoHref = '/contact?subject=demo';

const navigationLinks = [
  { label: 'Fonctionnalités', href: '/#plateforme-modulaire' },
  { label: 'Intégrations', href: '/integrations/google-business-profile' },
  { label: 'Pour les restaurateurs', href: '/pour-les-restaurateurs' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

const solutionLinks = [
  { label: 'Toutes les solutions', href: '/solutions' },
  { label: 'Relation client', href: '/solutions#relation-client' },
  { label: 'Opérations', href: '/solutions#operations' },
  { label: 'Équipe', href: '/solutions#equipe' },
  {
    label: 'Pilotage & développement',
    href: '/solutions#pilotage-developpement',
  },
];

const focusLinkClass =
  'rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2';

function marketingButtonClass(variant: ButtonProps['variant']) {
  switch (variant) {
    case 'secondary':
      return 'bg-surface hover:bg-surface-muted active:bg-surface-muted shadow-none';
    case 'outline':
      return 'bg-transparent hover:bg-surface-muted active:bg-surface-muted shadow-none';
    case 'ghost':
      return 'bg-transparent hover:bg-surface-muted active:bg-surface-muted shadow-none';
    case 'danger':
      return 'bg-action-danger hover:bg-action-danger/90 active:bg-action-danger shadow-sm';
    case 'success':
      return 'bg-gradient-to-r from-brand-800 via-brand-700 to-brand-500 hover:from-brand-700 hover:via-brand-600 hover:to-brand-400 active:from-brand-800 active:via-brand-700 active:to-brand-600 shadow-sm';
    case 'primary':
    default:
      return 'bg-gradient-to-r from-brand-800 via-brand-700 to-brand-500 hover:from-brand-700 hover:via-brand-600 hover:to-brand-400 active:from-brand-800 active:via-brand-700 active:to-brand-600 shadow-sm';
  }
}

export function MarketingButton({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(marketingButtonClass(variant), className)}
      {...props}
    />
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
      aria-label="YUTA, accueil"
    >
      <Image
        src="/images/web-app-manifest-192x192.png"
        alt=""
        width={38}
        height={38}
        className="h-9 w-9 object-contain"
        priority
      />
      <span className="text-xl font-bold tracking-tight text-primary">
        YUTA
      </span>
    </Link>
  );
}

export function MarketingHeader() {
  const applicationUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.yutapro.fr';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-surface/95 backdrop-blur">
      <PublicContainer>
        <nav
          className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-6"
          aria-label="Navigation principale"
        >
          <Brand />

          <div className="hidden items-center justify-self-center gap-6 text-[14px] font-medium text-secondary min-[1180px]:flex">
            <details className="group relative">
              <summary
                className={`${focusLinkClass} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}
              >
                Solutions
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-8 w-64 rounded-xl border border-border-default bg-surface p-2 shadow-lg">
                {solutionLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2.5 text-[15px] text-secondary transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
            {navigationLinks.map((link) => (
              <Link key={link.href} href={link.href} className={focusLinkClass}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-self-end gap-2 sm:gap-3">
            <MarketingButton
              asChild
              variant="ghost"
              className="hidden px-3 text-[14px] sm:inline-flex"
            >
              <a href={applicationUrl}>Se connecter</a>
            </MarketingButton>
            <MarketingButton
              asChild
              variant="success"
              className="hidden rounded-md px-5 text-[14px] sm:inline-flex"
            >
              <Link href={demoHref}>Demander une démo</Link>
            </MarketingButton>

            <details className="group relative min-[1180px]:hidden">
              <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-md border border-border-default bg-surface text-primary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Ouvrir le menu</span>
              </summary>
              <div className="absolute right-0 top-12 max-h-[calc(100vh-5rem)] w-80 overflow-y-auto rounded-xl border border-border-default bg-surface p-3 shadow-lg">
                <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                  Solutions
                </p>
                <div className="grid gap-1">
                  {solutionLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg px-3 py-2 text-[15px] font-medium text-secondary transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg px-3 py-2 text-[15px] font-medium text-secondary transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 border-t border-border-default pt-3">
                  <MarketingButton
                    asChild
                    variant="ghost"
                    fullWidth
                    className="text-[15px]"
                  >
                    <a href={applicationUrl}>Se connecter</a>
                  </MarketingButton>
                  <MarketingButton
                    asChild
                    variant="success"
                    fullWidth
                    className="text-[15px]"
                  >
                    <Link href={demoHref}>Demander une démo</Link>
                  </MarketingButton>
                </div>
              </div>
            </details>
          </div>
        </nav>
      </PublicContainer>
    </header>
  );
}

const footerGroups = [
  {
    title: 'Solutions',
    links: [
      { label: 'Relation client', href: '/solutions#relation-client' },
      { label: 'Opérations', href: '/solutions#operations' },
      { label: 'Équipe', href: '/solutions#equipe' },
      {
        label: 'Pilotage & développement',
        href: '/solutions#pilotage-developpement',
      },
    ],
  },
  {
    title: 'Fonctionnalités',
    links: [
      {
        label: 'Avis & commentaires',
        href: '/solutions/avis-commentaires',
      },
      { label: 'Réservations', href: '/solutions#relation-client' },
      { label: 'Planning', href: '/solutions#equipe' },
      { label: 'Stocks & fournisseurs', href: '/solutions#operations' },
      { label: 'Création visuelle', href: '/solutions#pilotage-developpement' },
    ],
  },
  {
    title: 'Intégrations',
    links: [
      {
        label: 'Google Business Profile',
        href: '/integrations/google-business-profile',
      },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Informations légales',
    links: [
      { label: 'Politique de confidentialité', href: '/privacy' },
      { label: 'Conditions d’utilisation', href: '/terms' },
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Gestion des données', href: '/gestion-des-donnees' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-border-default bg-surface">
      <PublicContainer className="py-8">
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[220px_1fr_1fr_0.9fr_0.85fr_1.15fr]">
          <div>
            <Brand />
            <p className="mt-3 max-w-[220px] text-[15px] leading-6 text-secondary">
              YUTA aide les restaurateurs à centraliser leur activité, gagner du
              temps et mieux piloter leur établissement.
            </p>
            <a
              href="mailto:contact@yutapro.fr"
              className={`mt-3 inline-flex items-center gap-2 text-[15px] font-medium text-secondary ${focusLinkClass}`}
            >
              <Mail className="h-4 w-4" />
              contact@yutapro.fr
            </a>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-[14px] font-bold text-primary">
                {group.title}
              </h2>
              <ul className="mt-2.5 grid gap-1.5 text-[15px] leading-6 text-secondary">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link href={link.href} className={focusLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border-default pt-4 text-[13px] leading-5 text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} YUTA — Tous droits réservés.</p>
          <p>Projet pilote · Déployé sur Vercel</p>
        </div>
      </PublicContainer>
    </footer>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-primary">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function MarketingPage({
  eyebrow,
  title,
  intro,
  layout = 'standard',
  navigation = [],
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  layout?: 'standard' | 'legal';
  navigation?: Array<{ id: string; label: string }>;
  children: ReactNode;
}) {
  const article = (
    <article className="min-w-0 max-w-[820px]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-status-success">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-6 text-lg leading-8 text-secondary">{intro}</p>
      <div className="mt-12 space-y-10">{children}</div>
      <div className="mt-14 rounded-xl border border-status-success-border bg-status-success-soft p-6">
        <h2 className="text-xl font-bold">Une question&nbsp;?</h2>
        <p className="mt-2 text-secondary">
          Écrivez-nous pour toute question sur YUTA ou sur l’utilisation de vos
          données.
        </p>
        <MarketingButton asChild variant="success" className="mt-5 text-[15px]">
          <Link href="/contact">
            Contacter YUTA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MarketingButton>
      </div>
    </article>
  );

  return (
    <MarketingShell>
      <section className="w-full py-14 sm:py-16 lg:py-20">
        <PublicContainer size="legal">
          {layout === 'legal' ? (
            <div className="grid items-start gap-10 lg:grid-cols-[260px_minmax(0,800px)] lg:gap-14">
              <aside>
                <details className="rounded-xl border border-border-default bg-surface p-4 lg:hidden">
                  <summary className="cursor-pointer font-semibold text-primary">
                    Sommaire
                  </summary>
                  <TableOfContents navigation={navigation} className="mt-4" />
                </details>
                <nav
                  aria-label="Sommaire"
                  className="sticky top-24 hidden rounded-xl border border-border-default bg-surface p-5 lg:block"
                >
                  <p className="text-[15px] font-bold text-primary">Sommaire</p>
                  <TableOfContents navigation={navigation} className="mt-4" />
                </nav>
              </aside>
              {article}
            </div>
          ) : (
            <div className="mx-auto max-w-[820px]">{article}</div>
          )}
        </PublicContainer>
      </section>
    </MarketingShell>
  );
}

function TableOfContents({
  navigation,
  className,
}: {
  navigation: Array<{ id: string; label: string }>;
  className?: string;
}) {
  return (
    <ul className={`grid gap-2 text-[15px] text-secondary ${className ?? ''}`}>
      {navigation.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="block rounded-md px-2 py-1.5 transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function InformationSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-secondary">
        {children}
      </div>
    </section>
  );
}
