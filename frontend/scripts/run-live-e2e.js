const { spawnSync } = require('node:child_process');

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', 'tests/e2e/shop-live-api.spec.ts'],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PLAYWRIGHT_LIVE_API: 'true',
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
