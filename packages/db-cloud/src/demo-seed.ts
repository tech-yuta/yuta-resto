import { and, eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CloudDatabaseClient } from './client';
import {
  directCustomerFeedback,
  establishments,
  feedbackInternalNotes,
  feedbackItems,
  feedbackReplies,
  organizations,
  users,
} from './schema';

config({ path: '.env.local' });
config({ path: '.env' });

const dayInMilliseconds = 24 * 60 * 60 * 1000;

const demoFeedback = [
  {
    id: '019faa29-fe48-70d9-8021-cbfbfd8ff31a',
    externalId: 'yuta-demo-review-camille',
    source: 'GOOGLE',
    type: 'PUBLIC_REVIEW',
    authorName: 'Camille Bernard',
    rating: 5,
    content:
      "Une très belle découverte. Le pho était parfumé, le service chaleureux et l'équipe très attentive. Nous reviendrons avec plaisir.",
    sentiment: 'POSITIVE',
    urgency: 'LOW',
    status: 'REPLIED',
    daysAgo: 1,
  },
  {
    id: '019faa29-fe48-70d9-8021-cccc5a5fa24e',
    externalId: 'yuta-demo-review-marc',
    source: 'GOOGLE',
    type: 'PUBLIC_REVIEW',
    authorName: 'Marc Leroy',
    rating: 2,
    content:
      "Le repas était bon, mais nous avons attendu presque quarante minutes avant d'être servis. Dommage pour un déjeuner en semaine.",
    sentiment: 'NEGATIVE',
    urgency: 'HIGH',
    status: 'TO_PROCESS',
    daysAgo: 2,
    assigned: true,
  },
  {
    id: '019faa29-fe48-70d9-8021-d3a30ca75363',
    externalId: 'yuta-demo-review-sophie',
    source: 'GOOGLE',
    type: 'PUBLIC_REVIEW',
    authorName: 'Sophie Martin',
    rating: 4,
    content:
      'Très bons plats et portions généreuses. La salle était un peu bruyante, mais nous avons passé une excellente soirée.',
    sentiment: 'POSITIVE',
    urgency: 'LOW',
    status: 'NEW',
    daysAgo: 3,
  },
  {
    id: '019faa29-fe48-70d9-8021-d4f73b4b50bf',
    externalId: 'yuta-demo-review-antoine',
    source: 'GOOGLE',
    type: 'PUBLIC_REVIEW',
    authorName: 'Antoine Petit',
    rating: 3,
    content:
      "Cuisine correcte et accueil sympathique. J'aurais aimé davantage d'options végétariennes à la carte.",
    sentiment: 'NEUTRAL',
    urgency: 'MEDIUM',
    status: 'DRAFTED',
    daysAgo: 4,
    assigned: true,
  },
  {
    id: '019faa29-fe48-70d9-8021-d84bed486233',
    externalId: 'yuta-demo-review-lea',
    source: 'GOOGLE',
    type: 'PUBLIC_REVIEW',
    authorName: 'Léa Fontaine',
    rating: 1,
    content:
      "Notre commande à emporter était incomplète et nous n'avons pas réussi à joindre le restaurant le soir même.",
    sentiment: 'NEGATIVE',
    urgency: 'CRITICAL',
    status: 'FOLLOW_UP',
    daysAgo: 5,
    assigned: true,
  },
  {
    id: '019faa29-fe48-70d9-8021-dc64d3d4cd54',
    externalId: 'yuta-demo-review-julien',
    source: 'GOOGLE',
    type: 'PUBLIC_REVIEW',
    authorName: 'Julien Robert',
    rating: 5,
    content:
      'Accueil impeccable, produits frais et très bon rapport qualité-prix. Mention spéciale pour le dessert maison.',
    sentiment: 'POSITIVE',
    urgency: 'LOW',
    status: 'RESOLVED',
    daysAgo: 7,
  },
  {
    id: '019faa29-fe48-70d9-8021-e2c20ac070de',
    externalId: 'yuta-demo-direct-claire',
    source: 'DIRECT',
    type: 'DIRECT_FEEDBACK',
    authorName: 'Claire Dubois',
    rating: 3,
    content:
      "Le personnel était très aimable. Le plat principal manquait toutefois un peu de chaleur à l'arrivée.",
    sentiment: 'NEUTRAL',
    urgency: 'MEDIUM',
    status: 'NEW',
    daysAgo: 8,
  },
] as const;

export async function seedCloudReputationDemo(
  seedDb?: CloudDatabaseClient,
): Promise<{ feedbackCount: number; replyCount: number; noteCount: number }> {
  if (process.env.CONFIRM_CLOUD_DEMO_SEED !== 'true') {
    throw new Error(
      'CONFIRM_CLOUD_DEMO_SEED=true is required to insert demo feedback.',
    );
  }

  const ownsClient = !seedDb;
  const activeDb =
    seedDb ?? (await import('./client')).createCloudDatabaseClient(process.env);

  try {
    const organization = await activeDb.query.organizations.findFirst({
      where: eq(organizations.slug, 'luna'),
    });
    const establishment = organization
      ? await activeDb.query.establishments.findFirst({
          where: and(
            eq(establishments.organizationId, organization.id),
            eq(establishments.slug, 'luna'),
          ),
        })
      : undefined;
    const ownerUser = await activeDb.query.users.findFirst({
      where: eq(users.email, 'owner@luna-restaurant.fr'),
    });

    if (!organization || !establishment || !ownerUser) {
      throw new Error(
        'Run the cloud foundation seed before the reputation demo seed.',
      );
    }

    const now = Date.now();
    const feedbackIds = new Map<string, string>();

    for (const item of demoFeedback) {
      const receivedAt = new Date(now - item.daysAgo * dayInMilliseconds);
      const values = {
        organizationId: organization.id,
        establishmentId: establishment.id,
        source: item.source,
        type: item.type,
        externalId: item.externalId,
        externalUrl: null,
        authorName: item.authorName,
        authorAvatarUrl: null,
        rating: item.rating,
        title: null,
        content: item.content,
        language: 'fr',
        sentiment: item.sentiment,
        urgency: item.urgency,
        status: item.status,
        assignedToUserId: 'assigned' in item ? ownerUser.id : null,
        publishedAt: receivedAt,
        receivedAt,
        lastSyncedAt: receivedAt,
        providerMetadata: {
          demo: true,
          seedKey: item.externalId,
        },
      };
      const existing = await activeDb.query.feedbackItems.findFirst({
        where: and(
          eq(feedbackItems.organizationId, organization.id),
          eq(feedbackItems.source, item.source),
          eq(feedbackItems.externalId, item.externalId),
        ),
      });

      if (existing) {
        await activeDb
          .update(feedbackItems)
          .set(values)
          .where(eq(feedbackItems.id, existing.id));
        feedbackIds.set(item.externalId, existing.id);
      } else {
        await activeDb.insert(feedbackItems).values({ id: item.id, ...values });
        feedbackIds.set(item.externalId, item.id);
      }
    }

    const replySeeds = [
      {
        id: '019faa29-fe48-70d9-8021-e6586f3685c9',
        feedbackKey: 'yuta-demo-review-camille',
        content:
          "Merci beaucoup Camille pour votre message ! Nous sommes ravis que le pho et l'accueil vous aient plu. Au plaisir de vous revoir très bientôt. — L'équipe LUNA",
        status: 'PUBLISHED',
        generatedByAi: false,
        publishedAt: new Date(now - 20 * 60 * 60 * 1000),
      },
      {
        id: '019faa29-fe48-70d9-8021-ea91ddaa7939',
        feedbackKey: 'yuta-demo-review-antoine',
        content:
          "Merci Antoine pour votre retour. Nous travaillons justement à enrichir nos options végétariennes et espérons vous faire découvrir ces nouveautés prochainement. — L'équipe LUNA",
        status: 'DRAFT',
        generatedByAi: true,
        publishedAt: null,
      },
      {
        id: '019faa29-fe48-70d9-8021-eed48a7ec875',
        feedbackKey: 'yuta-demo-review-julien',
        content:
          "Merci Julien pour cette excellente note et votre mention spéciale pour notre dessert maison ! Toute l'équipe sera ravie de vous accueillir à nouveau. — L'équipe LUNA",
        status: 'PUBLISHED',
        generatedByAi: false,
        publishedAt: new Date(now - 6 * dayInMilliseconds),
      },
    ] as const;

    for (const reply of replySeeds) {
      const feedbackItemId = feedbackIds.get(reply.feedbackKey);
      if (!feedbackItemId) {
        throw new Error(`Missing demo feedback ${reply.feedbackKey}.`);
      }
      const values = {
        organizationId: organization.id,
        feedbackItemId,
        content: reply.content,
        status: reply.status,
        generatedByAi: reply.generatedByAi,
        originalAiContent: reply.generatedByAi ? reply.content : null,
        createdByUserId: ownerUser.id,
        editedByUserId: reply.generatedByAi ? null : ownerUser.id,
        approvedByUserId: reply.status === 'PUBLISHED' ? ownerUser.id : null,
        publishedByUserId: reply.status === 'PUBLISHED' ? ownerUser.id : null,
        publishedAt: reply.publishedAt,
      };

      await activeDb
        .insert(feedbackReplies)
        .values({ id: reply.id, ...values })
        .onConflictDoUpdate({ target: feedbackReplies.id, set: values });
    }

    const noteSeeds = [
      {
        id: '019faa29-fe49-767d-8c02-ebc072d05eac',
        feedbackKey: 'yuta-demo-review-marc',
        content:
          "Vérifier le temps d'attente du service du midi avec le responsable de salle avant de répondre.",
      },
      {
        id: '019faa29-fe49-767d-8c02-edd97e710f4c',
        feedbackKey: 'yuta-demo-review-lea',
        content:
          "Contacter la cliente et proposer le remboursement de l'article manquant.",
      },
    ] as const;

    for (const note of noteSeeds) {
      const feedbackItemId = feedbackIds.get(note.feedbackKey);
      if (!feedbackItemId) {
        throw new Error(`Missing demo feedback ${note.feedbackKey}.`);
      }
      const values = {
        organizationId: organization.id,
        feedbackItemId,
        content: note.content,
        createdByUserId: ownerUser.id,
      };

      await activeDb
        .insert(feedbackInternalNotes)
        .values({ id: note.id, ...values })
        .onConflictDoUpdate({ target: feedbackInternalNotes.id, set: values });
    }

    const directFeedbackItemId = feedbackIds.get('yuta-demo-direct-claire');
    if (!directFeedbackItemId) {
      throw new Error('Missing direct demo feedback.');
    }
    const directValues = {
      organizationId: organization.id,
      establishmentId: establishment.id,
      feedbackItemId: directFeedbackItemId,
      selectedTopics: ['SERVICE', 'FOOD_TEMPERATURE'],
      customerName: 'Claire Dubois',
      customerEmail: null,
      customerPhone: null,
      consentToContact: false,
      orderReference: 'DEMO-1042',
      visitDate: new Date(now - 8 * dayInMilliseconds),
      servicePeriod: 'DINNER' as const,
      sourceTag: 'demo-seed',
      submissionIpHash: null,
      userAgent: 'YuTa demo seed',
    };
    await activeDb
      .insert(directCustomerFeedback)
      .values({
        id: '019faa29-fe49-767d-8c02-f0426d5d4e0b',
        ...directValues,
      })
      .onConflictDoUpdate({
        target: directCustomerFeedback.id,
        set: directValues,
      });

    return {
      feedbackCount: demoFeedback.length,
      replyCount: replySeeds.length,
      noteCount: noteSeeds.length,
    };
  } finally {
    if (ownsClient) {
      await activeDb.$client.end({ timeout: 5 });
    }
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  seedCloudReputationDemo()
    .then((result) => {
      console.log(
        `YuTa cloud demo seed completed: ${result.feedbackCount} feedback, ${result.replyCount} replies, ${result.noteCount} notes.`,
      );
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
