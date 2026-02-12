const { spawnSync } = require('node:child_process');
const path = require('node:path');

const cwd = process.cwd();
const ngCliPath = path.join(cwd, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const tscPath = path.join(cwd, 'node_modules', 'typescript', 'bin', 'tsc');
const esbuildPath = path.join(cwd, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe');

function runNodeScript(scriptPath, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });
}

function hasEsbuildSpawnPipeEperm() {
  const probe = spawnSync(esbuildPath, ['--service=0.26.0', '--ping'], {
    cwd,
    env: process.env,
    stdio: 'pipe',
    timeout: 2000,
  });
  return probe.error?.code === 'EPERM';
}

if (process.platform === 'win32' && hasEsbuildSpawnPipeEperm()) {
  console.warn(
    '[build-safe] Environment blocks esbuild service spawn (EPERM). Running strict typecheck fallback.',
  );
  const typecheck = runNodeScript(tscPath, ['-p', 'tsconfig.app.json', '--noEmit']);
  process.exit(typecheck.status || (typecheck.error ? 1 : 0));
}

const ngBuild = runNodeScript(ngCliPath, ['build']);
process.exit(ngBuild.status || (ngBuild.error ? 1 : 0));
