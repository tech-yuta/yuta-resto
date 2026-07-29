import { Badge, Button, Card, IconTile, PageHeader } from '@yuta/ui';
import {
  ChartNoAxesCombined,
  Layers3,
  ListChecks,
  LogOut,
  Printer,
  Tags,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { requireLocalManagementSession } from '../../server/local-management-session';
import { signOutManagementAction } from './actions';

const modules = [
  {
    title: 'Équipe POS',
    description: 'Utilisateurs, rôles, PIN et activation.',
    icon: Users,
    tone: 'brand' as const,
    href: '/management/users',
  },
  {
    title: 'Menu et catégories',
    description: 'Articles, prix, postes cuisine et disponibilité.',
    icon: Tags,
    tone: 'success' as const,
    href: '/management/catalog',
  },
  {
    title: 'Formules et combos',
    description: 'Règles, groupes, suppléments et priorités.',
    icon: Layers3,
    tone: 'info' as const,
    href: '/management/combos',
  },
  {
    title: 'Rapports locaux',
    description: 'Chiffre payé, commandes ouvertes et activité du jour.',
    icon: ChartNoAxesCombined,
    tone: 'warning' as const,
    href: null,
  },
  {
    title: "File d'impression",
    description: 'Tickets en attente, imprimés, échoués et relance.',
    icon: Printer,
    tone: 'neutral' as const,
    href: '/management/printing',
  },
] as const;

export default async function ManagementHomePage() {
  const session = await requireLocalManagementSession();

  return (
    <main className="min-h-dvh bg-canvas text-primary">
      <div className="mx-auto grid min-h-dvh max-w-6xl content-start gap-6 px-4 py-6 md:px-8">
        <PageHeader
          eyebrow="YuTa POS"
          title="Gestion locale"
          description={`Connecté en tant que ${session.user.name} · ${roleLabel(session.user.role)}`}
          media={
            <IconTile tone="inverse">
              <ListChecks className="h-5 w-5" />
            </IconTile>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/">Retour au POS</Link>
              </Button>
              <form action={signOutManagementAction}>
                <Button type="submit" variant="outline">
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </Button>
              </form>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const ModuleIcon = module.icon;
            return (
              <Card key={module.title} padding="lg" className="grid gap-4">
                <div className="flex items-start justify-between gap-3">
                  <IconTile tone={module.tone}>
                    <ModuleIcon className="h-5 w-5" />
                  </IconTile>
                  <Badge
                    tone={module.href ? 'success' : 'neutral'}
                    variant="soft"
                  >
                    {module.href ? 'Disponible' : 'Prochaine étape'}
                  </Badge>
                </div>
                <div>
                  <h2 className="text-lg font-black">{module.title}</h2>
                  <p className="mt-1 text-sm text-secondary">
                    {module.description}
                  </p>
                </div>
                {module.href && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={module.href}>Ouvrir</Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function roleLabel(role: string): string {
  return role === 'admin' ? 'Administrateur' : 'Manager';
}
