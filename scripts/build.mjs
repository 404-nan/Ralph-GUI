import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const rootDir = process.cwd();
const srcDir = resolve(rootDir, 'src');
const distDir = resolve(rootDir, 'dist');
const uiDir = resolve(rootDir, 'ui');
const panelUiDir = resolve(distDir, 'panel-ui');

function assertSupportedNodeVersion() {
  const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  if (Number.isNaN(major) || major < 22) {
    throw new Error(`Node.js 22+ is required to build Ralph. Detected ${process.versions.node}.`);
  }
}

async function collectTsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTsFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && extname(entry.name) === '.ts' && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function rewriteImportSpecifiers(source) {
  return source.replace(
    /((?:from|import)\s+['"])(\.[^'"]+)\.ts(['"])/g,
    (_, prefix, specifier, suffix) => `${prefix}${specifier}.js${suffix}`,
  );
}

function runNpm(commandArgs, cwd, failureMessage) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', commandArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(failureMessage);
  }
}

async function ensureUiToolchain() {
  const tscBin = resolve(
    uiDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
  );

  try {
    await access(tscBin);
    return;
  } catch {}

  const lockfile = resolve(uiDir, 'package-lock.json');
  const installCommandArgs = (await readFile(lockfile, 'utf8').catch(() => null))
    ? ['ci']
    : ['install'];

  runNpm(installCommandArgs, uiDir, 'Failed to install panel UI dependencies. Run `npm install --prefix ui` and try again.');
}

async function build() {
  assertSupportedNodeVersion();
  await mkdir(distDir, { recursive: true });

  const files = await collectTsFiles(srcDir);

  for (const filePath of files) {
    const relativePath = relative(srcDir, filePath);
    const outputPath = resolve(distDir, relativePath.replace(/\.ts$/, '.js'));
    const input = await readFile(filePath, 'utf8');
    const output = rewriteImportSpecifiers(
      stripTypeScriptTypes(input, {
        mode: 'transform',
        sourceUrl: filePath,
      }),
    );

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output, 'utf8');
  }

  const uiPackageJson = resolve(uiDir, 'package.json');
  if (await readFile(uiPackageJson, 'utf8').catch(() => null)) {
    await ensureUiToolchain();
    runNpm(['run', 'build'], uiDir, 'Failed to build the panel UI.');
    const builtUiDir = resolve(uiDir, 'dist');
    await rm(panelUiDir, { recursive: true, force: true });
    await cp(builtUiDir, panelUiDir, { recursive: true });
  }
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
