// Step: Accept and Submit / General Public Court Record Search
async function clickSubmit(page) {
  // Step: click third input (Submit button)
try {
  const thirdInput = page.locator('input').nth(2);
  await thirdInput.scrollIntoViewIfNeeded();
  await thirdInput.click({ force: true });
  console.log('Clicked the third input successfully');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'step_submit.png' });
} catch (err) {
  console.warn('Playwright click failed, using JS fallback', err);
  await page.evaluate(() => {
    const allInputs = document.querySelectorAll('input');
    if (allInputs.length >= 3) allInputs[2].click();
  });
  await page.waitForLoadState('networkidle');
}
}

module.exports = { clickSubmit };