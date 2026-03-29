import { spawn } from 'node:child_process';

function run(command, args, { env = process.env, timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
      shell: process.platform === 'win32',
    });

    let timeout;
    if (timeoutMs) {
      timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}`));
      }, timeoutMs);
    }

    child.on('exit', (code) => {
      if (timeout) clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      reject(error);
    });
  });
}


function validateDbEnv({ shouldRunMigrations }) {
  const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
  const directUrl = (process.env.DIRECT_URL ?? '').trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for build/runtime.');
  }

  if (shouldRunMigrations) {
    if (!directUrl) {
      throw new Error('DIRECT_URL is required when RUN_PRISMA_MIGRATIONS=true.');
    }

    if (directUrl === databaseUrl) {
      console.warn('[vercel-build] WARNING: DIRECT_URL equals DATABASE_URL. This often breaks migrations on pooled connections.');
    }
  }
}

async function runMigrationsIfEnabled() {
  const runMigrationsEnv = (process.env.RUN_PRISMA_MIGRATIONS ?? '').trim().toLowerCase();
  const shouldRunMigrations = runMigrationsEnv === 'true';
  if (!shouldRunMigrations) {
    console.log('[vercel-build] Skipping prisma migrate deploy during build.');
    console.log('[vercel-build] Set RUN_PRISMA_MIGRATIONS=true to enable migrations.');
    return;
  }

  const timeoutMs = Number(process.env.PRISMA_MIGRATE_TIMEOUT_MS || 60000);
  const required = (process.env.PRISMA_MIGRATIONS_REQUIRED ?? '').trim().toLowerCase() === 'true';

  console.log(`[vercel-build] Running prisma migrate deploy (timeout: ${timeoutMs}ms)...`);
  try {
    await run('npx', ['prisma', 'migrate', 'deploy'], { timeoutMs });
  } catch (error) {
    if (required) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[vercel-build] WARNING: prisma migrate deploy failed, continuing build. Reason: ${message}`);
    console.warn('[vercel-build] Set PRISMA_MIGRATIONS_REQUIRED=true to fail build on migration errors.');
  }
}

async function main() {
  console.log('[vercel-build] Generating Prisma client...');
  await run('npx', ['prisma', 'generate']);

  const runMigrationsEnv = (process.env.RUN_PRISMA_MIGRATIONS ?? '').trim().toLowerCase();
  const shouldRunMigrations = runMigrationsEnv === 'true';
  validateDbEnv({ shouldRunMigrations });

  await runMigrationsIfEnabled();

  console.log('[vercel-build] Building web app...');
  await run('npm', ['run', 'build']);
}

main().catch((error) => {
  console.error('[vercel-build] Build failed:', error.message);
  process.exit(1);
});
