import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Registro dei soli dati già confermati: riferimenti/SCHEMA-2026-11-05.md.
// Aggiornare le evidenze prima di cambiare dati o aggiungere proprietà.
// Questo controllo locale non sostituisce Schema.org Validator o il test Google.
const confirmed = {
  '@context': 'https://schema.org',
  '@type': 'Pharmacy',
  '@id': 'https://www.farmaciaparma.it/#farmacia',
  name: 'Farmacia Ponte Dattaro',
  url: 'https://www.farmaciaparma.it/',
  telephone: '+390521964011',
  email: 'pontedattarofarmacia@gmail.com',
  vatID: 'IT02072810340',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Strada Montanara, 23/b',
    postalCode: '43124',
    addressLocality: 'Parma',
    addressRegion: 'PR',
    addressCountry: 'IT',
  },
  foundingDate: '1966',
};

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map(([, name, , value]) => [name.toLowerCase(), value]));
}

function checkEvidence(actual, expected, location = 'Pharmacy') {
  assert(actual && typeof actual === 'object' && !Array.isArray(actual), `${location}: oggetto atteso.`);
  for (const key of Object.keys(actual)) {
    assert(Object.hasOwn(expected, key), `${location}.${key}: proprietà non prevista dalle evidenze.`);
  }
  for (const [key, value] of Object.entries(expected)) {
    if (typeof value === 'object') checkEvidence(actual[key], value, `${location}.${key}`);
    else assert.equal(actual[key], value, `${location}.${key}: dato mancante o diverso da quello confermato.`);
  }
}

export function validateSchema(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, tag]) => attributes(tag).type?.toLowerCase() === 'application/ld+json');
  assert.equal(scripts.length, 1, 'Atteso un solo blocco JSON-LD.');
  const schema = JSON.parse(scripts[0][2]);
  checkEvidence(schema, confirmed);

  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1];
  assert(body, 'Corpo della pagina mancante.');
  const content = body.replace(/<!--[^]*?-->|<script\b[^]*?<\/script\s*>|<style\b[^]*?<\/style\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  for (const value of [schema.name, schema.address.streetAddress, schema.address.postalCode,
    schema.address.addressLocality, `(${schema.address.addressRegion})`, schema.foundingDate,
    schema.vatID.slice(2), schema.email]) {
    assert(content.includes(value), `Dato strutturato assente dal contenuto HTML: ${value}`);
  }
  const hrefs = [...body.matchAll(/<a\b([^>]*)>/gi)].map(([, tag]) => attributes(tag).href);
  for (const href of [`tel:${schema.telephone}`, `mailto:${schema.email}`, schema.url]) {
    assert(hrefs.includes(href), `Collegamento visibile non coerente con il JSON-LD: ${href}`);
  }
  const robots = [...html.matchAll(/<meta\b([^>]*)>/gi)]
    .map(([, tag]) => attributes(tag)).find((tag) => tag.name?.toLowerCase() === 'robots');
  const directives = robots?.content?.toLowerCase().split(/[\s,]+/) || [];
  assert(directives.includes('noindex') && directives.includes('nofollow'), 'Il concept locale deve restare noindex,nofollow.');
  assert(![...html.matchAll(/<link\b([^>]*)>/gi)].some(([, tag]) =>
    attributes(tag).rel?.toLowerCase().split(/\s+/).includes('canonical')), 'Nessun canonical pubblico è stato approvato per Farmacia 2.');
  return schema;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const target = path.resolve(root, process.argv[2] || 'index.html');
  validateSchema(await readFile(target, 'utf8'));
  console.log(`Farmacia 2: JSON-LD coerente con le evidenze e il contenuto HTML (${path.relative(root, target)}).`);
}
