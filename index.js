const { launchBrowser } = require('./src/browser');
const { navigateToSearchPage } = require('./src/navigation');
const { isCacheEnabled } = require('./src/htmlCache');
const config = require('./src/config.json');

(async () => {
  const { browser, page } = await launchBrowser(false); // false = headed mode
  try {
    console.log('Starting BrevardClerk automation');
    console.log(`[Cache] Status: ${isCacheEnabled() ? 'ENABLED' : 'DISABLED'}`);

    // Navigation steps
    await navigateToSearchPage(page);

    // TODO: Add form filling, submission, scraping, and CSV export
    console.log('Navigation complete. Ready for next steps.');

  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
})();
