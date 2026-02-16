const { test, expect } = require("@playwright/test");

test("login screen loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Login")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
});
