const fs = require('node:fs');
const path = require('node:path');
const { readdir, rm } = require('node:fs/promises');
const { build } = require('esbuild');
const esbuildPluginTsc = require('esbuild-plugin-tsc');
const { typecheckPlugin } = require('@jgoz/esbuild-plugin-typecheck');

const { extname } = path;

const clean = (pathtoClean) => ({
  name: 'clean',
  setup({ onStart }) {
    onStart(async () => {
      try {
        const isDirectory = fs.lstatSync(pathtoClean).isDirectory();
        if (!isDirectory) {
          pathtoClean = path.dirname(pathtoClean);
        }
        await rm(pathtoClean, { recursive: true });
      } catch {}
    });
  },
});

async function buildNode({ excludeFileExtensions, ...options }, source) {
  const toDelete = options.outdir ?? options.outfile;
  const excludeFileExtensionsArr = ['.md', ...(excludeFileExtensions ?? [])];

  await build({
    entryPoints: await excludeSpecFiles(source, excludeFileExtensionsArr),
    write: true,
    platform: 'node',
    outExtension: { '.js': '.cjs' },
    bundle: true,
    minify: false,
    legalComments: 'none',
    keepNames: true,
    treeShaking: true,
    tsconfig: 'tsconfig.json',
    plugins: [
      clean(toDelete),
      esbuildPluginTsc({ force: true }),
      typecheckPlugin({ omitStartLog: true }),
    ],
    ...options,
  });
}

async function excludeSpecFiles(sourcePath, excludeFileExtensions) {
  const sourceFiles = await readdir(sourcePath, {
    recursive: true,
    withFileTypes: false,
  });
  return sourceFiles
    .filter(
      (f) =>
        !f.toLowerCase().includes('spec') &&
        !excludeFileExtensions.includes(extname(f)) &&
        extname(f),
    )
    .map((f) => path.join(sourcePath, f));
}

const distPath = path.resolve('./dist');
const sourcePath = path.resolve('./src');

module.exports = buildNode(
  {
    logLevel: 'silent',
    outdir: distPath,
    tsconfig: './tsconfig.json',
    format: 'cjs',
    drop: ['debugger'],
    outExtension: { '.js': '.cjs' },
    excludeFileExtensions: ['.MD', '.key', '.pem'],
  },
  sourcePath,
);
