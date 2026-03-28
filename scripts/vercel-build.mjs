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

async function main() {
  console.log('[vercel-build] Generating Prisma client...');
  await run('npx', ['prisma', 'generate']);

  const shouldRunMigrations = process.env.RUN_PRISMA_MIGRATIONS === 'true';
  if (shouldRunMigrations) {
    const timeoutMs = Number(process.env.PRISMA_MIGRATE_TIMEOUT_MS || 60000);
    console.log(`[vercel-build] Running prisma migrate deploy (timeout: ${timeoutMs}ms)...`);
    await run('npx', ['prisma', 'migrate', 'deploy'], { timeoutMs });
  } else {
    console.log('[vercel-build] Skipping prisma migrate deploy during build.');
    console.log('[vercel-build] Set RUN_PRISMA_MIGRATIONS=true to enable migrations.');
  }

  console.log('[vercel-build] Building web app...');
  await run('npm', ['run', 'build']);
}

main().catch((error) => {
  console.error('[vercel-build] Build failed:', error.message);
  process.exit(1);
});
