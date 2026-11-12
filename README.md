# Farmacia 2 — Ponte Dattaro

Versione0.9.2: persone che camminano nelle quattro tappe della storia, apertura più luminosa e interfaccia mobile rifinita.

[Apri il sito](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.9.2)

## Qualità delle immagini

L’interno desktop è restaurato in 4K dal file originale del provider. Il telefono usa un nuovo video verticale 2160×3840, generato in 4K sullo stesso interno illustrativo, evitando il forte ritaglio del precedente film orizzontale. Lo zoom aggiuntivo è ridotto a 1,08. Lo scorrimento avanti e indietro, i testi sopra il video, il comando di pausa e i contatti fissi sono preservati.

Le fotografie hanno varianti AVIF/WebP a 1280, 1920, 2560 e 3840 pixel. I browser scelgono la risoluzione necessaria in base a dimensione e densità dello schermo; non viene imposta una piccola copia a uno schermo ad alta densità. Le versioni da 3840 pixel sono presenti nella build. Poster derivati dai primi fotogrammi dei video e codifica con keyframe frequenti per lo scorrimento.

I quattro video sono serviti dalle copie immutabili nello stesso repository GitHub, tramite il servizio raw.githubusercontent.com con CORS e richieste parziali. Il pacchetto Pages contiene immagini e interfaccia, senza duplicare i50MB dei video; la qualità e i byte dei filmati restano identici. I riferimenti sono fissati al commit62cd314: per aggiornare i video occorre pubblicare prima i nuovi file e poi aggiornare quel riferimento.

I video 4K sono la scelta predefinita. Un errore del decoder può attivare una sola alternativa FullHD; se anche questa fallisce rimane il poster. Movimento ridotto, risparmio dati, JavaScript disattivato o spazio insufficiente conservano immagine e contenuti senza un percorso vuoto. Le animazioni delle foto dei servizi durano 1,4 secondi, con un leggero avvicinamento 1,025, poi si fermano; pausa/ripresa/ripetizione restano disponibili.

## Una passeggiata nella storia

Le quattro tappe mantengono i fatti confermati: apertura nel1966; sede attuale in Strada Montanara23/b dal1988; guida del dott.Enrico Bruschi dal marzo1999; sessantesimo1966–2026 e servizi attuali.

Quattro scene evocative della serie del progetto Farmacia Ponte Dattaro mostrano passanti anonimi che camminano realmente. Sono ricostruzioni illustrative IA, non fotografie d’archivio, prove delle sedi o ritratti del personale. I master già restaurati con Higgsfield sono riutilizzati senza nuova generazione/spesa. Le clip durano2,5secondi, senza audio, loop, reverse o zoom aggiunto. La persona cammina una volta, poi resta il fotogramma finale; si può rivedere la scena.

Un solo lettore video segue la tappa visibile. Qualità720p/1080p/4K secondo dimensione e densità, circa0,64/1,25/3,2MB per scena; mai tutte insieme. Fuori schermo il filmato viene rilasciato. Pausa, focus sui collegamenti, scheda nascosta, movimento ridotto, risparmio dati, JavaScript disattivato ed errori conservano le fotografie. Il video iniziale viene anch’esso rilasciato quando si passa alla storia.

Le fotografie mantengono quattro risoluzioni fino a3840×2160. I master restaurati di partenza sono3832×2160: la consegna4K è ricampionata, non fotografia nativa4K. La fotografia documentale pubblicata nel2016 rimane nei contatti, con data dichiarata.

## Apertura e telefono

Immagine dell’interno più luminosa, con velatura confinata alla zona dei testi. Il ritaglio verticale mette più in evidenza banco e scaffali. Nuovo carattere locale Sora sul mobile, logo e menu separati, icone e frecce coerenti, pulsanti compatti. Titolo, indirizzo e pausa occupano righe distinte; le viewport basse e il testo ingrandito usano una composizione estesa nel flusso. Gli indirizzi dell’apertura e dei contatti aprono le indicazioni su Google Maps. Chiama e WhatsApp restano fissi.

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

[Dati e servizi](DATA-SOURCES.md). Fonte della foto documentale: [pubblicazione della farmacia nel 2016](https://www.facebook.com/photo/?fbid=185486178484941&set=a.512137567582225). Il video precedente proviene da Higgsfield Kling 3.0, il restauro usa ByteDance Upscale, i visual editoriali GPT Image 2.6 e il film verticale Seedance 2.0. La nuova storia riusa immagini OpenAI animate con Higgsfield Kling 3.0 e restaurate con ByteDance Upscale. Le animazioni delle interfacce sono eseguite nel browser.

DM Sans e Sora usano SIL Open Font License 1.1; licenze conservate in assets/fonts/. Il marchio è del concept, non il logo ufficiale. Il prototipo non raccoglie dati e non conferma prenotazioni; i collegamenti aprono i canali reali. Questo repository non concede diritti di riutilizzo del concept per altri clienti. Le versioni precedenti restano nella cronologia Git.
