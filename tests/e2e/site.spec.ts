import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { deletePrivateMedia } from "../../src/lib/media-storage";
import { prisma } from "../../src/lib/prisma";

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@valeriabarra.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "cambia-questa-password";
const email = `e2e-${Date.now()}@example.test`;

test("public pages, booking, protected admin and editorial flows", async ({ page }) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  const missingResources: string[] = [];
  const failedStoryMedia: string[] = [];
  const expectedNotFoundPaths = new Set(["/prima-e-dopo/bozza-dimostrativa-con-consensi"]);
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location();
    const isExpectedNotFound = message.text().includes("404 (Not Found)") && expectedNotFoundPaths.has(new URL(location.url).pathname);
    if (!isExpectedNotFound) consoleErrors.push(`${message.text()} ${JSON.stringify(location)}`);
  });
  page.on("response", (response) => {
    if (/\/api\/media\//.test(response.url()) && response.status() >= 400) failedStoryMedia.push(`${response.status()} ${response.url()}`);
    if (response.status() === 404 && !["fetch", "xhr"].includes(response.request().resourceType())) {
      const path = new URL(response.url()).pathname;
      if (!expectedNotFoundPaths.has(path)) missingResources.push(`${response.request().resourceType()} ${response.url()}`);
    }
  });
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(Date.now() % 250) + 1}` });

  const protectedResponse = await page.request.get("/api/admin/bookings");
  expect(protectedResponse.status()).toBe(401);
  expect((await page.request.get("/api/admin/cases")).status()).toBe(401);
  expect((await page.request.get("/api/admin/media/demostorybeforemedia01")).status()).toBe(401);
  await page.goto("/prima-e-dopo/bozza-dimostrativa-con-consensi");
  await expect(page.locator(".not-found")).toContainText("Questo sentiero");
  const draftRobots = await page.locator('meta[name="robots"]').evaluateAll((elements) => elements.map((element) => element.getAttribute("content") ?? ""));
  expect(draftRobots.length).toBeGreaterThan(0);
  expect(draftRobots.every((content) => content.includes("noindex"))).toBe(true);
  await expect(page.locator("body")).not.toContainText("Bozza dimostrativa con consensi");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Il benessere");
  for (const viewport of [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `horizontal overflow at ${viewport.width}px`).toBe(false);
  }
  const homeA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const homeViolations = homeA11y.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  expect(homeViolations, JSON.stringify(homeViolations, null, 2)).toEqual([]);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.locator(".mobile-menu summary").click();
  await expect(page.locator(".mobile-menu nav").getByRole("link", { name: "Chi sono" })).toBeVisible();

  await page.goto("/chi-sono");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("La nutrizione");
  await page.goto("/percorsi");
  await expect(page.getByRole("heading", { name: /Il supporto giusto/ })).toBeVisible();
  await page.goto("/ricette");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ricette");
  await page.goto("/news");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Una lettura");
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Privacy");
  await page.goto("/cookie");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("navigazione");

  await page.goto("/prenota");
  await expect(page.locator("html")).toHaveClass(/motion-enhanced/);
  await page.evaluate(async () => { await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))); });
  const bookingA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bookingViolations = bookingA11y.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  expect(bookingViolations, JSON.stringify(bookingViolations, null, 2)).toEqual([]);
  await page.getByLabel("Nome", { exact: true }).fill("Lucia E2E");
  await page.getByLabel("Cognome", { exact: true }).fill("Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Telefono").fill("+39 333 000 1234");
  await page.locator("select[name=appointmentType]").selectOption("Prima visita");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Invia la richiesta/ }).click();
  await expect(page.getByRole("status")).toContainText("Richiesta ricevuta");

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Buongiorno, Valeria." })).toBeVisible();

  await page.goto("/admin/bookings");
  await page.getByPlaceholder("Cerca nome, email, telefono").fill(email);
  const booking = page.locator(".booking-row").filter({ hasText: email });
  await expect(booking).toBeVisible();
  await booking.click();
  await page.locator(".booking-modal select").selectOption("ARCHIVED");
  await page.getByLabel("Note interne").fill("Richiesta registrata dal test automatico.");
  await page.getByRole("button", { name: /Salva modifiche/ }).click();
  await expect(page.getByRole("status")).toContainText("Prenotazione aggiornata");

  await page.goto("/admin/content");
  await page.getByLabel("Titolo", { exact: true }).fill("Articolo automatico di verifica");
  await page.getByLabel("Slug URL").fill(`verifica-${Date.now()}`);
  await page.locator("textarea[name=content]").fill("Questo contenuto viene creato dal test end to end per verificare la gestione editoriale.");
  await page.getByLabel("Pubblica").check();
  await page.getByRole("button", { name: "Salva" }).click();
  const content = page.locator(".content-item").filter({ hasText: "Articolo automatico di verifica" });
  await expect(content).toContainText("Pubblicato");
  await content.getByRole("button", { name: "Modifica" }).click();
  await page.locator(".admin-content-form input[name=title]").fill("Articolo automatico aggiornato");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  const updated = page.locator(".content-item").filter({ hasText: "Articolo automatico aggiornato" });
  await expect(updated).toContainText("Pubblicato");
  page.once("dialog", (dialog) => dialog.accept());
  await updated.getByRole("button", { name: "Elimina" }).click();
  await expect(page.locator(".content-item").filter({ hasText: "Articolo automatico aggiornato" })).toHaveCount(0);

  await page.getByRole("tab", { name: "Ricette" }).click();
  await page.getByLabel("Titolo", { exact: true }).fill("Ricetta automatica di verifica");
  await page.getByLabel("Slug URL").fill(`ricetta-verifica-${Date.now()}`);
  await page.getByLabel("Descrizione").fill("Ricetta di prova creata dalla suite automatica per verificare il CMS.");
  await page.locator("textarea[name=ingredients]").fill("Farro, 160 g\nCeci cotti, 200 g");
  await page.locator("textarea[name=method]").fill("Cuoci il farro.\nUnisci gli ingredienti e servi.");
  await page.getByLabel("Pubblica").check();
  await page.getByRole("button", { name: "Salva" }).click();
  const recipe = page.locator(".content-item").filter({ hasText: "Ricetta automatica di verifica" });
  await expect(recipe).toContainText("Pubblicato");
  page.once("dialog", (dialog) => dialog.accept());
  await recipe.getByRole("button", { name: "Elimina" }).click();
  await expect(page.locator(".content-item").filter({ hasText: "Ricetta automatica di verifica" })).toHaveCount(0);

  const storyRun = Date.now();
  const storyTitle = `Caso demo verificato ${storyRun}`;
  const storySlug = `e2e-caso-demo-verificato-${storyRun}`;
  expectedNotFoundPaths.add(`/prima-e-dopo/${storySlug}`);
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.getByLabel("Titolo", { exact: true }).fill(storyTitle);
  await page.getByLabel("Slug URL").fill(storySlug);
  await page.getByLabel("Descrizione", { exact: true }).fill("Contenuto sintetico creato dalla suite automatica, senza riferimenti a persone reali.");
  await page.getByLabel("Obiettivo generale").fill("Verificare un percorso raccontato in modo rispettoso.");
  await page.locator('select[name="status"]').selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("status")).toContainText("Non è possibile pubblicare");
  // Chromium logs the deliberately rejected 400 response; clear only after asserting the visible validation.
  consoleErrors.length = 0;
  await page.locator('select[name="status"]').selectOption("DRAFT");
  await page.getByRole("button", { name: "Salva" }).click();
  const story = page.locator(".content-item").filter({ hasText: storyTitle });
  await expect(story).toContainText("Bozza");
  await page.goto("/prima-e-dopo");
  await expect(page.locator(".story-card").filter({ hasText: storyTitle })).toHaveCount(0);
  await page.goto(`/prima-e-dopo/${storySlug}`);
  await expect(page.locator(".not-found")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(storyTitle);

  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  const draftStory = page.locator(".content-item").filter({ hasText: storyTitle });
  await draftStory.getByRole("button", { name: "Modifica" }).click();
  const pixelImage = await sharp({ create: { width: 48, height: 48, channels: 3, background: "#c8d2c5" } }).png().toBuffer();
  await page.locator('input[name="imageBeforeAlt"]').fill("Illustrazione di prova prima del percorso.");
  await page.locator('input[name="imageAfterAlt"]').fill("Illustrazione di prova dopo il percorso.");
  await page.getByLabel("Carica immagine prima").setInputFiles({ name: "prima.png", mimeType: "image/png", buffer: pixelImage });
  await expect(page.getByText("Immagine ottimizzata e salvata.", { exact: false }).first()).toBeVisible();
  await page.getByLabel("Carica immagine dopo").setInputFiles({ name: "dopo.png", mimeType: "image/png", buffer: pixelImage });
  await expect(page.getByText("Immagine ottimizzata e salvata.", { exact: false }).last()).toBeVisible();
  await page.getByRole("button", { name: "Anteprima privata" }).click();
  await expect(page.locator(".admin-story-preview")).toContainText("Anteprima privata · non pubblica");
  await expect(page.locator(".admin-story-preview img").first()).toHaveAttribute("src", /\/api\/admin\/media\//);
  await page.locator('textarea[name="contentConsentNotes"]').fill("Fixture del test; prova sintetica conservata nello scenario automatico.");
  await page.locator('textarea[name="imagesConsentNotes"]').fill("Fixture del test; immagini sintetiche generate per il test.");
  await page.locator('input[name="contentConsent"]').check();
  await page.locator('input[name="imagesConsent"]').check();
  await page.locator('input[name="anonymized"]').check();
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.locator(".admin-message")).toContainText("Bozza salvata");
  await page.goto("/prima-e-dopo");
  await expect(page.locator(".story-card").filter({ hasText: storyTitle })).toHaveCount(0);

  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.locator(".content-item").filter({ hasText: storyTitle }).getByRole("button", { name: "Modifica" }).click();
  await expect(page.getByRole("heading", { name: "Cronologia dei consensi" })).toBeVisible();
  await page.locator('select[name="status"]').selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.locator(".admin-message")).toContainText("Storia pubblicata");
  await expect(page.locator(".content-item").filter({ hasText: storyTitle })).toContainText("Pubblicata");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/prima-e-dopo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ogni percorso");
  await expect(page.locator(".story-card").filter({ hasText: storyTitle })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.evaluate(async () => { await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))); });
  const storiesA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const storiesViolations = storiesA11y.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  expect(storiesViolations, JSON.stringify(storiesViolations, null, 2)).toEqual([]);
  await page.locator(".story-card").filter({ hasText: storyTitle }).getByRole("link", { name: /Scopri il percorso/ }).click();
  await expect(page).toHaveURL(new RegExp(`/prima-e-dopo/${storySlug}$`));
  await expect(page.getByRole("heading", { level: 1, name: storyTitle })).toBeVisible();
  await expect(page.locator(".story-detail-grid")).toContainText("Verificare un percorso");
  await expect(page).toHaveTitle(/Una storia di percorso/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/prima-e-dopo/${storySlug}$`));
  await expect(page.locator("body")).not.toContainText("Fixture del test");
  const imageSources = await page.locator(".story-detail-page .story-images img").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
  expect(imageSources).toHaveLength(2);
  for (const source of imageSources) expect((await page.request.get(source)).status()).toBe(200);
  await page.evaluate(async () => { await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))); });
  const detailA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const detailViolations = detailA11y.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  expect(detailViolations, JSON.stringify(detailViolations, null, 2)).toEqual([]);
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/prima-e-dopo/${storySlug}`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".stories-teaser").getByRole("heading", { name: storyTitle })).toBeVisible();
  await expect(page.locator(".desktop-nav a[href='/prima-e-dopo']")).toHaveCount(1);

  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.locator(".content-item").filter({ hasText: storyTitle }).getByRole("button", { name: "Modifica" }).click();
  const publishedBeforeUrl = await page.locator('input[name="imageBefore"]').inputValue();
  await page.locator('textarea[name="description"]').fill("Descrizione aggiornata dal test automatico, sempre priva di dati identificativi.");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.locator(".admin-message")).toContainText("Storia pubblicata");
  await page.goto(`/prima-e-dopo/${storySlug}`);
  await expect(page.getByText("Descrizione aggiornata dal test automatico", { exact: false })).toBeVisible();

  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.locator(".content-item").filter({ hasText: storyTitle }).getByRole("button", { name: "Modifica" }).click();
  await page.locator('input[name="imagesConsent"]').uncheck();
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.locator(".admin-message")).toContainText("rimossa dal sito");
  await expect(page.locator(".content-item").filter({ hasText: storyTitle })).toContainText("Bozza");
  await page.goto("/prima-e-dopo");
  await expect(page.locator(".story-card").filter({ hasText: storyTitle })).toHaveCount(0);
  await page.goto(`/prima-e-dopo/${storySlug}`);
  await expect(page.locator(".not-found")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(storyTitle);
  const mediaId = publishedBeforeUrl.match(/\/api\/media\/([a-z0-9]+)/i)?.[1];
  expect(mediaId).toBeTruthy();
  expect((await page.request.get(`/api/media/${mediaId}`)).status()).toBe(404);

  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.locator(".content-item").filter({ hasText: storyTitle }).getByRole("button", { name: "Modifica" }).click();
  await page.locator('select[name="status"]').selectOption("ARCHIVED");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  const archivedStory = page.locator(".content-item").filter({ hasText: storyTitle });
  await expect(archivedStory).toContainText("Archiviata");
  page.once("dialog", (dialog) => dialog.accept());
  await archivedStory.getByRole("button", { name: "Elimina" }).click();
  await expect(page.locator(".content-item").filter({ hasText: storyTitle })).toHaveCount(0);

  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.locator(".content-item").filter({ hasText: "Un esempio di percorso" }).getByRole("button", { name: "Modifica" }).click();
  await page.locator('select[name="status"]').selectOption("ARCHIVED");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.locator(".admin-message")).toContainText("Storia archiviata");
  await page.goto("/prima-e-dopo");
  await expect(page.locator(".stories-empty")).toContainText("Presto saranno disponibili");
  await page.goto("/");
  await expect(page.locator(".stories-teaser")).toHaveCount(0);
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Storie di percorso" }).click();
  await page.locator(".content-item").filter({ hasText: "Un esempio di percorso" }).getByRole("button", { name: "Modifica" }).click();
  await page.locator('select[name="status"]').selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(page.locator(".admin-message")).toContainText("Storia pubblicata");

  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "Impostazioni" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/admin", "/admin/content", "/admin/bookings", "/admin/settings"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveClass(/motion-enhanced/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `horizontal overflow on ${route} at 390px`).toBe(true);
  }
  await page.goto("/admin/settings");
  await page.getByRole("button", { name: /Esci/ }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(failedStoryMedia).toEqual([]);
  expect(consoleErrors, `Console errors; 404 resources: ${missingResources.join(", ")}`).toEqual([]);
});

test("motion enhancement is subtle, one-time, accessible and progressively enhanced", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/motion-enhanced/);
  await expect(page.locator(".hero h1")).toHaveCSS("animation-name", "motion-rise-title");

  const intro = page.locator(".intro-section");
  await expect.poll(() => intro.evaluate((element) => getComputedStyle(element).opacity)).toBe("0");
  expect(await intro.evaluate((element) => getComputedStyle(element).opacity)).toBe("0");
  await intro.scrollIntoViewIfNeeded();
  await expect.poll(() => intro.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-menu summary").click();
  const mobileNav = page.locator(".mobile-menu nav");
  await expect(mobileNav.getByRole("link", { name: "Chi sono" })).toBeVisible();
  expect(await mobileNav.evaluate((element) => getComputedStyle(element).animationName)).toBe("motion-menu-in");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/motion-enhanced/);
  await expect(page.locator(".hero h1")).toHaveCSS("animation-name", "none");
  expect(await page.locator(".intro-section").evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  await page.locator(".mobile-menu summary").click();
  const reducedLink = page.locator(".mobile-menu nav a:nth-child(2)");
  expect(await reducedLink.evaluate((element) => getComputedStyle(element).animationDelay)).toBe("0s");

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto("/");
    await expect(noJsPage.getByRole("heading", { level: 1 })).toContainText("Il benessere");
    await expect(noJsPage.locator("html")).not.toHaveClass(/motion-enhanced/);
    expect(await noJsPage.locator(".intro-section").evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    await noJsPage.goto("/prima-e-dopo");
    await expect(noJsPage.getByRole("heading", { level: 1 })).toContainText("Ogni percorso");
  } finally {
    await noJsContext.close();
  }
});

test.afterEach(async () => {
  const leakedCases = await prisma.beforeAfterCase.findMany({
    where: { slug: { startsWith: "e2e-caso-demo-verificato-" } },
    select: { id: true, imageBeforeId: true, imageAfterId: true },
  });
  for (const item of leakedCases) {
    const mediaIds = [...new Set([item.imageBeforeId, item.imageAfterId].filter((id): id is string => Boolean(id)))];
    await prisma.beforeAfterCase.delete({ where: { id: item.id } });
    for (const id of mediaIds) {
      const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { storageKey: true } });
      if (!asset) continue;
      const [articles, recipes, beforeCases, afterCases] = await Promise.all([
        prisma.article.count({ where: { coverMediaId: id } }),
        prisma.recipe.count({ where: { mediaAssetId: id } }),
        prisma.beforeAfterCase.count({ where: { imageBeforeId: id } }),
        prisma.beforeAfterCase.count({ where: { imageAfterId: id } }),
      ]);
      if (articles || recipes || beforeCases || afterCases) continue;
      await prisma.mediaAsset.delete({ where: { id } });
      await deletePrivateMedia(asset.storageKey);
    }
  }
});
