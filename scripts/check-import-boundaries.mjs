import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];

const skippedDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'drizzle',
  'node_modules',
]);

const sourceExtensions = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);

const configurationExtensions = new Set([
  ...sourceExtensions,
  '.json',
  '.yaml',
  '.yml',
]);

const dependencySections = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

function toRepositoryPath(filePath) {
  return relative(repositoryRoot, filePath).split(sep).join('/');
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function addFailure(rule, filePath, detail, index = null) {
  const location =
    index === null
      ? toRepositoryPath(filePath)
      : `${toRepositoryPath(filePath)}:${getLineNumber(
          readFileSync(filePath, 'utf8'),
          index,
        )}`;

  failures.push({ rule, location, detail });
}

function walkFiles(startPath) {
  if (!existsSync(startPath)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(startPath, { withFileTypes: true })) {
    const entryPath = join(startPath, entry.name);

    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        files.push(...walkFiles(entryPath));
      }
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function isSourceFile(filePath) {
  return sourceExtensions.has(extname(filePath));
}

function isConfigurationFile(filePath) {
  const fileName = basename(filePath);

  if (fileName === 'Dockerfile' || fileName.startsWith('Dockerfile.')) {
    return true;
  }

  if (fileName.startsWith('.env')) {
    return fileName.endsWith('.example');
  }

  return configurationExtensions.has(extname(filePath));
}

function read(filePath) {
  return readFileSync(filePath, 'utf8');
}

function findModuleSpecifiers(content) {
  const matches = [];
  const modulePattern =
    /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g;
  let match;

  while ((match = modulePattern.exec(content)) !== null) {
    matches.push({ moduleName: match[1], index: match.index });
  }

  return matches;
}

function matchesModule(moduleName, forbiddenModule) {
  return (
    moduleName === forbiddenModule ||
    moduleName.startsWith(`${forbiddenModule}/`)
  );
}

function checkPackageDependencies() {
  const workspacePackageFiles = [
    ...walkFiles(join(repositoryRoot, 'apps')),
    ...walkFiles(join(repositoryRoot, 'packages')),
  ].filter((filePath) => basename(filePath) === 'package.json');

  for (const filePath of workspacePackageFiles) {
    const packageJson = JSON.parse(read(filePath));

    for (const section of dependencySections) {
      if (packageJson[section]?.['@yuta/db']) {
        addFailure(
          'legacy-package',
          filePath,
          `${section} must not depend on @yuta/db`,
        );
      }
    }
  }

  const legacyManifest = join(repositoryRoot, 'packages', 'db', 'package.json');
  if (existsSync(legacyManifest)) {
    addFailure(
      'legacy-package',
      legacyManifest,
      'the legacy @yuta/db package must remain deleted',
    );
  }
}

function checkLegacyImports() {
  const files = [
    ...walkFiles(join(repositoryRoot, 'apps')),
    ...walkFiles(join(repositoryRoot, 'packages')),
  ].filter(isSourceFile);

  for (const filePath of files) {
    const content = read(filePath);

    for (const { moduleName, index } of findModuleSpecifiers(content)) {
      if (matchesModule(moduleName, '@yuta/db')) {
        addFailure(
          'legacy-import',
          filePath,
          `legacy import "${moduleName}" is forbidden`,
          index,
        );
      }
    }
  }
}

function checkGenericDatabaseUrl() {
  const rootConfigurationFiles = readdirSync(repositoryRoot, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) => join(repositoryRoot, entry.name));

  const files = [
    ...rootConfigurationFiles,
    ...walkFiles(join(repositoryRoot, 'apps')),
    ...walkFiles(join(repositoryRoot, 'packages')),
  ].filter(isConfigurationFile);

  for (const filePath of files) {
    const content = read(filePath);
    const pattern = /(?<![A-Z_])DATABASE_URL\b/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      addFailure(
        'explicit-database-url',
        filePath,
        'use CLOUD_DATABASE_URL, POS_DATABASE_URL, or DISPLAY_DATABASE_URL',
        match.index,
      );
    }
  }
}

const boundaryRules = [
  {
    name: 'pure-shared-package',
    roots: ['packages/core', 'packages/contracts'],
    forbiddenModules: [
      '@yuta/db-cloud',
      '@yuta/db-pos',
      'drizzle-orm',
      'postgres',
    ],
    forbiddenTokens: [
      'CLOUD_DATABASE_URL',
      'POS_DATABASE_URL',
      'DISPLAY_DATABASE_URL',
    ],
  },
  {
    name: 'pos-client',
    roots: ['apps/yuta-pos/src'],
    forbiddenModules: [
      '@yuta/auth',
      '@yuta/db-cloud',
      '@yuta/db-pos',
      '@yuta/tenant',
      'drizzle-orm',
      'postgres',
    ],
    forbiddenTokens: [
      'CLOUD_DATABASE_URL',
      'POS_DATABASE_URL',
      'DISPLAY_DATABASE_URL',
    ],
  },
  {
    name: 'site-agent-local-only',
    roots: ['apps/site-agent'],
    forbiddenModules: ['@yuta/auth', '@yuta/db-cloud', '@yuta/tenant'],
    forbiddenTokens: ['CLOUD_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  },
  {
    name: 'display-local-only',
    roots: ['apps/yuta-display'],
    forbiddenModules: [
      '@yuta/auth',
      '@yuta/db-cloud',
      '@yuta/db-pos',
      '@yuta/tenant',
    ],
    forbiddenTokens: ['CLOUD_DATABASE_URL', 'POS_DATABASE_URL'],
  },
  {
    name: 'admin-cloud-only',
    roots: ['apps/admin'],
    forbiddenModules: ['@yuta/db-pos', '@yuta/local-runtime'],
    forbiddenTokens: ['POS_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  },
  {
    name: 'web-cloud-only',
    roots: ['apps/web'],
    forbiddenModules: ['@yuta/db-pos', '@yuta/local-runtime'],
    forbiddenTokens: ['POS_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  },
  {
    name: 'cloud-database-package',
    roots: ['packages/db-cloud'],
    forbiddenModules: ['@yuta/db-pos'],
    forbiddenTokens: ['POS_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  },
  {
    name: 'pos-database-package',
    roots: ['packages/db-pos'],
    forbiddenModules: ['@yuta/auth', '@yuta/db-cloud', '@yuta/tenant'],
    forbiddenTokens: ['CLOUD_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  },
];

function checkBoundaryRules() {
  for (const rule of boundaryRules) {
    for (const root of rule.roots) {
      const files = walkFiles(join(repositoryRoot, root)).filter(
        isConfigurationFile,
      );

      for (const filePath of files) {
        const content = read(filePath);

        if (isSourceFile(filePath)) {
          for (const { moduleName, index } of findModuleSpecifiers(content)) {
            const forbiddenModule = rule.forbiddenModules.find((candidate) =>
              matchesModule(moduleName, candidate),
            );

            if (forbiddenModule) {
              addFailure(
                rule.name,
                filePath,
                `import "${moduleName}" crosses the runtime boundary`,
                index,
              );
            }
          }
        }

        for (const token of rule.forbiddenTokens) {
          const index = content.indexOf(token);
          if (index !== -1) {
            addFailure(
              rule.name,
              filePath,
              `${token} is not available in this runtime boundary`,
              index,
            );
          }
        }
      }
    }
  }
}

function checkClientModules() {
  const clientRoots = [
    'apps/admin/src',
    'apps/web/src',
    'apps/yuta-display/src',
    'apps/yuta-pos/src',
  ];
  const forbiddenModules = [
    '@yuta/db-cloud',
    '@yuta/db-pos',
    'drizzle-orm',
    'postgres',
  ];
  const forbiddenTokens = [
    'CLOUD_DATABASE_URL',
    'POS_DATABASE_URL',
    'DISPLAY_DATABASE_URL',
  ];
  const clientDirective =
    /^\s*(?:(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*(['"])use client\1\s*;/;

  for (const root of clientRoots) {
    for (const filePath of walkFiles(join(repositoryRoot, root)).filter(
      isSourceFile,
    )) {
      const content = read(filePath);
      if (!clientDirective.test(content)) {
        continue;
      }

      for (const { moduleName, index } of findModuleSpecifiers(content)) {
        if (
          forbiddenModules.some((candidate) =>
            matchesModule(moduleName, candidate),
          )
        ) {
          addFailure(
            'client-database-access',
            filePath,
            `client module imports server database dependency "${moduleName}"`,
            index,
          );
        }
      }

      for (const token of forbiddenTokens) {
        const index = content.indexOf(token);
        if (index !== -1) {
          addFailure(
            'client-database-access',
            filePath,
            `client module references server-only ${token}`,
            index,
          );
        }
      }
    }
  }
}

const migrationBoundaries = [
  {
    name: 'cloud',
    directory: 'packages/db-cloud/drizzle',
    expectedTables: 17,
    forbiddenTables: [
      'local_users',
      'menu_items',
      'orders',
      'order_items',
      'payments',
      'print_jobs',
    ],
  },
  {
    name: 'pos',
    directory: 'packages/db-pos/drizzle',
    expectedTables: 16,
    forbiddenTables: [
      'auth_sessions',
      'establishments',
      'feedback_items',
      'organizations',
      'reputation_connectors',
      'tenant_memberships',
    ],
  },
  {
    name: 'display',
    directory: 'apps/yuta-display/drizzle',
    expectedTables: 1,
    requiredTables: ['display_media'],
    forbiddenTables: [],
  },
];

function checkMigrationBaselines() {
  for (const boundary of migrationBoundaries) {
    const directory = join(repositoryRoot, boundary.directory);
    const sqlFiles = walkFiles(directory).filter(
      (filePath) => extname(filePath) === '.sql',
    );

    if (
      sqlFiles.length !== 1 ||
      basename(sqlFiles[0] ?? '') !== '0000_initial.sql'
    ) {
      addFailure(
        'migration-baseline',
        directory,
        `${boundary.name} must contain exactly one 0000_initial.sql baseline`,
      );
      continue;
    }

    const filePath = sqlFiles[0];
    const content = read(filePath);
    const tables = new Set(
      [...content.matchAll(/CREATE TABLE\s+"([^"]+)"/g)].map(
        (match) => match[1],
      ),
    );

    if (tables.size !== boundary.expectedTables) {
      addFailure(
        'migration-baseline',
        filePath,
        `${boundary.name} baseline creates ${tables.size} tables; expected ${boundary.expectedTables}`,
      );
    }

    for (const table of boundary.requiredTables ?? []) {
      if (!tables.has(table)) {
        addFailure(
          'migration-baseline',
          filePath,
          `${boundary.name} baseline must create "${table}"`,
        );
      }
    }

    for (const table of boundary.forbiddenTables) {
      if (tables.has(table)) {
        addFailure(
          'migration-boundary',
          filePath,
          `${boundary.name} baseline must not create "${table}"`,
        );
      }
    }

    const randomUuid = /\b(?:gen_random_uuid|uuid_generate_v\d)\s*\(/i.exec(
      content,
    );
    if (randomUuid) {
      addFailure(
        'application-generated-uuidv7',
        filePath,
        'business IDs must not use a database-generated UUID default',
        randomUuid.index,
      );
    }
  }
}

checkPackageDependencies();
checkLegacyImports();
checkGenericDatabaseUrl();
checkBoundaryRules();
checkClientModules();
checkMigrationBaselines();

if (failures.length > 0) {
  console.error(
    `Architecture check failed with ${failures.length} violation${
      failures.length === 1 ? '' : 's'
    }:\n`,
  );

  for (const failure of failures) {
    console.error(`- [${failure.rule}] ${failure.location}: ${failure.detail}`);
  }

  process.exitCode = 1;
} else {
  console.log(
    'Architecture check passed: runtime imports, database URLs, client boundaries, and migration baselines are valid.',
  );
}
