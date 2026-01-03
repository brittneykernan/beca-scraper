// Wait for popup and close it if present
async function closePopupIfExists(page) {
  try {
    const popupSelector = '#signup-popup';
    const maskSelector = '#screenMask';

    // Wait briefly for popup to appear (2 seconds)
    if (await page.locator(popupSelector).isVisible({ timeout: 2000 })) {
      console.log('Popup detected, closing it...');
      // If there's a close button, click it
      const closeButton = page.locator('#signup-popup button.close, #signup-popup .close');
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
        console.log('Popup closed');
        // Wait for overlay to disappear
        await page.waitForSelector(maskSelector, { state: 'hidden', timeout: 5000 });
      } else {
        // Otherwise, hide popup with JS
        await page.evaluate(() => {
          const popup = document.querySelector('#signup-popup');
          const mask = document.querySelector('#screenMask');
          if (popup) popup.style.display = 'none';
          if (mask) mask.style.display = 'none';
        });
        console.log('Popup hidden via JS');
      }
    }
  } catch (err) {
    console.log('No popup detected, continuing...');
  }
}

module.exports = { closePopupIfExists };