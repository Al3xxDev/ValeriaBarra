import assert from "node:assert/strict";
import test from "node:test";
import { bookingRequestSchema } from "../src/lib/booking-validation";
import { beforeAfterCaseSchema, publicationIssues } from "../src/lib/before-after-validation";
import { BeforeAfterStatus } from "@prisma/client";

const validBooking = {
  firstName: "  Giulia ", lastName: "Rossi", email: "giulia@example.test", phone: "+39 333 000 0000",
  appointmentType: "Prima visita", preferredDay: "", preferredTime: "", message: "", privacyAccepted: true,
  marketingAccepted: false, website: "",
};

test("booking request accepts the required minimum and trims names", () => {
  const result = bookingRequestSchema.safeParse(validBooking);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.firstName, "Giulia");
});

test("booking request rejects missing privacy consent and invalid email", () => {
  assert.equal(bookingRequestSchema.safeParse({ ...validBooking, privacyAccepted: false }).success, false);
  assert.equal(bookingRequestSchema.safeParse({ ...validBooking, email: "not-an-email" }).success, false);
});

test("marketing remains optional and unselected by default", () => {
  const withoutMarketing = Object.fromEntries(Object.entries(validBooking).filter(([key]) => key !== "marketingAccepted"));
  assert.equal(bookingRequestSchema.safeParse(withoutMarketing).success, true);
});

const publishableCase = {
  title: "Un percorso costruito con calma",
  slug: "percorso-costruito-con-calma",
  description: "Un racconto sintetico di un percorso nutrizionale personalizzato.",
  goal: "Costruire abitudini alimentari sostenibili.",
  journey: "",
  duration: "Esempio",
  resultDescription: "",
  testimonial: "",
  imageBefore: "/api/media/beforeasset123",
  imageAfter: "/api/media/afterasset123",
  imageBeforeAlt: "Illustrazione iniziale dimostrativa",
  imageAfterAlt: "Illustrazione finale dimostrativa",
  contentConsent: true,
  imagesConsent: true,
  contentConsentNotes: "Modulo di consenso conservato nello studio.",
  imagesConsentNotes: "Autorizzazione alle immagini conservata nello studio.",
  anonymized: true,
  status: BeforeAfterStatus.PUBLISHED,
};

test("a published story requires valid consent, anonymization, complete pair and alt text", () => {
  assert.equal(beforeAfterCaseSchema.safeParse(publishableCase).success, true);
  assert.deepEqual(publicationIssues(beforeAfterCaseSchema.parse(publishableCase)), []);
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, contentConsent: false })).some((issue) => issue.includes("consenso")));
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, imagesConsent: false })).some((issue) => issue.includes("immagini")));
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, anonymized: false })).some((issue) => issue.includes("anonimizzato")));
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, imageAfter: "" })).some((issue) => issue.includes("entrambe le immagini")));
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, imageAfter: publishableCase.imageBefore })).some((issue) => issue.includes("diverse")));
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, imageBeforeAlt: "" })).some((issue) => issue.includes("alternativo")));
  assert.ok(publicationIssues(beforeAfterCaseSchema.parse({ ...publishableCase, goal: "" })).some((issue) => issue.includes("obiettivo")));
});

test("case images must use the private media route rather than arbitrary external URLs", () => {
  assert.equal(beforeAfterCaseSchema.safeParse({ ...publishableCase, imageBefore: "https://example.test/persona.jpg" }).success, false);
  assert.equal(beforeAfterCaseSchema.safeParse({ ...publishableCase, slug: "Nome-Cognome" }).success, false);
});
