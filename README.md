# Farmacia 2 — Ponte Dattaro

Versione 0.5.0: proposta grafica indipendente, visuale e interattiva per Farmacia Ponte Dattaro, Parma.

[Apri il sito](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.5.0)

## La pagina

- Hero desktop integrata: messaggio, indirizzo e storia accanto al film Higgsfield, subito visibile.
- Video guidato dallo scroll nativo, con tre capitoli e pausa; layout compatto sui display bassi e con testo ingrandito.
- Quattro servizi fotografici equivalenti: ECG, teledermatologia, Holter pressorio e Holter cardiaco. Tutte le descrizioni restano presenti; schede ufficiali e contatti WhatsApp specifici nei dettagli nativi.
- Accessi diretti ai servizi da tablet/desktop; apertura essenziale e CTA principale su telefono.
- Galleria touch e tastiera con scorrimento di una scheda, contatore visibile, Home/End e cambi rapidi.
- Domande pratiche su accesso, indirizzo, orari da verificare e contatti; nessun dato clinico o tariffa inventato.

Il film non intercetta lo scroll e non viene riprodotto in loop. Con movimento ridotto, risparmio dati rilevato, errore video o JavaScript disattivato resta il poster. I controlli del film rimangono raggiungibili anche in orizzontale e al200%. I contenuti essenziali non dipendono dalle animazioni.

## Avvio

Richiede Node.js, senza dipendenze da installare.

```sh
npm run dev       # http://127.0.0.1:4421/
npm run build     # verifica JSON-LD e genera dist/
npm run preview   # http://127.0.0.1:4422/
npm run test:schema
```

La build contiene47file, inclusi i formati e le risoluzioni alternativi. Diciotto nuove varianti AVIF pesano519.846byte contro1.041.600byte dei WebP equivalenti (circa−50% sul confronto fra asset). I WebP rimangono come fallback; i file alternativi non vengono scaricati tutti dalla stessa visita. Poster responsive precaricati, immagini secondarie lazy, un solo font locale e nessuna dipendenza frontend.

La geometria dello scroll viene memorizzata e aggiornata quando cambia il layout. Non c’è un ciclo continuo di rendering. Il video desktop pesa598KB, quello mobile236KB.

I sorgenti sono su `main`; GitHub Pages pubblica `gh-pages`. Dopo un aggiornamento occorre caricare la build anche su quel ramo. Il concept resta `noindex,nofollow` e separato dal [sito ufficiale](https://www.farmaciaparma.it/).

## Dati e crediti

[Fonti dei dati e dei servizi](DATA-SOURCES.md). “1966–2026 ·60anni a Parma” si riferisce al2026; la sede attuale risale al1988.

DM Sans è distribuito sotto SIL Open Font License1.1, conservata in `assets/fonts/`. Il piccolo marchio è parte del concept, non un logo ufficiale. Le immagini sono ricostruzioni illustrative IA già disponibili per il progetto; il video è stato generato con Higgsfield Seedance2.5 e ottimizzato per lo scroll. Non sono riprese autentiche della farmacia o del personale. La scena in bianco e nero non è una fotografia d’archivio.

Il prototipo non raccoglie dati e non conferma prenotazioni; i contatti aprono i canali reali. I materiali non costituiscono un pacchetto di asset per altri clienti e questo repository non concede diritti di riutilizzo del concept. Le versioni precedenti rimangono nella cronologia Git.
