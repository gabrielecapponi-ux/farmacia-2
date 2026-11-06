import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Project evidence: riferimenti/SCHEMA-2026-11-06-v06.md.
// This is a closed, project-specific coherence check, not a general schema validator.
const pharmacyId = 'https://www.farmaciaparma.it/#farmacia';
export const confirmedServices = [
  {
    id: 'ecg',
    name: 'Elettrocardiogramma',
    description: 'Registra l’attività elettrica del cuore con elettrodi applicati sulla pelle.',
    url: 'https://www.farmaciaparma.it/servizi/138-ecg.html',
  },
  {
    id: 'pelle',
    name: 'Teledermatologia',
    description: 'In farmacia puoi chiedere una valutazione a distanza per un problema della pelle.',
    url: 'https://farmaciaparma.it/servizi/134-teledermatologia.html',
  },
  {
    id: 'pressione',
    name: 'Holter pressorio',
    description: 'Misura la pressione arteriosa a intervalli durante le normali attività quotidiane.',
    url: 'https://www.farmaciaparma.it/servizi/133-holter-pressorio.html',
  },
  {
    id: 'cuore',
    name: 'Holter cardiaco',
    description: 'Registra il ritmo del cuore mentre svolgi le attività di ogni giorno.',
    url: 'https://www.farmaciaparma.it/servizi/132-holter-cardiaco-o-ecg-dinamico.html',
  },
];
export const confirmedSchema = {
  '@context': 'https://schema.org',
  '@type': 'Pharmacy',
  '@id': pharmacyId,
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
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'I servizi in farmacia',
    itemListElement: confirmedServices.map(({ name, description, url }) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name,
        description,
        url,
        provider: { '@id': pharmacyId },
      },
    })),
  },
};

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|quot|lt|gt|nbsp|rsquo|lsquo|ndash|mdash);/gi, (entity, code) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : entity;
    }
    return { amp: '&', apos: "'", quot: '"', lt: '<', gt: '>', nbsp: ' ', rsquo: '’', lsquo: '‘', ndash: '–', mdash: '—' }[code.toLowerCase()];
  });
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map(([, name, , value]) => [name.toLowerCase(), decodeEntities(value)]));
}
const classHas = (tag, name) => attributes(tag).class?.split(/\s+/).includes(name);
function contentText(html) {
  return decodeEntities(html.replace(/<!--[^]*?-->|<(script|style|template)\b[^]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function checkEvidence(actual, expected, location = 'Pharmacy') {
  if (Array.isArray(expected)) {
    assert(Array.isArray(actual), `${location}: lista attesa.`);
    assert.equal(actual.length, expected.length, `${location}: numero di elementi diverso dalle evidenze.`);
    expected.forEach((item, index) => checkEvidence(actual[index], item, `${location}[${index}]`));
    return;
  }
  if (expected && typeof expected === 'object') {
    assert(actual && typeof actual === 'object' && !Array.isArray(actual), `${location}: oggetto atteso.`);
    for (const key of Object.keys(actual)) {
      assert(Object.hasOwn(expected, key), `${location}.${key}: proprietà non prevista dalle evidenze.`);
    }
    for (const [key, value] of Object.entries(expected)) checkEvidence(actual[key], value, `${location}.${key}`);
    return;
  }
  assert.equal(actual, expected, `${location}: dato mancante o diverso da quello confermato.`);
}
function checkWhatsApp(href) {
  const url = new URL(href);
  assert.equal(url.protocol, 'https:', 'WhatsApp deve usare HTTPS.');
  assert.equal(url.hostname, 'wa.me', 'Canale WhatsApp diverso da quello confermato.');
  assert.equal(url.pathname, '/393890089249', 'Numero WhatsApp diverso da quello confermato.');
  return url;
}

export function validateSchema(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, tag]) => attributes(tag).type?.toLowerCase() === 'application/ld+json');
  assert.equal(scripts.length, 1, 'Atteso un solo blocco JSON-LD.');
  const schema = JSON.parse(scripts[0][2]);
  checkEvidence(schema, confirmedSchema);

  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1];
  assert(body, 'Corpo della pagina mancante.');
  const content = contentText(body);
  for (const value of [schema.name, schema.address.streetAddress, schema.address.postalCode,
    schema.address.addressLocality, `(${schema.address.addressRegion})`, schema.foundingDate,
    schema.vatID.slice(2), schema.email]) {
    assert(content.includes(value), `Dato strutturato assente dal contenuto HTML: ${value}`);
  }
  const hrefs = [...body.matchAll(/<a\b([^>]*)>/gi)].map(([, tag]) => attributes(tag).href).filter(Boolean);
  for (const href of [`tel:${schema.telephone}`, `mailto:${schema.email}`, schema.url, 'https://wa.me/393890089249']) {
    assert(hrefs.includes(href), `Collegamento visibile non coerente con le evidenze: ${href}`);
  }
  for (const href of hrefs) {
    if (href.startsWith('tel:')) assert.equal(href, `tel:${schema.telephone}`, 'Telefono in pagina non confermato.');
    if (href.startsWith('mailto:')) assert.equal(href, `mailto:${schema.email}`, 'Email in pagina non confermata.');
    if (/^https?:\/\/wa\.me\//i.test(href)) checkWhatsApp(href);
  }

  const cards = [...body.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article\s*>/gi)]
    .filter(([, tag]) => classHas(tag, 'service-card'));
  assert.equal(cards.length, confirmedServices.length, 'Attese quattro schede dei servizi corrispondenti al catalogo.');
  for (const expected of confirmedServices) {
    const matches = cards.filter(([, tag]) => attributes(tag).id === expected.id);
    assert.equal(matches.length, 1, `${expected.name}: scheda assente o duplicata.`);
    const [, tag, card] = matches[0];
    assert(!/(?:^|\s)hidden(?:\s|=|$)/i.test(tag) && attributes(tag)['aria-hidden'] !== 'true', `${expected.name}: scheda nascosta.`);
    const title = card.match(/<h3\b([^>]*)>([\s\S]*?)<\/h3\s*>/i);
    assert(title && attributes(title[1]).id === `${expected.id}-title`, `${expected.name}: titolo principale assente.`);
    assert.equal(contentText(title[2]), expected.name, `${expected.name}: titolo e catalogo non coincidono.`);
    const descriptions = [...card.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p\s*>/gi)]
      .filter(([, attrs]) => classHas(attrs, 'service-description'));
    assert.equal(descriptions.length, 1, `${expected.name}: descrizione principale assente o duplicata.`);
    assert.equal(contentText(descriptions[0][2]), expected.description, `${expected.name}: descrizione e catalogo non coincidono.`);
    const links = [...card.matchAll(/<a\b([^>]*)>/gi)].map(([, attrs]) => attributes(attrs));
    assert(links.some(link => link.href === expected.url), `${expected.name}: collegamento ufficiale assente.`);
    for (const link of links.filter(link => link.class?.split(/\s+/).some(name => ['service-link', 'service-image'].includes(name)))) {
      assert.equal(link.href, expected.url, `${expected.name}: scheda ufficiale errata.`);
    }
    const messages = links.filter(link => link.class?.split(/\s+/).includes('service-message'));
    assert.equal(messages.length, 1, `${expected.name}: contatto specifico mancante.`);
    assert(checkWhatsApp(messages[0].href).searchParams.get('text')?.includes(expected.name), `${expected.name}: messaggio WhatsApp riferito a un altro servizio.`);
  }

  // These practical answers deliberately contain no opening schedule or booking claim.
  const hours = [...body.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details\s*>/gi)]
    .filter(([, tag, inner]) => classHas(tag, 'faq-item') && contentText(inner.match(/<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/i)?.[1] || '').includes('Quali sono gli orari aggiornati?'));
  assert.equal(hours.length, 1, 'FAQ sugli orari assente o duplicata.');
  assert.equal(contentText(hours[0][2].match(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/i)?.[1] || ''),
    'Contatta direttamente la farmacia per verificare gli orari prima di passare.', 'La FAQ sugli orari deve rinviare alla farmacia, senza orari dedotti.');
  assert(content.includes('questa pagina non conferma prenotazioni') || content.includes('Il prototipo non raccoglie dati e non conferma prenotazioni'), 'Il concept non deve confermare prenotazioni.');
  const robots = [...html.matchAll(/<meta\b([^>]*)>/gi)]
    .map(([, tag]) => attributes(tag)).find(tag => tag.name?.toLowerCase() === 'robots');
  const directives = robots?.content?.toLowerCase().split(/[\s,]+/) || [];
  assert(directives.includes('noindex') && directives.includes('nofollow'), 'Il concept deve restare noindex,nofollow.');
  assert(![...html.matchAll(/<link\b([^>]*)>/gi)].some(([, tag]) =>
    attributes(tag).rel?.toLowerCase().split(/\s+/).includes('canonical')), 'Nessun canonical pubblico è stato approvato per Farmacia 2.');
  return schema;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const target = path.resolve(root, process.argv[2] || 'index.html');
  validateSchema(await readFile(target, 'utf8'));
  console.log(`Farmacia 2: Pharmacy, quattro servizi e contenuti coerenti con le evidenze (${path.relative(root, target)}).`);
}
