import { config } from 'dotenv';
import { and, eq } from 'drizzle-orm';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DbClient } from './client';
import {
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  menuCategories,
  menuItems,
  organizations,
  establishments,
  directCustomerFeedback,
  feedbackAnalyses,
  feedbackIncidents,
  feedbackItems,
  feedbackReplies,
  reputationSettings,
  tenantDomains,
  tenantEntitlements,
  tenantMemberships,
  users,
  type ComboRule,
  type ComboRuleGroup,
  type MenuCategory,
  type MenuItem,
  type User,
} from './schema';

export const INITIAL_ORGANIZATION_ID = '10000000-0000-4000-8000-000000000001';
export const INITIAL_ESTABLISHMENT_ID = '10000000-0000-4000-8000-000000000002';

export async function seedTenantData(seedDb?: DbClient) {
  const activeDb = seedDb ?? (await import('./client')).db;
  const [organization] = await activeDb
    .insert(organizations)
    .values({
      id: INITIAL_ORGANIZATION_ID,
      name: 'FAST VIET',
      slug: 'fast-viet',
      status: 'active',
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
      currency: 'EUR',
    })
    .onConflictDoUpdate({
      target: organizations.id,
      set: {
        name: 'FAST VIET',
        slug: 'fast-viet',
        status: 'active',
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
        currency: 'EUR',
      },
    })
    .returning();
  const [establishment] = await activeDb
    .insert(establishments)
    .values({
      id: INITIAL_ESTABLISHMENT_ID,
      organizationId: organization.id,
      name: 'LUNA Chasseneuil-du-Poitou',
      slug: 'luna-chasseneuil-du-poitou',
      status: 'active',
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
    })
    .onConflictDoUpdate({
      target: establishments.id,
      set: {
        organizationId: organization.id,
        name: 'LUNA Chasseneuil-du-Poitou',
        slug: 'luna-chasseneuil-du-poitou',
        status: 'active',
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
      },
    })
    .returning();
  await activeDb
    .insert(tenantDomains)
    .values({
      organizationId: organization.id,
      establishmentId: establishment.id,
      hostname: 'luna.localhost',
      status: 'active',
      isPrimary: true,
      verifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tenantDomains.hostname,
      set: {
        organizationId: organization.id,
        establishmentId: establishment.id,
        status: 'active',
        isPrimary: true,
        verifiedAt: new Date(),
      },
    });
  for (const key of [
    'menu.public',
    'reservations.public',
    'reputation.enabled',
  ]) {
    await activeDb
      .insert(tenantEntitlements)
      .values({
        organizationId: organization.id,
        establishmentId: establishment.id,
        key,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: [
          tenantEntitlements.organizationId,
          tenantEntitlements.establishmentId,
          tenantEntitlements.key,
        ],
        set: { enabled: true },
      });
  }
  return { organization, establishment };
}

config({ path: '.env.local' });
config({ path: '.env' });

type SeedContext = {
  adminUser: User;
  staffUser: User;
  kitchenUser: User;
  categories: Record<string, MenuCategory>;
  menuItems: Record<string, MenuItem>;
  comboRules: Record<string, ComboRule>;
};

const categorySeeds = [
  { name: 'Entrees', sortOrder: 10 },
  { name: 'Plats', sortOrder: 20 },
  { name: 'Boissons', sortOrder: 30 },
  { name: 'Desserts', sortOrder: 40 },
];

const menuItemSeeds = [
  {
    name: 'Bun bo',
    category: 'Plats',
    priceCents: 1300,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Com ga',
    category: 'Plats',
    priceCents: 1200,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Pho',
    category: 'Plats',
    priceCents: 1400,
    kitchenStation: 'kitchen',
    sortOrder: 30,
  },
  {
    name: 'Coca',
    category: 'Boissons',
    priceCents: 300,
    kitchenStation: 'bar',
    sortOrder: 10,
  },
  {
    name: 'The glace maison',
    category: 'Boissons',
    priceCents: 400,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  {
    name: 'Che',
    category: 'Desserts',
    priceCents: 500,
    kitchenStation: 'dessert',
    sortOrder: 10,
  },
  {
    name: 'Mochi',
    category: 'Desserts',
    priceCents: 400,
    kitchenStation: 'dessert',
    sortOrder: 20,
  },
] as const;

const comboSeeds = [
  {
    name: 'Combo A',
    comboPriceCents: 1400,
    priority: 10,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: [
          { name: 'Bun bo', extraPriceCents: 0 },
          { name: 'Com ga', extraPriceCents: 0 },
          { name: 'Pho', extraPriceCents: 100 },
        ],
      },
      {
        name: 'Boisson',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: [
          { name: 'Coca', extraPriceCents: 0 },
          { name: 'The glace maison', extraPriceCents: 100 },
        ],
      },
    ],
  },
  {
    name: 'Combo B',
    comboPriceCents: 1700,
    priority: 20,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: [
          { name: 'Bun bo', extraPriceCents: 0 },
          { name: 'Com ga', extraPriceCents: 0 },
          { name: 'Pho', extraPriceCents: 100 },
        ],
      },
      {
        name: 'Boisson',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: [
          { name: 'Coca', extraPriceCents: 0 },
          { name: 'The glace maison', extraPriceCents: 100 },
        ],
      },
      {
        name: 'Dessert',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 30,
        items: [
          { name: 'Che', extraPriceCents: 0 },
          { name: 'Mochi', extraPriceCents: 0 },
        ],
      },
    ],
  },
];

export async function seedPosData(seedDb?: DbClient): Promise<SeedContext> {
  const activeDb = seedDb ?? (await import('./client')).db;
  const tenant = await seedTenantData(activeDb);

  const adminUser = await upsertUser(activeDb, {
    name: 'YuTa Admin',
    email: 'admin@yuta.local',
    role: 'admin',
  });
  const staffUser = await upsertUser(activeDb, {
    name: 'YuTa Staff',
    email: 'staff@yuta.local',
    role: 'staff',
  });
  const kitchenUser = await upsertUser(activeDb, {
    name: 'YuTa Kitchen',
    email: 'kitchen@yuta.local',
    role: 'kitchen',
  });

  for (const membership of [
    { userId: adminUser.id, role: 'admin' as const },
    { userId: staffUser.id, role: 'employee' as const },
    { userId: kitchenUser.id, role: 'kitchen' as const },
  ]) {
    await upsertMembership(activeDb, {
      ...membership,
      organizationId: tenant.organization.id,
      establishmentId: tenant.establishment.id,
    });
  }

  await seedReputationData(activeDb, {
    organizationId: tenant.organization.id,
    establishmentId: tenant.establishment.id,
    adminUserId: adminUser.id,
  });

  const categories: Record<string, MenuCategory> = {};
  for (const categorySeed of categorySeeds) {
    categories[categorySeed.name] = await upsertCategory(
      activeDb,
      categorySeed,
    );
  }

  const seededMenuItems: Record<string, MenuItem> = {};
  for (const itemSeed of menuItemSeeds) {
    seededMenuItems[itemSeed.name] = await upsertMenuItem(activeDb, {
      categoryId: categories[itemSeed.category].id,
      name: itemSeed.name,
      priceCents: itemSeed.priceCents,
      kitchenStation: itemSeed.kitchenStation,
      sortOrder: itemSeed.sortOrder,
    });
  }

  const seededComboRules: Record<string, ComboRule> = {};
  for (const comboSeed of comboSeeds) {
    const comboRule = await upsertComboRule(activeDb, comboSeed);
    seededComboRules[comboRule.name] = comboRule;

    for (const groupSeed of comboSeed.groups) {
      const group = await upsertComboRuleGroup(activeDb, {
        comboRuleId: comboRule.id,
        name: groupSeed.name,
        minQuantity: groupSeed.minQuantity,
        maxQuantity: groupSeed.maxQuantity,
        sortOrder: groupSeed.sortOrder,
      });

      for (const itemSeed of groupSeed.items) {
        await upsertComboRuleGroupItem(activeDb, {
          comboRuleGroupId: group.id,
          menuItemId: seededMenuItems[itemSeed.name].id,
          extraPriceCents: itemSeed.extraPriceCents,
        });
      }
    }
  }

  return {
    adminUser,
    staffUser,
    kitchenUser,
    categories,
    menuItems: seededMenuItems,
    comboRules: seededComboRules,
  };
}

const reputationFeedbackIds = {
  positiveGoogle: '20000000-0000-4000-8000-000000000001',
  neutralGoogle: '20000000-0000-4000-8000-000000000002',
  negativeGoogle: '20000000-0000-4000-8000-000000000003',
  positiveDirect: '20000000-0000-4000-8000-000000000004',
  negativeDirect: '20000000-0000-4000-8000-000000000005',
} as const;

async function seedReputationData(
  seedDb: DbClient,
  scope: {
    organizationId: string;
    establishmentId: string;
    adminUserId: string;
  },
): Promise<void> {
  const brandVoice = `Warm, professional and human.
Use natural French.
Avoid defensive language.
Do not repeat the entire customer complaint.
Acknowledge the customer's experience.
Apologise clearly when appropriate.
Offer a practical next step when needed.
Avoid exaggerated marketing language.
Keep the reply concise.
End with "L'équipe LUNA" unless the context requires otherwise.`;

  await seedDb
    .insert(reputationSettings)
    .values({
      organizationId: scope.organizationId,
      establishmentId: scope.establishmentId,
      brandVoice,
      replySignature: "L'équipe LUNA",
      defaultReplyLanguage: 'fr',
      publicFeedbackEnabled: true,
      publicFeedbackSlug: 'luna',
      googleReviewUrl:
        'https://search.google.com/local/writereview?placeid=luna-development',
      notifyOnNewReview: true,
      notifyOnNegativeReview: true,
      negativeRatingThreshold: 3,
    })
    .onConflictDoUpdate({
      target: [
        reputationSettings.organizationId,
        reputationSettings.establishmentId,
      ],
      set: {
        brandVoice,
        replySignature: "L'équipe LUNA",
        defaultReplyLanguage: 'fr',
        publicFeedbackEnabled: true,
        publicFeedbackSlug: 'luna',
        googleReviewUrl:
          'https://search.google.com/local/writereview?placeid=luna-development',
        negativeRatingThreshold: 3,
      },
    });

  const now = Date.now();
  const feedbackSeeds = [
    {
      id: reputationFeedbackIds.positiveGoogle,
      source: 'GOOGLE' as const,
      type: 'PUBLIC_REVIEW' as const,
      externalId: 'seed-google-review-5',
      externalUrl: 'https://www.google.com/maps',
      authorName: 'Camille R.',
      rating: 5,
      content:
        "Excellent accueil et plats délicieux. Le bánh mì était très frais, nous reviendrons !",
      sentiment: 'POSITIVE' as const,
      urgency: 'LOW' as const,
      status: 'REPLIED' as const,
      publishedAt: new Date(now - 2 * 60 * 60 * 1_000),
      receivedAt: new Date(now - 2 * 60 * 60 * 1_000),
    },
    {
      id: reputationFeedbackIds.neutralGoogle,
      source: 'GOOGLE' as const,
      type: 'PUBLIC_REVIEW' as const,
      externalId: 'seed-google-review-3',
      externalUrl: 'https://www.google.com/maps',
      authorName: 'Marc D.',
      rating: 3,
      content:
        "Bon restaurant, mais l'attente était un peu longue pour une commande à emporter.",
      sentiment: 'NEUTRAL' as const,
      urgency: 'MEDIUM' as const,
      status: 'DRAFTED' as const,
      publishedAt: new Date(now - 8 * 60 * 60 * 1_000),
      receivedAt: new Date(now - 8 * 60 * 60 * 1_000),
    },
    {
      id: reputationFeedbackIds.negativeGoogle,
      source: 'GOOGLE' as const,
      type: 'PUBLIC_REVIEW' as const,
      externalId: 'seed-google-review-1',
      externalUrl: 'https://www.google.com/maps',
      authorName: 'Julie B.',
      rating: 1,
      content:
        "Très déçue, j'ai attendu 50 minutes et ma commande n'était pas complète.",
      sentiment: 'NEGATIVE' as const,
      urgency: 'HIGH' as const,
      status: 'FOLLOW_UP' as const,
      publishedAt: new Date(now - 24 * 60 * 60 * 1_000),
      receivedAt: new Date(now - 24 * 60 * 60 * 1_000),
    },
    {
      id: reputationFeedbackIds.positiveDirect,
      source: 'DIRECT' as const,
      type: 'DIRECT_FEEDBACK' as const,
      externalId: null,
      externalUrl: null,
      authorName: null,
      rating: 5,
      content: 'Service rapide et équipe très sympathique.',
      sentiment: 'POSITIVE' as const,
      urgency: 'LOW' as const,
      status: 'NEW' as const,
      publishedAt: null,
      receivedAt: new Date(now - 30 * 60 * 1_000),
    },
    {
      id: reputationFeedbackIds.negativeDirect,
      source: 'DIRECT' as const,
      type: 'DIRECT_FEEDBACK' as const,
      externalId: null,
      externalUrl: null,
      authorName: 'Thomas L.',
      rating: 2,
      content:
        "Il manquait un plat dans ma commande. Je souhaite être recontacté.",
      sentiment: 'NEGATIVE' as const,
      urgency: 'MEDIUM' as const,
      status: 'TO_PROCESS' as const,
      publishedAt: null,
      receivedAt: new Date(now - 90 * 60 * 1_000),
    },
  ];

  for (const feedback of feedbackSeeds) {
    await seedDb
      .insert(feedbackItems)
      .values({
        ...feedback,
        organizationId: scope.organizationId,
        establishmentId: scope.establishmentId,
        language: 'fr',
      })
      .onConflictDoUpdate({
        target: feedbackItems.id,
        set: {
          source: feedback.source,
          type: feedback.type,
          externalId: feedback.externalId,
          externalUrl: feedback.externalUrl,
          authorName: feedback.authorName,
          rating: feedback.rating,
          content: feedback.content,
          sentiment: feedback.sentiment,
          urgency: feedback.urgency,
          status: feedback.status,
          publishedAt: feedback.publishedAt,
        },
      });
  }

  const directSeeds = [
    {
      id: '21000000-0000-4000-8000-000000000001',
      feedbackItemId: reputationFeedbackIds.positiveDirect,
      selectedTopics: ['FOOD_QUALITY', 'SERVICE'],
      customerName: null,
      customerEmail: null,
      customerPhone: null,
      consentToContact: false,
      consentRecordedAt: null,
    },
    {
      id: '21000000-0000-4000-8000-000000000002',
      feedbackItemId: reputationFeedbackIds.negativeDirect,
      selectedTopics: ['ORDER_ACCURACY'],
      customerName: 'Thomas L.',
      customerEmail: 'thomas@example.test',
      customerPhone: null,
      consentToContact: true,
      consentRecordedAt: new Date(now - 90 * 60 * 1_000),
    },
  ];
  for (const direct of directSeeds) {
    await seedDb
      .insert(directCustomerFeedback)
      .values({
        ...direct,
        organizationId: scope.organizationId,
        establishmentId: scope.establishmentId,
        sourceTag: 'table',
      })
      .onConflictDoUpdate({
        target: directCustomerFeedback.id,
        set: {
          selectedTopics: direct.selectedTopics,
          customerName: direct.customerName,
          customerEmail: direct.customerEmail,
          customerPhone: direct.customerPhone,
          consentToContact: direct.consentToContact,
          consentRecordedAt: direct.consentRecordedAt,
        },
      });
  }

  const analysisSeeds = [
    {
      id: '22000000-0000-4000-8000-000000000001',
      feedbackItemId: reputationFeedbackIds.positiveGoogle,
      sentiment: 'POSITIVE' as const,
      urgency: 'LOW' as const,
      summary: "Le client apprécie l'accueil et la fraîcheur des plats.",
      topics: ['WELCOME', 'FOOD_QUALITY'],
      suggestedAction: 'Remercier le client et l’inviter à revenir.',
      requiresFollowUp: false,
      requiresManagerAttention: false,
      confidence: 0.96,
      contentHash: 'seed-positive-google',
    },
    {
      id: '22000000-0000-4000-8000-000000000002',
      feedbackItemId: reputationFeedbackIds.neutralGoogle,
      sentiment: 'NEUTRAL' as const,
      urgency: 'MEDIUM' as const,
      summary:
        "Le client apprécie le restaurant mais signale un temps d'attente trop long.",
      topics: ['WAITING_TIME', 'ONLINE_ORDER'],
      suggestedAction: "Reconnaître l'attente et présenter des excuses.",
      requiresFollowUp: true,
      requiresManagerAttention: false,
      confidence: 0.9,
      contentHash: 'seed-neutral-google',
    },
    {
      id: '22000000-0000-4000-8000-000000000003',
      feedbackItemId: reputationFeedbackIds.negativeGoogle,
      sentiment: 'NEGATIVE' as const,
      urgency: 'HIGH' as const,
      summary:
        "Attente importante et commande incomplète nécessitant un suivi opérationnel.",
      topics: ['WAITING_TIME', 'ORDER_ACCURACY'],
      suggestedAction: 'Vérifier la préparation des commandes à emporter.',
      requiresFollowUp: true,
      requiresManagerAttention: true,
      confidence: 0.98,
      contentHash: 'seed-negative-google',
    },
    {
      id: '22000000-0000-4000-8000-000000000004',
      feedbackItemId: reputationFeedbackIds.negativeDirect,
      sentiment: 'NEGATIVE' as const,
      urgency: 'MEDIUM' as const,
      summary: 'Commande incomplète et demande explicite de contact.',
      topics: ['ORDER_ACCURACY'],
      suggestedAction: 'Recontacter le client et vérifier la commande.',
      requiresFollowUp: true,
      requiresManagerAttention: true,
      confidence: 0.95,
      contentHash: 'seed-negative-direct',
    },
  ];
  for (const analysis of analysisSeeds) {
    await seedDb
      .insert(feedbackAnalyses)
      .values({
        ...analysis,
        organizationId: scope.organizationId,
        model: 'seed',
        promptVersion: 'analyse-feedback.v1',
      })
      .onConflictDoUpdate({
        target: feedbackAnalyses.feedbackItemId,
        set: {
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          summary: analysis.summary,
          topics: analysis.topics,
          suggestedAction: analysis.suggestedAction,
          requiresFollowUp: analysis.requiresFollowUp,
          requiresManagerAttention: analysis.requiresManagerAttention,
          confidence: analysis.confidence,
          contentHash: analysis.contentHash,
        },
      });
  }

  const replySeeds = [
    {
      id: '23000000-0000-4000-8000-000000000001',
      feedbackItemId: reputationFeedbackIds.positiveGoogle,
      content:
        "Merci beaucoup pour votre message ! Nous sommes ravis que le bánh mì et l'accueil vous aient plu. À très bientôt !\n\nL'équipe LUNA",
      status: 'PUBLISHED' as const,
      generatedByAi: true,
      publishedAt: new Date(now - 60 * 60 * 1_000),
      errorCode: null,
      errorMessage: null,
    },
    {
      id: '23000000-0000-4000-8000-000000000002',
      feedbackItemId: reputationFeedbackIds.neutralGoogle,
      content:
        "Bonjour Marc, merci pour votre retour. Nous sommes désolés pour cette attente et travaillons à fluidifier les commandes à emporter.\n\nL'équipe LUNA",
      status: 'FAILED' as const,
      generatedByAi: true,
      publishedAt: null,
      errorCode: 'CONNECTOR_NOT_CONNECTED',
      errorMessage: 'Google connector is not connected.',
    },
  ];
  for (const reply of replySeeds) {
    await seedDb
      .insert(feedbackReplies)
      .values({
        ...reply,
        organizationId: scope.organizationId,
        originalAiContent: reply.content,
        createdByUserId: scope.adminUserId,
        publishedByUserId:
          reply.status === 'PUBLISHED' ? scope.adminUserId : null,
        failedAt: reply.status === 'FAILED' ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: feedbackReplies.id,
        set: {
          content: reply.content,
          status: reply.status,
          generatedByAi: reply.generatedByAi,
          publishedAt: reply.publishedAt,
          errorCode: reply.errorCode,
          errorMessage: reply.errorMessage,
        },
      });
  }

  await seedDb
    .insert(feedbackIncidents)
    .values({
      id: '24000000-0000-4000-8000-000000000001',
      organizationId: scope.organizationId,
      establishmentId: scope.establishmentId,
      feedbackItemId: reputationFeedbackIds.negativeGoogle,
      category: 'Erreur de commande',
      priority: 'HIGH',
      status: 'OPEN',
      ownerUserId: scope.adminUserId,
      title: 'Commande incomplète après une longue attente',
      description: 'Vérifier le processus de contrôle avant remise au client.',
      internalNotes: 'Incident créé depuis un avis Google de démonstration.',
      createdByUserId: scope.adminUserId,
    })
    .onConflictDoUpdate({
      target: feedbackIncidents.id,
      set: {
        category: 'Erreur de commande',
        priority: 'HIGH',
        status: 'OPEN',
        ownerUserId: scope.adminUserId,
        title: 'Commande incomplète après une longue attente',
      },
    });
}

async function upsertMembership(
  seedDb: DbClient,
  values: {
    userId: string;
    organizationId: string;
    establishmentId: string;
    role: 'admin' | 'employee' | 'kitchen';
  },
): Promise<void> {
  const existing = await seedDb.query.tenantMemberships.findFirst({
    where: and(
      eq(tenantMemberships.userId, values.userId),
      eq(tenantMemberships.organizationId, values.organizationId),
      eq(tenantMemberships.establishmentId, values.establishmentId),
    ),
  });
  if (existing) {
    await seedDb
      .update(tenantMemberships)
      .set({ role: values.role, status: 'active' })
      .where(eq(tenantMemberships.id, existing.id));
    return;
  }
  await seedDb
    .insert(tenantMemberships)
    .values({ ...values, status: 'active' });
}

async function upsertUser(
  seedDb: DbClient,
  values: { name: string; email: string; role: 'admin' | 'staff' | 'kitchen' },
): Promise<User> {
  const existing = await seedDb.query.users.findFirst({
    where: eq(users.email, values.email),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(users)
      .set({ name: values.name, role: values.role, isActive: true })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(users).values(values).returning();
  return created;
}

async function upsertCategory(
  seedDb: DbClient,
  values: { name: string; sortOrder: number },
): Promise<MenuCategory> {
  const existing = await seedDb.query.menuCategories.findFirst({
    where: eq(menuCategories.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(menuCategories)
      .set({ sortOrder: values.sortOrder, isActive: true })
      .where(eq(menuCategories.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(menuCategories)
    .values(values)
    .returning();
  return created;
}

async function upsertMenuItem(
  seedDb: DbClient,
  values: {
    categoryId: string;
    name: string;
    priceCents: number;
    kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
    sortOrder: number;
  },
): Promise<MenuItem> {
  const existing = await seedDb.query.menuItems.findFirst({
    where: eq(menuItems.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(menuItems)
      .set({
        categoryId: values.categoryId,
        priceCents: values.priceCents,
        kitchenStation: values.kitchenStation,
        sortOrder: values.sortOrder,
        isAvailable: true,
      })
      .where(eq(menuItems.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(menuItems).values(values).returning();
  return created;
}

async function upsertComboRule(
  seedDb: DbClient,
  values: { name: string; comboPriceCents: number; priority: number },
): Promise<ComboRule> {
  const existing = await seedDb.query.comboRules.findFirst({
    where: eq(comboRules.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRules)
      .set({
        comboPriceCents: values.comboPriceCents,
        priority: values.priority,
        isActive: true,
      })
      .where(eq(comboRules.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(comboRules).values(values).returning();
  return created;
}

async function upsertComboRuleGroup(
  seedDb: DbClient,
  values: {
    comboRuleId: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    sortOrder: number;
  },
): Promise<ComboRuleGroup> {
  const existing = await seedDb.query.comboRuleGroups.findFirst({
    where: and(
      eq(comboRuleGroups.comboRuleId, values.comboRuleId),
      eq(comboRuleGroups.name, values.name),
    ),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRuleGroups)
      .set({
        minQuantity: values.minQuantity,
        maxQuantity: values.maxQuantity,
        sortOrder: values.sortOrder,
      })
      .where(eq(comboRuleGroups.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(comboRuleGroups)
    .values(values)
    .returning();
  return created;
}

async function upsertComboRuleGroupItem(
  seedDb: DbClient,
  values: {
    comboRuleGroupId: string;
    menuItemId: string;
    extraPriceCents: number;
  },
): Promise<void> {
  const existing = await seedDb.query.comboRuleGroupItems.findFirst({
    where: and(
      eq(comboRuleGroupItems.comboRuleGroupId, values.comboRuleGroupId),
      eq(comboRuleGroupItems.menuItemId, values.menuItemId),
    ),
  });

  if (existing) {
    await seedDb
      .update(comboRuleGroupItems)
      .set({ extraPriceCents: values.extraPriceCents })
      .where(eq(comboRuleGroupItems.id, existing.id));
    return;
  }

  await seedDb.insert(comboRuleGroupItems).values(values);
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  seedPosData()
    .then(() => {
      console.log('YuTa tenant and POS seed data completed.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
