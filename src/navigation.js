const { closePopupIfExists } = require('./closePopup');
const { clickSubmit } = require('./clickSubmit');

async function navigateToSearchPage(page) {
  try {
    // Step 1: Home page
    // await page.goto('https://www.brevardclerk.us/');
    // console.log('Home page loaded');
    // await page.screenshot({ path: 'step1_home.png' });

    // // Step 1.5: Close popup if exists
    // await closePopupIfExists(page);

    // // Step 2: Click Public Records Search
    // await page.click('text=Public Records Search');
    // console.log('Public Records Search clicked');
    // await page.waitForLoadState('networkidle');
    // await page.screenshot({ path: 'step2_public_records.png' });

    // // Step 3: Click Case Search
    // await page.click('text=Case Search');
    // console.log('Case Search clicked');
    // await page.waitForLoadState('networkidle');
    // await page.screenshot({ path: 'step3_case_search.png' });

    // // Step 4: Click General Public Record Search
    // await page.click('text=BECA - General Public Court Records Search');
    // console.log('General Public Record Search clicked');
    // await page.waitForLoadState('networkidle');
    // await page.screenshot({ path: 'step4_general_public.png' });

    await page.goto('https://vmatrix1.brevardclerk.us/beca/beca_splash.cfm')
    console.log('BECA page loaded');
    await page.waitForLoadState('networkidle')
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
    await page.click('input[value="Submit"]');
    console.log('Submit button clicked');
    await page.waitForLoadState('networkidle');
    // await page.screenshot({ path: 'step10_submit_button_clicked.png' });  

    // Step 11: View table rows
    const resultsTable = page.locator('table.TFtable');
    const resultsTableRows = resultsTable.locator('tr');
    const rowCount = await resultsTableRows.count();
    console.log(rowCount, ' rows in table');
    // await page.screenshot({ path: 'step11_results_table_scraped.png' });

    // Step 11.5: Scrape table headers
    const headers = await resultsTable.locator('tr:first-child th').allInnerTexts();
    const normalizedHeaders = headers.map(h =>
      h
        .trim()
        // .toLowerCase()
        // .replace(/\s+/g, '_')
        // .replace(/[^a-z0-9_]/g, '')
    );
    console.log(normalizedHeaders, ' headers in table');
    

    // Step 12: Scrape table rows
    const allCases = [];
    for (let i = 1; i < rowCount; i++) {
      const row = resultsTableRows.nth(i);
      const rowData = await row.locator('td').allInnerTexts();

      const caseData = {};
      for(let j = 0; j < headers.length; j++) {
        caseData[headers[j]] = rowData[j];
      }
      allCases.push(caseData);
    }

    console.log(allCases, ' all cases in table');

  } catch (err) {
    console.error('Navigation error:', err);
    throw err;
  }
}

module.exports = { navigateToSearchPage };
