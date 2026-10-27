import { expect, test } from "@playwright/test";

test("one login submit sends one authentication request even when submitted twice quickly", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/admin/login", async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Email o password non corretti." }),
    });
  });

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByLabel("Password").fill("test-password");
  await page.locator("form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });

  await expect(page.locator(".admin-login-form .form-status[role=alert]")).toContainText("Email o password non corretti.");
  expect(requests).toBe(1);
});
