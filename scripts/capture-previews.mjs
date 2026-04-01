import { chromium } from "playwright";

const sites = [
  { url: "https://www.hovn.app", file: "public/previews/hovn.png" },
  { url: "https://www.manageinc.com", file: "public/previews/manage.png" },
  { url: "https://tayloredinstruction.com", file: "public/previews/taylored.png" },
];

const browser = await chromium.launch();

for (const { url, file } of sites) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: file });
  await context.close();
  console.log(`Saved ${file}`);
}

await browser.close();
