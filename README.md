# Farmacia 2 — Ponte Dattaro

Versione 0.9.0: video 4K, immagini ad alta definizione e storia rivista.

[Apri il sito](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.9.0)

## Qualità delle immagini

L’interno desktop è restaurato in 4K dal file originale del provider. Il telefono usa un nuovo video verticale 2160×3840, generato in 4K sullo stesso interno illustrativo, evitando il forte ritaglio del precedente film orizzontale. Lo zoom aggiuntivo è ridotto a 1,08. Lo scorrimento avanti e indietro, i testi sopra il video, il comando di pausa e i contatti fissi sono preservati.

Le fotografie hanno varianti AVIF/WebP a 1280, 1920, 2560 e 3840 pixel. I browser scelgono la risoluzione necessaria in base a dimensione e densità dello schermo; non viene imposta una piccola copia a uno schermo ad alta densità. Le versioni da 3840 pixel sono presenti nella build. Poster derivati dai primi fotogrammi dei video e codifica con keyframe frequenti per lo scorrimento.

I video 4K sono la scelta predefinita. Un errore del decoder può attivare una sola alternativa FullHD; se anche questa fallisce rimane il poster. Movimento ridotto, risparmio dati, JavaScript disattivato o spazio insufficiente conservano immagine e contenuti senza un percorso vuoto. Le animazioni delle foto dei servizi durano 1,4 secondi, con un leggero avvicinamento 1,025, poi si fermano; pausa/ripresa/ripetizione restano disponibili.

## Una storia più documentata

Le quattro tappe mantengono i fatti confermati: apertura nel 1966; sede attuale in Strada Montanara 23/b dal 1988; guida del dott. Enrico Bruschi dal marzo 1999; sessantesimo 1966–2026 e servizi attuali.

La facciata usa una fotografia pubblicata dalla farmacia nel 2016, restaurata digitalmente e mostrata intera. La data è sempre dichiarata: non è una fotografia del 1988 o una prova dell’aspetto attuale. Le altre tre scene sono composizioni illustrative IA su oggetti del lavoro in farmacia, ascolto e strumenti attuali; non sono foto d’archivio o ritratti del personale. La storia conserva i cambi di fotografia allo scroll sul desktop e tutte le immagini nel flusso su mobile, movimento ridotto o testo ingrandito.

Il restauro aumenta la risoluzione di materiali esistenti e non li rende riprese native 4K. Il nuovo film verticale e i tre nuovi visual sono generazioni in 4K. Le dichiarazioni distinguono media illustrativi e fotografia documentale restaurata.

## Dati e avvio

Il JSON-LD Pharmacy resta invariato, con soli dati confermati e quattro servizi coerenti con le schede. Nessun orario, prezzo, disponibilità, recensione o media illustrativo attribuito all’ente. Il concept resta noindex,nofollow e separato dal sito ufficiale.

```sh
npm run dev
npm run build
npm run preview
npm run test:schema
```

Nessuna dipendenza frontend da installare. Main conserva i sorgenti; GitHub Pages pubblica gh-pages. La build distribuisce varianti alternative: il peso totale dei file non equivale al trasferimento di una visita.

## Fonti e crediti

[Dati e servizi](DATA-SOURCES.md). Fonte della foto documentale: [pubblicazione della farmacia nel 2016](https://www.facebook.com/photo/?fbid=185486178484941&set=a.512137567582225). Il video precedente proviene da Higgsfield Kling 3.0, il restauro usa ByteDance Upscale, i nuovi visual GPT Image 2.6 e il film verticale Seedance 2.0. Le animazioni delle interfacce sono eseguite nel browser.

DM Sans usa SIL Open Font License 1.1, conservata in assets/fonts/. Il marchio è del concept, non il logo ufficiale. Il prototipo non raccoglie dati e non conferma prenotazioni; i collegamenti aprono i canali reali. Questo repository non concede diritti di riutilizzo del concept per altri clienti. Le versioni precedenti restano nella cronologia Git.
