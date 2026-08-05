import { existsSync, readFileSync } from 'node:fs';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];

const read = (relativePath) =>
  readFileSync(join(repositoryRoot, relativePath), 'utf8');

const addFailure = (rule, file, detail) => {
  failures.push({ rule, file, detail });
};

// This list mirrors the active, non-template documentation indexed by
// docs/README.md. ADRs and templates have their own metadata conventions.
const currentDocuments = [
  'docs/README.md',
  'docs/CURRENT_STATE.md',
  'docs/REPOSITORY_MAP.md',
  'docs/DEVELOPMENT_WORKFLOW.md',
  'docs/DOCUMENTATION_POLICY.md',
  'docs/architecture/OVERVIEW.md',
  'docs/architecture/DATABASE_BOUNDARIES.md',
  'docs/architecture/TENANCY.md',
  'docs/architecture/AUTHENTICATION.md',
  'docs/architecture/IDENTITY_AND_MEMBERSHIP.md',
  'docs/architecture/DATA_MODEL.md',
  'docs/features/public-website/README.md',
  'docs/features/public-booking/README.md',
  'docs/features/public-booking/PRODUCT_SPEC.md',
  'docs/features/public-booking/STATUS.md',
  'docs/features/reputation/README.md',
  'docs/features/reputation/STATUS.md',
  'docs/products/pos/README.md',
  'docs/products/pos/USER_GUIDE.md',
  'docs/products/pos/OFFLINE_STRATEGY.md',
  'docs/products/pos/QA_CHECKLIST.md',
  'docs/products/pos/PRODUCT_SPEC.md',
  'docs/operations/LOCAL_DEVELOPMENT.md',
  'docs/operations/DEPLOYMENT.md',
];

const requiredMetadata = [
  /^Status:\s*\S+/m,
  /^Visibility:\s*\S+/m,
  /^Owner:\s*\S+/m,
  /^Last updated:\s*\d{4}-\d{2}-\d{2}/m,
];

for (const file of currentDocuments) {
  const absolutePath = join(repositoryRoot, file);
  if (!existsSync(absolutePath)) {
    addFailure(
      'missing-current-document',
      file,
      'current document does not exist',
    );
    continue;
  }

  const content = read(file);
  for (const pattern of requiredMetadata) {
    if (!pattern.test(content)) {
      addFailure(
        'document-metadata',
        file,
        `missing metadata matching ${pattern}`,
      );
    }
  }
}

const documentationIndexPath = 'docs/README.md';
if (existsSync(join(repositoryRoot, documentationIndexPath))) {
  const documentationIndex = read(documentationIndexPath);
  for (const file of currentDocuments) {
    if (file === documentationIndexPath) continue;

    const indexTarget = file.replace(/^docs\//, '');
    if (!documentationIndex.includes(`](${indexTarget})`)) {
      addFailure(
        'current-document-not-indexed',
        file,
        `docs/README.md must link to ${indexTarget}`,
      );
    }
  }
}

const bookingSpecPath = 'docs/features/public-booking/PRODUCT_SPEC.md';
if (existsSync(join(repositoryRoot, bookingSpecPath))) {
  const bookingSpec = read(bookingSpecPath);
  const obsoletePathPatterns = [
    {
      pattern: /apps\/app(?![a-z0-9_-])/i,
      detail: 'use apps/backoffice for restaurant administration',
    },
    {
      pattern: /apps\/admin(?![a-z0-9_-])/i,
      detail:
        'use apps/platform-admin only for future platform-wide administration',
    },
    {
      pattern: /packages\/db(?!-[a-z0-9_-])/i,
      detail: 'use packages/db-cloud for cloud persistence',
    },
    {
      pattern: /packages\/(?:notifications|observability)(?![a-z0-9_-])/i,
      detail: 'do not present an unapproved shared package as current',
    },
  ];

  for (const { pattern, detail } of obsoletePathPatterns) {
    if (pattern.test(bookingSpec)) {
      addFailure('booking-current-architecture', bookingSpecPath, detail);
    }
  }

  const obsoleteTreeEntries = {
    apps: new Map([
      ['app/', 'use backoffice/ for restaurant administration'],
      ['admin/', 'use platform-admin/ for future platform administration'],
    ]),
    packages: new Map([
      ['db/', 'use db-cloud/ for cloud persistence'],
      ['notifications/', 'notifications is not an approved shared package'],
      ['observability/', 'observability is not an approved shared package'],
    ]),
  };

  let inFence = false;
  let treeRoot;

  for (const line of bookingSpec.split(/\r?\n/u)) {
    if (/^\s*```/u.test(line)) {
      inFence = !inFence;
      treeRoot = undefined;
      continue;
    }
    if (!inFence) continue;

    const entry = line
      .replace(/^[\s│├└─]+/u, '')
      .split(/\s+#/u)[0]
      .trim();

    if (entry === 'apps/') {
      treeRoot = 'apps';
      continue;
    }
    if (entry === 'packages/') {
      treeRoot = 'packages';
      continue;
    }
    if (!treeRoot || entry === '') continue;

    const detail = obsoleteTreeEntries[treeRoot].get(entry);
    if (detail) {
      addFailure(
        'booking-current-architecture-tree',
        bookingSpecPath,
        `${treeRoot}/${entry}: ${detail}`,
      );
    }
  }
}

const removedTask = 'docs/tasks/PUBLIC_BOOKING_PHASE_0_1.md';
if (existsSync(join(repositoryRoot, removedTask))) {
  addFailure(
    'completed-task-returned',
    removedTask,
    'completed Phase 0/1 execution history must not be an active document',
  );
}

const agentPath = 'AGENTS.md';
const agents = read(agentPath);
if (/\byuta-(?:staff|crm)\b/i.test(agents)) {
  addFailure(
    'speculative-global-rule',
    agentPath,
    'unapproved future application names do not belong in global instructions',
  );
}

for (const file of ['AGENTS.md', '.github/copilot-instructions.md']) {
  if (!existsSync(join(repositoryRoot, file))) continue;
  const content = read(file);
  if (
    /Available\s+(?:public\s+)?components/i.test(content) ||
    /Available\s+@yuta\/ui/i.test(content)
  ) {
    addFailure(
      'duplicated-ui-catalog',
      file,
      'packages/ui/src/index.ts is the only authoritative export catalog',
    );
  }
}

const markdownLinkPattern = /\[[^\]]*]\(([^)]+)\)/g;

for (const file of currentDocuments) {
  const absolutePath = join(repositoryRoot, file);
  if (!existsSync(absolutePath)) continue;

  const content = read(file);
  let match;
  while ((match = markdownLinkPattern.exec(content)) !== null) {
    let target = match[1].trim();

    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1).trim();
    }

    if (
      target === '' ||
      target.startsWith('#') ||
      /^(?:https?:|mailto:)/i.test(target)
    ) {
      continue;
    }

    const withoutAnchor = target.split('#')[0].split('?')[0];
    if (withoutAnchor === '') continue;

    let decodedTarget;
    try {
      decodedTarget = decodeURIComponent(withoutAnchor);
    } catch {
      addFailure(
        'invalid-markdown-link',
        file,
        `cannot decode target: ${target}`,
      );
      continue;
    }

    const resolved = resolve(repositoryRoot, dirname(file), decodedTarget);
    const repositoryRelative = relative(repositoryRoot, resolved);

    if (
      repositoryRelative.startsWith('..') ||
      isAbsolute(repositoryRelative) ||
      extname(resolved).toLowerCase() !== '.md'
    ) {
      continue;
    }

    if (!existsSync(resolved)) {
      addFailure(
        'broken-markdown-link',
        file,
        `missing Markdown target: ${target}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation consistency check failed:\n');

  for (const failure of failures) {
    console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
  }

  process.exit(1);
}

console.log(
  `Documentation consistency check passed (${currentDocuments.length} current documents).`,
);
