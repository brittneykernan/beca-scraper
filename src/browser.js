const { chromium } = require('playwright');

async function launchBrowser(headless = false) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, page };
}

module.exports = { launchBrowser };
