const { launchBrowser } = require('./src/browser');
const { navigateToSearchPage } = require('./src/navigation');
const { isCacheEnabled } = require('./src/htmlCache');
const { generateHTML, saveHTML } = require('./src/documentGenerator');
const config = require('./src/config.json');

(async () => {
  const { browser, page } = await launchBrowser(false); // false = headed mode
  try {
    console.log('Starting BrevardClerk automation');
    console.log(`[Cache] Status: ${isCacheEnabled() ? 'ENABLED' : 'DISABLED'}`);

    // Navigation and scraping
    const cases = await navigateToSearchPage(page);
    
    console.log(`Scraped ${cases.length} cases`);

    // Generate HTML document
    if (cases.length > 0) {
      console.log('Generating HTML document...');
      const html = generateHTML(cases, config);
      const filePath = await saveHTML(html);
      console.log(`HTML document saved to: ${filePath}`);
    } else {
      console.log('No cases found to generate document');
    }

    console.log('Navigation complete.');

  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
})();
