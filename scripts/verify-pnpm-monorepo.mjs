import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const requiredFiles = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'apps/web/src/app/AppProviders.tsx',
  'apps/web/src/router/index.tsx',
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(root, file)));

if (missing.length > 0) {
  throw new Error(`Missing pnpm monorepo files: ${missing.join(', ')}`);
}

const apiDockerfile = readFileSync(resolve(root, 'apps/api/Dockerfile'), 'utf8');
const apiPackageJson = readFileSync(resolve(root, 'apps/api/package.json'), 'utf8');

if (!apiDockerfile.includes('pnpm --filter @promptmarket/api deploy --prod /app')) {
  throw new Error('API Dockerfile must deploy @promptmarket/api into an isolated pnpm production runtime');
}

if (apiDockerfile.includes('COPY --from=build /repo/node_modules ./node_modules')) {
  throw new Error('API Dockerfile must not copy root node_modules into /app for pnpm runtime resolution');
}

if (!apiDockerfile.includes('CMD ["node", "dist/src/main.js"]')) {
  throw new Error('API Dockerfile must start the emitted Nest entrypoint at dist/src/main.js');
}

if (!apiPackageJson.includes('"start:prod": "node dist/src/main.js"')) {
  throw new Error('API start:prod must point at the emitted Nest entrypoint');
}

console.log('pnpm monorepo structure verified');
