# Valeria Barra · Biologa Nutrizionista

Sito professionale e piccolo CMS per presentare i percorsi nutrizionali, pubblicare articoli e ricette e raccogliere richieste di appuntamento.

## Stack

- Next.js App Router con React e TypeScript strict.
- PostgreSQL e Prisma con migrazioni versionate.
- Zod per la validazione server-side; sessioni admin firmate con `jose`, password hashate con bcrypt.
- Immagini su storage S3 compatibile, private fino alla pubblicazione autorizzata.
- Invio email opzionale via Resend; nessuna credenziale nel repository.

## Avvio locale

Servono Node.js 20.9 o successivo, npm e Docker Compose.

1. Installa le dipendenze: `npm install`.
2. Copia `.env.example` in `.env`.
3. Avvia PostgreSQL: `docker compose up -d db`.
4. Inizializza il database: `npm run db:deploy`.
5. Carica i contenuti demo e l’account amministratore: `npm run db:seed`.
6. Avvia il sito: `npm run dev` e apri <http://localhost:3000>.

L’account dimostrativo locale creato dal seed è `admin@valeriabarra.local` con password `change-this-development-password`. Cambialo prima di esporre l’ambiente a chiunque. Il seed aggiunge richieste, articoli e tre storie di esempio: una pubblicata con illustrazioni astratte, una bozza con consensi sintetici e una bozza senza consensi. Ogni storia demo è marcata nel pannello e nel sito; fixture e consensi dimostrativi non vengono inseriti quando `NODE_ENV=production`.

## Variabili d’ambiente

Necessarie in produzione:

- `DATABASE_URL`: URL PostgreSQL managed.
- `AUTH_SECRET`: stringa casuale di almeno 32 caratteri; per generarne una, usa `openssl rand -hex 32`.
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`: credenziali iniziali dell’unico admin. La password viene salvata solo come hash.
- `NEXT_PUBLIC_SITE_URL`: URL pubblico canonico, per metadata, sitemap e JSON-LD.

Facoltative:

- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`: inviano una notifica allo studio e una ricevuta al cliente. Senza queste variabili la prenotazione viene salvata normalmente e l’app non tenta l’invio.
- `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`: bucket S3 compatibile per i media. Mantieni il bucket privato; il sito distribuisce un’immagine solo quando il contenuto collegato è pubblicato e, per le storie personali, quando sono registrati i consensi richiesti. In locale gli upload vengono conservati in `.private-media` con permessi limitati; in produzione lo storage S3 è obbligatorio. Gli upload accettano JPEG, PNG e WebP fino a 8 MB, vengono decodificati, ridimensionati e riconvertiti in WebP sul server, con rimozione dei metadati.
- `NEXT_PUBLIC_GA_ID`: ID Google Analytics facoltativo. Lo script viene caricato solo dopo consenso; per impostazione predefinita non è configurato.

Le URL social, email, telefono, WhatsApp e i testi del profilo si modificano da **Admin → Impostazioni**. I link restano assenti finché non vengono inseriti recapiti reali.

## Database e admin

- Modifica locale dello schema: `npm run db:migrate`.
- Migrazioni in staging/produzione: `npm run db:deploy`.
- Generazione del client: `npm run db:generate`.
- Seed di sviluppo: `npm run db:seed`.

L’area `/admin` protegge pagine e API lato server, usa cookie HttpOnly/SameSite Strict e sessioni con scadenza, limita i tentativi di accesso con contatori PostgreSQL e controlla l’origine delle richieste mutative. La gestione include richieste, contenuti editoriali, ricette, casi con consenso e impostazioni del sito.

### Storie “Prima & Dopo”

La pagina pubblica è `/prima-e-dopo`, con una pagina dettaglio per ogni slug. Il pannello **Admin → Contenuti → Storie di percorso** consente di creare e salvare bozze, caricare o rimuovere le due immagini, visualizzare un’anteprima privata, registrare o ritirare i consensi, pubblicare, archiviare ed eliminare. La pubblicazione richiede: obiettivo, due file immagine distinti e disponibili, testi alternativi, conferma di anonimizzazione, consenso al racconto e alle immagini. Quando si registra un nuovo consenso occorre aggiungere una nota privata che indichi dove è conservata la prova; la timeline mostra data e cambi di stato. Non inserire dati identificativi nelle note.

Le immagini di casi personali vengono servite da `/api/media/[id]` solo se collegate a una storia pubblicata con i consensi attivi. La preview admin usa un endpoint separato autenticato. Ritirare un consenso rimuove immediatamente la storia dal sito, chiude le registrazioni precedenti e salva il caso come bozza. Eliminare o sostituire un’immagine scollega e rimuove dal bucket gli asset che non sono più usati da altri contenuti. `revalidatePath` aggiorna lista, dettaglio, Home e sitemap dopo le modifiche.

## Email e prenotazioni

Il form non chiede dati sanitari. La richiesta viene salvata prima del tentativo email; un errore del provider non annulla la prenotazione. Gli stati sono `NEW`, `CONTACTED`, `CONFIRMED`, `CANCELLED`, `COMPLETED` e `ARCHIVED`. Le note interne non sono esposte nel sito pubblico.

## Controlli

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

La suite browser usa Playwright e Chrome/Chromium. Indica il binario locale con `CHROME_BIN=/percorso/a/google-chrome npm run test:e2e`; richiede il database demo inizializzato. Il test end-to-end archivia la prenotazione che crea e rimuove l’articolo di verifica.

## Build e deployment

Configura PostgreSQL managed e, se necessario, bucket privato e Resend. Imposta le variabili d’ambiente senza inserirle nel repository. In fase di rilascio esegui `npm run db:deploy`, crea l’admin con `NODE_ENV=production npm run db:seed`, quindi `npm run build` e `npm start`. Next.js può essere distribuito su Vercel o su un host Node compatibile; se usi serverless, scegli un pool PostgreSQL adatto alle funzioni e abilita la persistenza delle cache di revalidation.

## Contenuti da finalizzare

Le fotografie sono immagini editoriali segnaposto, non ritratti della professionista. Gli articoli e le ricette seed sono materiale di sviluppo: verificare copy, ricette e indicazioni nutrizionali con Valeria prima di pubblicarli. Privacy e cookie policy sono bozze operative e devono essere completate e validate da un professionista legale. Inserire il dominio pubblico e i recapiti reali prima del rilascio.
