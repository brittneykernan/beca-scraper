const { navigateWithCache, saveCachedHtml, getSearchResultsHtml, saveSearchResultsHtml, isCacheEnabled } = require('./htmlCache');

/**
 * Perform navigation steps to reach the search results page
 * @param {object} page - Playwright page object
 */
async function performNavigationSteps(page) {
  // Step 5: Navigate to BECA portal
  // Note: Use real navigation for pages with forms (setContent doesn't handle form submissions properly)
  const splashUrl = 'https://vmatrix1.brevardclerk.us/beca/beca_splash.cfm';
  console.log(`[Cache] Using real navigation (form page): ${splashUrl.substring(0, 50)}...`);
  await page.goto(splashUrl, { waitUntil: 'networkidle' });
  console.log('BECA page loaded');
  await page.evaluate(() => document.querySelector('input[type="Submit"], button').click());

  console.log('Accepted terms');
  await page.waitForLoadState('networkidle');
  // await page.screenshot({ path: 'step5_accept.png' });

  // Step 6: Click General Public Court Record Search
  await page.click('text=General Public Court Records'); 
  console.log('Reached final search page');
  await page.waitForLoadState('networkidle');
  // await page.screenshot({ path: 'step6_final_search.png' });

  // Step 7: Judiciary tab click
  await page.click('text=Judiciary');
  console.log('Judiciary tab clicked');
  await page.waitForLoadState('networkidle');
  // await page.screenshot({ path: 'step7_judiciary_tab.png' });

  // Step 8: Judge dropdown click
  await page.selectOption(
'select[name="judge"]',
{ label: 'TRAFFIC HEARING OFFICER' }
  );
  console.log('Judge selected');
  await page.waitForLoadState('networkidle');
  // await page.screenshot({ path: 'step8_judge_selected.png' });

  // Step 9: Start and end date input
  await page.evaluate(() => {
    const begin = document.querySelector('#begin_date');
    const end = document.querySelector('#end_date');

    begin.value = '01/12/2026';
    end.value = '01/18/2026';

    begin.dispatchEvent(new Event('change', { bubbles: true }));
    end.dispatchEvent(new Event('change', { bubbles: true }));
  });
  console.log('Start and end date inputted');
  await page.waitForLoadState('networkidle');
  // await page.screenshot({ path: 'step9_start_and_end_date_inputted.png' });

  // Step 10: Submit button click
  console.log('Clicking Submit Button...');
  await page.click('input[value="Submit"]');
  await page.waitForLoadState('networkidle');
  
  // Cache search results page HTML if caching is enabled
  try {
    const html = await page.content();
    await saveSearchResultsHtml(html);
  } catch (error) {
    // Cache save failure shouldn't break the flow
    console.warn(`[Cache] Failed to save search results HTML:`, error.message);
  }
}

async function navigateToSearchPage(page) {
  try {
    // Step 1-4 no longer needed

    // Base URL for resolving relative URLs (used when loading cached HTML)
    const baseUrl = 'https://vmatrix1.brevardclerk.us/beca';
    let currentPageUrl = baseUrl + '/Judiciary_Calendar_Search.cfm';

    // Check if cached search results exist and skip navigation if so
    if (isCacheEnabled()) {
      const cachedResultsHtml = await getSearchResultsHtml();
      if (cachedResultsHtml) {
        // Load cached search results and skip to table scraping
        await page.setContent(cachedResultsHtml, { url: currentPageUrl });
        await page.waitForLoadState('networkidle');
        console.log('[Cache] Using cached search results, skipping navigation steps');
        // Skip to Step 11 (table scraping)
      } else {
        // Cache doesn't exist, proceed with normal navigation
        console.log('[Cache] Search results cache not found, performing navigation steps');
        await performNavigationSteps(page);
        // Update currentPageUrl to actual page URL after navigation
        currentPageUrl = page.url();
      }
    } else {
      // Caching disabled, proceed with normal navigation
      await performNavigationSteps(page);
      currentPageUrl = page.url();
    }

    // Step 11: View table rows
    const resultsTable = page.locator('table.TFtable');
    const resultsTableRows = resultsTable.locator('tr');
    const rowCount = await resultsTableRows.count();
    console.log(rowCount, ' rows in table');

    // Step 11.5: Scrape table headers
    const headers = await resultsTable.locator('tr:first-child th').allInnerTexts();    

    // Step 12: Scrape table rows
    const allCases = [];
    for (let i = 1; i < rowCount; i++) {
      const row = resultsTableRows.nth(i);
      const rowData = await row.locator('td').allInnerTexts();

      // only do first row for now
      if (i < 10) {        
        // Step 13: Get the row's link
        const link = row.getByRole('link');
        if (!(await link.isVisible())) continue;

        const href = await link.getAttribute('href');
        if (!href) {
          console.warn('No href found for case link');
          continue;
        }

        // Step 14: Open case detail page
        const context = page.context();
        const casePage = await context.newPage();

        // Use currentPageUrl for relative URLs (handles cached HTML case where page.url() is 'about:blank')
        const pageUrlForResolution = page.url() !== 'about:blank' ? page.url() : currentPageUrl;
        const caseUrl = href.startsWith('http')
          ? href
          : new URL(href, pageUrlForResolution).toString();

        await navigateWithCache(casePage, caseUrl, { waitUntil: 'networkidle' });
        console.log('Case page opened:', casePage.url());

        // await page.pause()

        // Step 15: Look for Attorney's name
        const target = 'KERNAN RODNEY M';
        const tableRow = casePage.locator(`tr:has-text("${target}")`);
        if (!(await tableRow.isVisible())) continue;
        
        console.log('attorney exists')

        // Step 16: Scrape data from this page
        const defendantRow = casePage.locator('tr').filter({ hasText: 'DEFENDANT (1)' });
        const defendantName = await defendantRow.locator('td').nth(1).innerText();
        console.log('defendantName', defendantName)

        // Scrape officer/trooper/deputy name
        let officerName = 'N/A';
        try {
          // Try to find rows containing "TROOPER", "OFFICER", or "DEPUTY"
          const officerRows = casePage.locator('tr').filter({ hasText: /Officer/i });
          const officerCount = await officerRows.count();
          if (officerCount > 0) {
            // Get the first matching row's name (usually in second column)
            const firstOfficerRow = officerRows.first();
            const officerText = await firstOfficerRow.locator('td').nth(1).innerText().catch(() => '');
            if (officerText) {
              // Extract name (may include title, try to get just the name part)
              const nameMatch = officerText.match(/([A-Z\s]+)/);
              officerName = nameMatch ? nameMatch[1].trim() : officerText.trim();
            }
          }
        } catch (error) {
          console.warn('Error scraping officer name:', error.message);
        }

        // Step 17: Add case data to output data
        const caseData = {};
        // data from case list page
        for(let j = 0; j < headers.length; j++) {
          caseData[headers[j]] = rowData[j];
        }
        // data from detail page
        caseData['Defendant Name'] = defendantName;
        caseData['Officer Name'] = officerName;
        // Add placeholders
        caseData.placeholderId = 'AXXXXX';
        caseData.annotation = '---';
        allCases.push(caseData);

        await casePage.close();
      }
    }

    console.log(allCases, ' all cases in table');

    return allCases;

  } catch (err) {
    console.error('Navigation error:', err);
    throw err;
  }
}

module.exports = { navigateToSearchPage };
