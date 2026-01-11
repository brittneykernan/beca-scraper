const { exec } = require('child_process');
const { promisify } = require('util');
const { launchBrowser } = require('./src/browser');
const { navigateToSearchPage } = require('./src/navigation');
const { isCacheEnabled } = require('./src/htmlCache');
const { generateHTML, saveHTML } = require('./src/documentGenerator');
const config = require('./src/config.json');

const execAsync = promisify(exec);

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
      const filePath = await saveHTML(html, config);
      console.log(`HTML document saved to: ${filePath}`);
      
      // Open HTML file in browser
      try {
        const fileUrl = `file://${filePath}`;
        if (process.platform === 'darwin') {
          // macOS
          await execAsync(`open "${fileUrl}"`);
        } else if (process.platform === 'win32') {
          // Windows
          await execAsync(`start "" "${fileUrl}"`);
        } else {
          // Linux
          await execAsync(`xdg-open "${fileUrl}"`);
        }
        console.log('HTML document opened in browser');
      } catch (error) {
        console.warn('Could not open HTML file in browser:', error.message);
      }
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
