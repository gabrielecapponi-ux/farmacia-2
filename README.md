# Farmacia 2 — Ponte Dattaro

Proposta grafica indipendente, versione 0.2.0. Verde bosco, avorio e menta; font Bodoni Moda e DM Sans. Un’alternativa distinta dal sito ufficiale della farmacia.

- Hero animata con scena illustrativa IA e formati dedicati a mobile e desktop.
- Servizi selezionabili, storia per anno, consigli e contatti.
- Barra mobile Chiama/WhatsApp, navigazione da tastiera e controllo del movimento.
- Contenuti e servizi utilizzabili anche senza JavaScript.
- Video progressivo, pausa fuori schermo, poster e rispetto di movimento ridotto/risparmio dati.

Le immagini e il filmato sono illustrativi e generati con IA: non sono fotografie o riprese autentiche della farmacia, del personale o dell’archivio. Il prototipo non raccoglie dati e non conferma prenotazioni. I contatti aprono i canali reali della farmacia.

## Anteprima

[Apri Farmacia 2](https://gabrielecapponi-ux.github.io/farmacia-2/)

La proposta resta `noindex,nofollow`. Il [sito ufficiale della farmacia](https://www.farmaciaparma.it/) è distinto da questa anteprima.

## Avvio

Richiede Node.js, senza dipendenze da installare.

```sh
npm run dev       # http://127.0.0.1:4421/
npm run build     # file statici in dist/
npm run preview   # http://127.0.0.1:4422/
npm run test:schema
```

La build controlla il JSON-LD e copia solo i file statici in `dist/`. I sorgenti sono nel ramo `main`; GitHub Pages pubblica i file statici del ramo `gh-pages`. Per aggiornare l’anteprima occorre creare una nuova build e caricarla su quel ramo.

## Fonti e crediti

I dati strutturati includono soltanto informazioni confermate e presenti nella pagina. Si veda [DATA-SOURCES.md](DATA-SOURCES.md).

Bodoni Moda e DM Sans sono distribuiti sotto SIL Open Font License 1.1; le licenze sono conservate in `assets/fonts/`. Il disegno botanico è generato tramite Higgsfield GPT Image 2.6 e il filmato concettuale tramite Higgsfield Seedance 2.5. Le altre immagini sono ricostruzioni IA già disponibili per il progetto. Il marchio del concept non è presentato come logo ufficiale.

I materiali della proposta non sono un pacchetto di asset per altri clienti. Nessuna licenza di riutilizzo dei materiali del concept viene concessa da questo repository.
