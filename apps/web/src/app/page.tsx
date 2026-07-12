import { Badge, Button, Card, IconTile, ListRow, Panel, StatCard } from '@yuta/ui';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ClipboardCheck,
  Heart,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Monitor,
  PanelsTopLeft,
  ReceiptText,
  ShieldCheck,
  Star,
  Store,
} from 'lucide-react';
import Link from 'next/link';

const painPoints = [
  {
    title: 'Avis clients difficiles a suivre',
    description: "Les avis Google, Facebook et plateformes s'accumulent sans reponse claire.",
    icon: MessageSquare,
  },
  {
    title: 'Reservations dispersees',
    description: 'Telephone, reseaux sociaux, site web et messages creent vite des doublons.',
    icon: CalendarCheck,
  },
  {
    title: 'Messages clients partout',
    description: 'Messenger, Instagram, emails et demandes de groupe restent eparpilles.',
    icon: Mail,
  },
  {
    title: 'Pointage et paie compliques',
    description: "Les heures d'entree, de sortie et les absences prennent trop de temps.",
    icon: Clock,
  },
  {
    title: 'Organisation quotidienne lourde',
    description: 'Taches, stock, contenus, planning et fermeture de caisse manquent de suivi.',
    icon: ClipboardCheck,
  },
  {
    title: 'Conformite a surveiller',
    description: 'Regles hygiene, obligations et veille secteur doivent etre visibles au bon moment.',
    icon: ShieldCheck,
  },
];

const modules = [
  {
    name: 'Web',
    description: 'Le site public presente le restaurant, capte les demandes et prepare la conversion.',
    icon: PanelsTopLeft,
    items: ['Pages restaurant', 'Demandes client', 'Contenu public'],
  },
  {
    name: 'Admin',
    description: "Le back office centralise le plan du jour, l'equipe, les clients et les modules actifs.",
    icon: LayoutDashboard,
    items: ['Reservations', 'Taches du jour', 'Avis, emails et contenus'],
  },
  {
    name: 'POS',
    description: 'Le point de vente gere commandes, tables, paiements, tickets et service en temps reel.',
    icon: ReceiptText,
    items: ['Commandes', 'Paiements', 'Impression'],
  },
  {
    name: 'Display',
    description: 'Les ecrans du restaurant diffusent menus, promotions et contenus programmables.',
    icon: Monitor,
    items: ['Menus ecran', 'Campagnes', 'Planning media'],
  },
];

const todayStats = [
  { label: 'Avis a repondre', value: '4', helper: '+2 aujourd hui', icon: Star, tone: 'info' as const },
  { label: 'Reservations', value: '12', helper: '+3 aujourd hui', icon: CalendarCheck, tone: 'success' as const },
  { label: 'Retours internes', value: '2', helper: 'Nouveaux', icon: MessageSquare, tone: 'warning' as const },
  { label: 'Heures pointees', value: '18h30', helper: 'Aujourd hui', icon: Clock, tone: 'info' as const },
];

const recentEvents = [
  { title: 'Nouvel avis 5 etoiles', description: 'Il y a 15 minutes', action: 'Repondre', icon: Star },
  { title: 'Reservation vendredi 20h', description: 'Il y a 1 heure', action: 'Voir', icon: CalendarCheck },
  { title: 'Retour interne : attente longue', description: 'Il y a 2 heures', action: 'Voir', icon: MessageSquare },
];

const packageNotes = [
  'Modules activables selon abonnement',
  'Pense pour les independants et petits groupes',
  'Accompagnement humain pour la mise en place',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-yuta-paper text-yuta-ink">
      <header className="sticky top-0 z-20 border-b border-yuta-line bg-yuta-paper/95">
        <nav className="mx-auto flex h-20 w-full max-w-[1720px] items-center justify-between px-6 lg:px-10 2xl:px-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-yuta-success text-white">
              <Store className="h-6 w-6" />
            </div>
            <span className="text-4xl font-bold tracking-tight text-yuta-success">YUTA</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-yuta-ink/75 lg:flex">
            <a href="#solutions" className="inline-flex items-center gap-1 hover:text-yuta-ink">
              Solutions <ChevronDown className="h-4 w-4" />
            </a>
            <a href="#diagnostic" className="hover:text-yuta-ink">Diagnostic</a>
            <a href="#tarifs" className="hover:text-yuta-ink">Tarifs</a>
            <a href="#modules" className="hover:text-yuta-ink">A propos</a>
            <a href="#ressources" className="inline-flex items-center gap-1 hover:text-yuta-ink">
              Ressources <ChevronDown className="h-4 w-4" />
            </a>
            <a href="#contact" className="hover:text-yuta-ink">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" className="hidden rounded-full px-6 lg:inline-flex">
              Se connecter
            </Button>
            <Button variant="success" className="rounded-full px-5 sm:px-6">
              <span className="hidden sm:inline">Demander une demo</span>
              <span className="sm:hidden">Demo</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-[1720px] gap-10 px-6 py-12 md:py-16 lg:min-h-[calc(100vh-80px)] lg:grid-cols-[minmax(480px,0.95fr)_minmax(560px,1.05fr)] lg:items-center lg:px-10 xl:grid-cols-[minmax(520px,0.95fr)_minmax(680px,1.05fr)] 2xl:px-20">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-yuta-line bg-white px-4 py-2 text-sm font-medium text-yuta-ink/70 shadow-card">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-yuta-success text-white">
              <Heart className="h-4 w-4" />
            </span>
            Cree par des restaurateurs, pour des restaurateurs
          </div>

          <h1 className="max-w-[760px] text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl 2xl:text-7xl">
            Des outils simples pour les restaurants qui veulent{' '}
            <span className="text-yuta-success">gagner du temps</span>
          </h1>

          <p className="mt-7 max-w-2xl text-xl leading-9 text-yuta-ink/70">
            Centralisez avis clients, reservations, messages, taches quotidiennes et modules POS depuis une seule plateforme.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="success" size="lg" className="w-full rounded-full px-8 sm:w-auto">
              Demander une demo
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="lg" className="w-full rounded-full px-8 sm:w-auto">
              Decouvrir les solutions
            </Button>
          </div>

          <div className="mt-9 flex flex-wrap gap-6 text-sm font-medium text-yuta-ink/65">
            {packageNotes.map((note) => (
              <span key={note} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-yuta-success" />
                {note}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full lg:justify-self-end xl:max-w-[920px]">
          <DashboardPreview />
        </div>
      </section>

      <section id="diagnostic" className="border-t border-yuta-line bg-white/65 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-yuta-success">Vos defis quotidiens</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              On connait vos problemes, on a les solutions
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {painPoints.map((point) => {
              const Icon = point.icon;

              return (
                <Card key={point.title} className="min-h-64 p-6">
                  <IconTile tone="success" size="lg" className="mb-6">
                    <Icon className="h-6 w-6" />
                  </IconTile>
                  <h3 className="text-xl font-bold leading-tight">{point.title}</h3>
                  <p className="mt-4 leading-7 text-yuta-ink/62">{point.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-yuta-success">Fonctions par app</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Une plateforme, plusieurs surfaces de travail
            </h2>
            <p className="mt-5 leading-8 text-yuta-ink/65">
              YuTa se deploie par modules. Chaque restaurant active uniquement les fonctions utiles a son abonnement: gestion quotidienne, relation client, POS, affichage ou conformite.
            </p>
          </div>

          <div id="modules" className="grid gap-5 md:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Card key={module.name} className="p-6">
                  <div className="flex items-start gap-4">
                    <IconTile tone="success">
                      <Icon className="h-5 w-5" />
                    </IconTile>
                    <div>
                      <h3 className="text-xl font-bold">{module.name}</h3>
                      <p className="mt-2 leading-7 text-yuta-ink/62">{module.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {module.items.map((item) => (
                      <span key={item} className="inline-flex items-center gap-2 text-sm font-medium text-yuta-ink/65">
                        <Check className="h-4 w-4 text-yuta-success" />
                        {item}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-white/65 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.9fr] lg:px-10">
          <Card className="p-8">
            <Badge variant="success">Abonnement modulaire</Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Payez pour les modules que votre restaurant utilise vraiment
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-yuta-ink/65">
              Commencez avec avis, reservations et taches du jour. Ajoutez ensuite POS, ecrans, stock, marketing ou veille conformite selon votre maturite.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {['Core operations', 'Marketing & clients', 'POS', 'Display', 'Conformite'].map((item) => (
                <Badge key={item} variant="outline" className="px-3 py-1">
                  {item}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold">Diagnostic gratuit</h3>
            <p className="mt-3 leading-7 text-yuta-ink/65">
              En 30 minutes, on identifie les pertes de temps, les canaux clients a centraliser et les modules prioritaires pour votre restaurant.
            </p>
            <Button variant="success" className="mt-7 w-full rounded-full">
              Planifier un diagnostic
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </section>

      <footer id="contact" className="border-t border-yuta-line py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-yuta-ink/55 md:flex-row md:items-center md:justify-between lg:px-10">
          <p className="font-semibold text-yuta-ink">YUTA</p>
          <p>Des outils simples pour restaurants independants, groupes et franchises.</p>
          <p>contact@yuta.local</p>
        </div>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  return (
    <Card className="overflow-hidden p-0 shadow-card">
      <div className="grid min-h-[420px] xl:min-h-[560px] xl:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-yuta-line bg-white p-5 xl:block">
          <div className="mb-8 flex items-center gap-2">
            <IconTile tone="success" size="sm" shape="circle">
              <Store className="h-4 w-4" />
            </IconTile>
            <span className="text-lg font-bold text-yuta-success">YUTA</span>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-yuta-ink/62">
            {['Tableau de bord', 'Avis clients', 'Reservations', 'Messages', 'Pointage', 'Retours internes', 'Parametres'].map((item, index) => (
              <div
                key={item}
                className={index === 0 ? 'rounded-lg bg-yuta-mist px-3 py-2 text-yuta-ink' : 'px-3 py-2'}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="bg-yuta-paper p-4 sm:p-5 md:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yuta-ink/55">Bonjour, Maison Saigon</p>
              <h3 className="mt-1 text-2xl font-bold">Aujourd'hui</h3>
            </div>
            <Badge variant="outline">Maison Saigon</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {todayStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  helper={stat.helper}
                  tone={stat.tone}
                  icon={<Icon className="h-4 w-4" />}
                  className="min-h-32 shadow-none"
                />
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.85fr]">
            <Panel title="Derniers evenements">
              <div>
                {recentEvents.map((event, index) => {
                  const Icon = event.icon;

                  return (
                    <ListRow
                      key={event.title}
                      className={index > 0 ? 'border-t border-yuta-line' : undefined}
                      media={
                        <IconTile tone={index === 0 ? 'info' : index === 1 ? 'success' : 'warning'}>
                          <Icon className="h-4 w-4" />
                        </IconTile>
                      }
                      title={event.title}
                      description={event.description}
                      action={<Button variant="secondary" size="sm">{event.action}</Button>}
                    />
                  );
                })}
              </div>
            </Panel>

            <Panel title="Avis clients">
              <div className="grid place-items-center p-5 text-center">
                <div className="grid h-36 w-36 place-items-center rounded-full border-[18px] border-yuta-success bg-white">
                  <div>
                    <p className="text-3xl font-bold">128</p>
                    <p className="text-xs font-medium text-yuta-ink/50">avis</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-sm text-yuta-ink/62">
                  <span>5 etoiles - 68%</span>
                  <span>4 etoiles - 22%</span>
                  <span>3 etoiles - 7%</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Card>
  );
}
