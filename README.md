# Farmacia 2 — Ponte Dattaro

Versione 0.8.0: proposta grafica indipendente per Farmacia Ponte Dattaro, Parma.

[Apri il sito](https://gabrielecapponi-ux.github.io/farmacia-2/?v=0.8.0)

## Apertura e contatti

L’interno illustrativo riempie lo schermo, con nome, messaggio, sede e collegamenti sovrapposti. Scorrendo si avanza verso il banco; tornando indietro si ripercorre l’ingresso. La clip dura 5 secondi alla velocità naturale, quattro volte più rapida della precedente versione 20 secondi, con un moderato avvicinamento aggiuntivo della camera. Nessun ritorno o loop. Il comando Ferma il movimento congela video e avvicinamento; Riprendi riallinea l’interno allo scroll.

Chiama e WhatsApp rimangono fissi in basso a destra sia su desktop sia su mobile. Il menu e i collegamenti consentono di raggiungere direttamente le sezioni senza completare l’ingresso.

Movimento ridotto, risparmio dati, viewport bassa, testo ingrandito, errore video o JavaScript disattivato mantengono poster e contenuti nel flusso, senza una lunga corsa di scroll vuota. Il video non viene richiesto nei casi ridotti o con risparmio dati. Non viene intercettato lo scorrimento nativo.

## Storia e servizi

Quattro tappe illustrate: apertura nel 1966, sede attuale dal 1988, guida del dott.Enrico Bruschi dal marzo 1999, sessantesimo 1966–2026. Su desktop la fotografia resta accanto ai testi e cambia seguendo la lettura; su mobile, con movimento ridotto o testo molto grande, ogni tappa mostra la propria immagine nel normale flusso. I testi rimangono sempre disponibili. Se una fotografia dello stage non si carica, la sezione torna alla disposizione in flusso.

Le quattro schede dei servizi hanno lo stesso trattamento e mostrano descrizione, scheda ufficiale e contatto specifico. Le fotografie ricevono un solo movimento breve di 1,8 secondi, poi si fermano. I comandi delle immagini consentono pausa, ripresa e ripetizione; focus, tocco, uscita dalla viewport e scheda nascosta sospendono i movimenti. Restano FAQ e galleria touch/tastiera.

## Dati e immagini

Il JSON-LD Pharmacy è invariato: soltanto dati confermati e quattro servizi in hasOfferCatalog, con nomi, descrizioni, provider e collegamenti coerenti con il contenuto. Nessun orario, prezzo, disponibilità, recensione o immagine IA attribuita all’ente. Il concept rimane noindex,nofollow e separato dal sito ufficiale.

Video e fotografie sono scene illustrative IA già disponibili nel progetto originale, non riprese autentiche della farmacia o del personale. Le scene storiche non sono fotografie d’archivio. Il video deriva dalla precedente generazione Higgsfield Kling3.0; le animazioni dell’interfaccia sono eseguite nel browser. Nessuna nuova generazione o dipendenza frontend.

## Avvio

Richiede Node.js, senza dipendenze da installare.

```sh
npm run dev
npm run build
npm run preview
npm run test:schema
```

La build contiene 66 file, inclusi formati e risoluzioni alternativi. Il totale della confezione non è il trasferimento di una visita. Main conserva i sorgenti; GitHub Pages pubblica gh-pages. Aggiornare soltanto main non pubblica il sito.

## Fonti e crediti

[Fonti dei dati e dei servizi](DATA-SOURCES.md). DM Sans usa SIL Open Font License 1.1, conservata in assets/fonts/. Il marchio è parte del concept, non il logo ufficiale della farmacia.

Il prototipo non raccoglie dati e non conferma prenotazioni; i contatti aprono i canali reali. Questo repository non concede diritti di riutilizzo del concept per altri clienti. Le versioni precedenti restano nella cronologia Git.
