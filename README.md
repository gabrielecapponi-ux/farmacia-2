# Farmacia 2 — Ponte Dattaro

Versione 0.3.0: proposta grafica indipendente, moderna e leggera per Farmacia Ponte Dattaro, Parma.

[Apri l’anteprima](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.3.0)

## La pagina

- Hero tipografica statica: quartiere Montanara, destinatari, indirizzo e fondazione subito visibili.
- Quattro servizi con identica struttura e gerarchia: ECG, teledermatologia, Holter pressorio e Holter cardiaco.
- Tutte le descrizioni e i collegamenti alle schede ufficiali sono visibili senza selettori.
- Storia, consigli e contatti chiari; barra Chiama/WhatsApp sui dispositivi piccoli.
- Nessun video, nessun carosello, nessuna dipendenza frontend. Animazioni brevi solo nelle sezioni secondarie, con rispetto del movimento ridotto.

La dicitura “1966–2026 · 60 anni a Parma” si riferisce all’anno 2026. La sede in Strada Montanara risale al 1988.

## Avvio

Richiede Node.js, senza dipendenze da installare.

```sh
npm run dev       # http://127.0.0.1:4421/
npm run build     # verifica JSON-LD e genera dist/
npm run preview   # http://127.0.0.1:4422/
npm run test:schema
```

La build copia solo nove file: HTML, CSS, JavaScript, robots.txt, marchio del concept, font DM Sans con licenza e immagine secondaria in AVIF/WebP. Circa166 KB complessivi, inclusi entrambi i formati immagine. Nei test locali il primo caricamento ha trasferito circa108 KB; le misure localhost non equivalgono a prestazioni su rete mobile reale.

I sorgenti sono su `main`; GitHub Pages pubblica il ramo `gh-pages`. Dopo un aggiornamento occorre caricare la build anche su quel ramo. La proposta resta `noindex,nofollow` e separata dal [sito ufficiale della farmacia](https://www.farmaciaparma.it/).

## Dati e crediti

[Fonti dei dati e dei servizi](DATA-SOURCES.md). Il JSON-LD contiene solo dati confermati, senza orari dedotti, prezzi o recensioni.

DM Sans è distribuito sotto SIL Open Font License1.1, conservata in `assets/fonts/`. Il piccolo marchio è parte del concept, non un logo ufficiale. L’unica immagine è una ricostruzione illustrativa IA già disponibile per il progetto: non è una fotografia autentica della farmacia. Il prototipo non raccoglie dati e non conferma prenotazioni; i contatti aprono i canali reali.

I materiali non costituiscono un pacchetto di asset per altri clienti e questo repository non concede diritti di riutilizzo del concept. Le versioni precedenti rimangono nella cronologia Git.
