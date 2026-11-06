# Farmacia 2 — Ponte Dattaro

Versione 0.4.0: proposta grafica indipendente, visuale e interattiva per Farmacia Ponte Dattaro, Parma.

[Apri il sito](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.4.0)

## La pagina

- Hero tipografica con quartiere, destinatari, indirizzo e storia subito visibili.
- Video Higgsfield che segue lo scroll nativo, con tre capitoli e pausa manuale.
- Quattro servizi fotografici equivalenti: ECG, teledermatologia, Holter pressorio e Holter cardiaco. Tutte le descrizioni sono sempre presenti; contatti e schede ufficiali nei dettagli nativi.
- Nove immagini di contenuto, più poster; galleria touch e tastiera, storia e contatti fotografici.
- Versioni responsive, caricamento progressivo, un solo font locale e nessuna dipendenza frontend.

Il film non intercetta lo scorrimento e non viene riprodotto in loop. Con movimento ridotto, risparmio dati rilevato, errore video o JavaScript disattivato rimane il poster. I contenuti e i contatti restano utilizzabili.

## Avvio

Richiede Node.js, senza dipendenze da installare.

```sh
npm run dev       # http://127.0.0.1:4421/
npm run build     # verifica JSON-LD e genera dist/
npm run preview   # http://127.0.0.1:4422/
npm run test:schema
```

La build copia 29 file, circa 2,07 MB complessivi inclusi risoluzioni/formati alternativi. Il video desktop pesa 598 KB, quello mobile 236 KB. Questi pesi non equivalgono al trasferimento di ogni visita: immagini e video hanno versioni dedicate e caricamento progressivo.

I sorgenti sono su `main`; GitHub Pages pubblica il ramo `gh-pages`. Dopo un aggiornamento occorre caricare la build anche su quel ramo. Il concept resta `noindex,nofollow` e separato dal [sito ufficiale](https://www.farmaciaparma.it/).

## Dati e crediti

[Fonti dei dati e dei servizi](DATA-SOURCES.md). Il sessantesimo “1966–2026 · 60 anni a Parma” si riferisce al 2026; la sede attuale risale al 1988.

DM Sans è distribuito sotto SIL Open Font License 1.1, conservata in `assets/fonts/`. Il piccolo marchio è parte del concept, non un logo ufficiale. Le immagini sono ricostruzioni illustrative IA già disponibili per il progetto; il video è stato generato con Higgsfield Seedance 2.5 e ottimizzato per lo scroll. Non sono riprese autentiche della farmacia o del personale. La scena in bianco e nero non è una foto d’archivio.

Il prototipo non raccoglie dati e non conferma prenotazioni; i contatti aprono i canali reali. I materiali non costituiscono un pacchetto di asset per altri clienti e questo repository non concede diritti di riutilizzo del concept. Le versioni precedenti rimangono nella cronologia Git.
