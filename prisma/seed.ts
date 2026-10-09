import "dotenv/config";
import { stat } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { BeforeAfterStatus, ConsentScope } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const productionSeed = String(process.env.NODE_ENV) === "production";
  const email = (process.env.ADMIN_EMAIL ?? "admin@valeriabarra.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? (productionSeed ? "" : "cambia-questa-password");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD deve contenere almeno 12 caratteri.");
  await prisma.adminUser.upsert({ where: { email }, create: { email, passwordHash: await hash(password, 12), name: "Valeria Barra" }, update: { passwordHash: await hash(password, 12) } });
  if (productionSeed) return;

  const alimentazione = await prisma.category.upsert({ where: { slug: "alimentazione" }, create: { name: "Alimentazione", slug: "alimentazione" }, update: {} });
  const consapevolezza = await prisma.category.upsert({ where: { slug: "consapevolezza" }, create: { name: "Consapevolezza", slug: "consapevolezza" }, update: {} });
  const recipeCategory = await prisma.category.upsert({ where: { slug: "piatti-unici" }, create: { name: "Piatti unici", slug: "piatti-unici" }, update: {} });
  await prisma.article.upsert({ where: { slug: "mangiare-bene-quando-il-tempo-e-poco" }, create: { title: "Mangiare bene, anche quando il tempo è poco", slug: "mangiare-bene-quando-il-tempo-e-poco", subtitle: "Piccole abitudini e scelte semplici, che lasciano spazio alla vita.", content: "Le giornate piene non richiedono regole più rigide: spesso aiutano poche scelte pratiche, pensate in anticipo e facili da ripetere.\n\nTenere in dispensa legumi, cereali e verdure di stagione permette di comporre pasti diversi senza partire ogni volta da zero.\n\nContenuto dimostrativo: rivedere e approvare il testo prima della pubblicazione.", categoryId: consapevolezza.id, published: true, publishedAt: new Date(), seoTitle: "Mangiare bene quando il tempo è poco", seoDescription: "Idee semplici per organizzare i pasti con flessibilità." }, update: {} });
  await prisma.article.upsert({ where: { slug: "la-spesa-di-stagione-con-serenita" }, create: { title: "La spesa di stagione, con più serenità", slug: "la-spesa-di-stagione-con-serenita", subtitle: "Una traccia flessibile per scegliere ingredienti buoni e ridurre gli sprechi.", content: "Fare la spesa può essere più semplice quando si parte da una base flessibile: qualche verdura, una fonte proteica, pane o cereali e ingredienti che ami davvero.\n\nLa stagionalità offre varietà e sapore, ma non deve diventare una nuova regola da seguire con ansia.\n\nContenuto dimostrativo: rivedere e approvare il testo prima della pubblicazione.", categoryId: alimentazione.id, published: true, publishedAt: new Date(), seoTitle: "Spesa di stagione con serenità", seoDescription: "Una guida flessibile alla spesa con ingredienti di stagione." }, update: {} });
  await prisma.recipe.upsert({ where: { slug: "bowl-farro-ceci-verdure" }, create: { title: "Bowl di farro, ceci e verdure", slug: "bowl-farro-ceci-verdure", description: "Un piatto colorato e versatile, da comporre con le verdure che hai a disposizione.", categoryId: recipeCategory.id, ingredients: ["Farro", "Ceci già cotti", "Pomodorini", "Zucchine", "Erbe fresche", "Olio extravergine d’oliva", "Limone"], method: ["Cuoci il farro seguendo i tempi indicati sulla confezione e lascialo intiepidire.", "Taglia le verdure e condiscile con olio e limone.", "Unisci farro e ceci, completa con verdure ed erbe fresche."], prepMinutes: 25, difficulty: "Facile", published: true, publishedAt: new Date() }, update: {} });
  await prisma.recipe.upsert({ where: { slug: "pasta-integrale-pomodorini" }, create: { title: "Pasta integrale con pomodorini", slug: "pasta-integrale-pomodorini", description: "Una ricetta essenziale che cambia con le erbe e i pomodori della stagione.", categoryId: recipeCategory.id, ingredients: ["Pasta integrale", "Pomodorini", "Basilico", "Olio extravergine d’oliva"], method: ["Cuoci la pasta in acqua salata.", "In una padella scalda i pomodorini con un filo d’olio e il basilico.", "Scola la pasta e amalgama con il condimento."], prepMinutes: 20, difficulty: "Facile", published: true, publishedAt: new Date() }, update: {} });
  const demoBeforeId = "demostorybeforemedia01";
  const demoAfterId = "demostoryaftermedia01";
  const demoBeforeSize = (await stat("public/images/prima-dopo-demo-prima.svg")).size;
  const demoAfterSize = (await stat("public/images/prima-dopo-demo-dopo.svg")).size;
  const demoBefore = await prisma.mediaAsset.upsert({
    where: { id: demoBeforeId },
    create: { id: demoBeforeId, storageKey: "demo/prima-dopo-demo-prima.svg", url: `/api/media/${demoBeforeId}`, altText: "Illustrazione dimostrativa astratta, prima del percorso; nessuna persona reale.", mimeType: "image/svg+xml", sizeBytes: demoBeforeSize },
    update: { storageKey: "demo/prima-dopo-demo-prima.svg", url: `/api/media/${demoBeforeId}`, altText: "Illustrazione dimostrativa astratta, prima del percorso; nessuna persona reale.", mimeType: "image/svg+xml", sizeBytes: demoBeforeSize },
  });
  const demoAfter = await prisma.mediaAsset.upsert({
    where: { id: demoAfterId },
    create: { id: demoAfterId, storageKey: "demo/prima-dopo-demo-dopo.svg", url: `/api/media/${demoAfterId}`, altText: "Illustrazione dimostrativa astratta, dopo il percorso; nessuna persona reale.", mimeType: "image/svg+xml", sizeBytes: demoAfterSize },
    update: { storageKey: "demo/prima-dopo-demo-dopo.svg", url: `/api/media/${demoAfterId}`, altText: "Illustrazione dimostrativa astratta, dopo il percorso; nessuna persona reale.", mimeType: "image/svg+xml", sizeBytes: demoAfterSize },
  });
  const demoRecordedAt = new Date();
  const publicDemo = await prisma.beforeAfterCase.upsert({
    where: { id: "demopublicstory01" },
    create: {
      id: "demopublicstory01", title: "Un esempio di percorso", slug: "esempio-dimostrativo-di-percorso",
      description: "Questa storia e le sue immagini sono create per mostrare come apparirà la sezione. Non descrivono una persona o un’esperienza reale.",
      goal: "Mostrare la struttura di un racconto condiviso con attenzione.",
      journey: "L’esempio illustra come descrivere un percorso in modo rispettoso, senza dettagli identificativi o indicazioni cliniche.",
      duration: "Esempio dimostrativo", resultDescription: "Il risultato descritto è parte della fixture e non rappresenta un esito reale.",
      imageBeforeAlt: demoBefore.altText, imageAfterAlt: demoAfter.altText,
      beforeMedia: { connect: { id: demoBefore.id } }, afterMedia: { connect: { id: demoAfter.id } },
      status: BeforeAfterStatus.PUBLISHED, publishedAt: demoRecordedAt, contentConsent: true, imagesConsent: true,
      anonymized: true, isDemo: true, consentRecordedAt: demoRecordedAt,
    },
    update: {
      slug: "esempio-dimostrativo-di-percorso", status: BeforeAfterStatus.PUBLISHED, publishedAt: demoRecordedAt,
      title: "Un esempio di percorso",
      description: "Questa storia e le sue immagini sono create per mostrare come apparirà la sezione. Non descrivono una persona o un’esperienza reale.",
      goal: "Mostrare la struttura di un racconto condiviso con attenzione.",
      journey: "L’esempio illustra come descrivere un percorso in modo rispettoso, senza dettagli identificativi o indicazioni cliniche.",
      duration: "Esempio dimostrativo", resultDescription: "Il risultato descritto è parte della fixture e non rappresenta un esito reale.",
      imageBeforeAlt: demoBefore.altText, imageAfterAlt: demoAfter.altText,
      beforeMedia: { connect: { id: demoBefore.id } }, afterMedia: { connect: { id: demoAfter.id } },
      contentConsent: true, imagesConsent: true, anonymized: true, isDemo: true, consentRecordedAt: demoRecordedAt,
    },
  });
  await prisma.beforeAfterCase.upsert({
    where: { id: "democonsenteddraft01" },
    create: {
      id: "democonsenteddraft01", title: "Bozza dimostrativa con consensi", slug: "bozza-dimostrativa-con-consensi",
      description: "Contenuto sintetico locale. La fixture non rappresenta una persona reale né una prova di consenso.",
      imageBeforeAlt: demoBefore.altText, imageAfterAlt: demoAfter.altText,
      beforeMedia: { connect: { id: demoBefore.id } }, afterMedia: { connect: { id: demoAfter.id } },
      status: BeforeAfterStatus.DRAFT, contentConsent: true, imagesConsent: true, anonymized: true,
      isDemo: true, consentRecordedAt: demoRecordedAt,
    },
    update: {
      slug: "bozza-dimostrativa-con-consensi", status: BeforeAfterStatus.DRAFT, publishedAt: null,
      contentConsent: true, imagesConsent: true, anonymized: true, isDemo: true,
      beforeMedia: { connect: { id: demoBefore.id } }, afterMedia: { connect: { id: demoAfter.id } },
    },
  });
  await prisma.beforeAfterCase.upsert({
    where: { id: "demo-case-unpublished" },
    create: { id: "demo-case-unpublished", title: "Bozza dimostrativa senza consensi", slug: "bozza-dimostrativa-senza-consensi", description: "Contenuto sintetico locale, non riferito a una persona reale.", status: BeforeAfterStatus.DRAFT, contentConsent: false, imagesConsent: false, anonymized: false, isDemo: true },
    update: { title: "Bozza dimostrativa senza consensi", slug: "bozza-dimostrativa-senza-consensi", description: "Contenuto sintetico locale, non riferito a una persona reale.", status: BeforeAfterStatus.DRAFT, publishedAt: null, contentConsent: false, imagesConsent: false, anonymized: false, isDemo: true, consentRecordedAt: null },
  });

  const demoConsents = [
    { id: "demopubliccontentconsent01", caseId: publicDemo.id, scope: ConsentScope.CONTENT, notes: "Record di fixture locale: non costituisce una prova di consenso reale." },
    { id: "demopublicimagesconsent01", caseId: publicDemo.id, scope: ConsentScope.IMAGES, notes: "Record di fixture locale: le immagini sono illustrazioni, nessuna persona reale." },
    { id: "demodraftcontentconsent01", caseId: "democonsenteddraft01", scope: ConsentScope.CONTENT, notes: "Record di fixture locale: non costituisce una prova di consenso reale." },
    { id: "demodraftimagesconsent01", caseId: "democonsenteddraft01", scope: ConsentScope.IMAGES, notes: "Record di fixture locale: le immagini sono illustrazioni, nessuna persona reale." },
  ];
  for (const consent of demoConsents) await prisma.consentRecord.upsert({
    where: { id: consent.id },
    create: { ...consent, granted: true, recordedAt: demoRecordedAt },
    update: { ...consent, granted: true, recordedAt: demoRecordedAt, withdrawnAt: null },
  });
  await prisma.siteSettings.upsert({ where: { id: "main" }, create: { id: "main", name: "Valeria Barra", qualification: "Biologa Nutrizionista", shortBio: "Un percorso nutrizionale costruito intorno alla tua vita, con ascolto e consapevolezza.", city: "Salerno" }, update: {} });

  for (const i of [1, 2, 3]) {
    const demoId = `demo-booking-${i}`;
    await prisma.booking.upsert({ where: { id: demoId }, create: { id: demoId, firstName: "Richiesta demo", lastName: `0${i}`, email: `demo${i}@example.com`, phone: "000 000 0000", appointmentType: i === 1 ? "Prima visita" : "Colloquio conoscitivo", preferredTime: "Indifferente", privacyAcceptedAt: new Date(), status: i === 1 ? "NEW" : "CONTACTED", message: "Dato sintetico di sviluppo, non riferito a una persona reale." }, update: {} });
  }
  if (!productionSeed) console.log(`Admin demo: ${email} / ${password}`);
}

main().catch((error) => { console.error("Development seed failed", error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
