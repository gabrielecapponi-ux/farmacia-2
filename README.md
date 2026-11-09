# Farmacia 2 — Ponte Dattaro

Versione 0.7.1: proposta grafica indipendente per Farmacia Ponte Dattaro, Parma.

[Apri il sito](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.7.1)

## Accesso ai servizi

Un indice presente anche su mobile porta alle quattro schede. Ogni servizio mostra subito descrizione, scheda ufficiale e contatto specifico; le informazioni prima dell’accesso restano nei pannelli espandibili. Testi più leggibili e spaziature più compatte rendono più semplice la consultazione su telefono e desktop. I pannelli hanno una breve transizione di altezza nei browser compatibili, con apertura nativa negli altri e rispetto del movimento ridotto.

## Immagini e interazioni

Tutte le nove fotografie di contenuto hanno un movimento leggero di camera (pan e zoom), visibile senza hover. Il movimento si attiva soltanto sulle foto in vista. Due comandi sincronizzati permettono di fermare o riavviare le immagini. Focus, tocco, uscita dalla viewport e scheda nascosta sospendono il movimento; reduced-motion e risparmio dati lo disattivano. Nessun nuovo file immagine o video richiesto per animare le foto.

L’apertura usa la vista ampia e luminosa dell’interno già presente nel primo sito: un passaggio lento di 20 secondi verso il banco, rallentato quattro volte, con la stessa inquadratura completa su mobile e desktop. Riproduzione nativa silenziosa a pagina ferma, pausa/ripresa e replay; al termine resta l’ultimo fotogramma. Nessun capitolo o avanzamento legato allo scroll.

Poster statico con movimento ridotto, risparmio dati, JavaScript disattivato, errore o autoplay negato. La pagina scorre normalmente e il video si ferma fuori vista o con scheda nascosta. Restano i quattro servizi fotografici equivalenti, i contatti specifici, le FAQ e la galleria touch/tastiera. AVIF preferiti con WebP di fallback, un solo font locale e nessuna dipendenza frontend.

Video e fotografie sono scene illustrative IA, non riprese autentiche degli ambienti o del personale. La scena in bianco e nero non è una fotografia d’archivio.

## Dati strutturati

Il JSON-LD Pharmacy conserva esclusivamente i dati confermati e hasOfferCatalog con quattro Service: ECG, teledermatologia, Holter pressorio e Holter cardiaco. Nomi, descrizioni, provider e URL ufficiali corrispondono alle schede visibili.

Il validatore controlla anche i collegamenti dei contatti e i messaggi WhatsApp specifici. Nessun prezzo, disponibilità, orario, rating, foto IA o logo del concept aggiunto al markup. Non viene aggiunto FAQPage. Il concept resta noindex,nofollow e separato dal sito ufficiale.

Il controllo del 9 novembre 2026 dopo la nuova apertura conferma la coerenza dei dati e dei quattro servizi: nessuna modifica al JSON-LD necessaria. Video e immagini illustrativi restano separati dall’identità della farmacia.

## Avvio

Richiede Node.js, senza dipendenze da installare.

```sh
npm run dev       # http://127.0.0.1:4421/
npm run build     # verifica JSON-LD e genera dist/
npm run preview   # http://127.0.0.1:4422/
npm run test:schema
```

La build contiene 47 file, inclusi formati e risoluzioni alternativi. La somma della confezione non equivale al trasferimento di ogni visita. I sorgenti sono su main; GitHub Pages pubblica gh-pages. Aggiornare main da solo non pubblica la nuova build.

## Fonti e crediti

[Fonti dei dati e dei servizi](DATA-SOURCES.md). “1966–2026 ·60 anni a Parma” si riferisce al2026; la sede attuale risale al1988.

DM Sans usa SIL Open Font License1.1, conservata in assets/fonts/. Il piccolo marchio è parte del concept, non un logo ufficiale. Il film dell’interno, già presente nel primo sito, è generato con Higgsfield Kling3.0 e rallentato quattro volte; l’animazione delle fotografie viene eseguita nel browser con Web Animations API.

Il prototipo non raccoglie dati e non conferma prenotazioni; i contatti aprono i canali reali. I materiali non costituiscono un pacchetto di asset per altri clienti e questo repository non concede diritti di riutilizzo del concept. Le versioni precedenti rimangono nella cronologia Git.
