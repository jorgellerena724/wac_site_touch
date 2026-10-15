import { readFileSync, writeFileSync } from 'node:fs';

const [, , file] = process.argv;

if (!file) {
  console.error('Uso: node scripts/set-build-ts.mjs <archivo-environment>');
  process.exit(1);
}

const buildTs = Math.floor(Date.now() / 1000);
const pattern = /BUILD_TS:\s*\d+/;

let source;
try {
  source = readFileSync(file, 'utf8');
} catch (error) {
  console.error(`No se pudo leer ${file}: ${error.message}`);
  process.exit(1);
}

const matches = source.match(new RegExp(pattern.source, 'g')) ?? [];
if (matches.length !== 1) {
  console.error(
    `Se esperaba exactamente 1 ocurrencia de "BUILD_TS: <número>" en ${file} y se encontraron ${matches.length}. ` +
      'Build detenido para evitar servir un BUILD_TS desactualizado.',
  );
  process.exit(1);
}

writeFileSync(file, source.replace(pattern, `BUILD_TS: ${buildTs}`));
console.log(
  `BUILD_TS actualizado en ${file}: ${buildTs} (${new Date(buildTs * 1000).toISOString()})`,
);
