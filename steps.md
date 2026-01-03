### **Step 1: Project Setup (Windows Friendly)**

* Initialize Node.js project:

  ```bash
  npm init -y
  npm install -D playwright
  ```
* For CSV export (later step):

  ```bash
  npm install csv-writer
  ```
* Project structure:

  ```
  /src
    /config
    /scrapers
    /utils
    /tests
  index.js
  ```
* Test: Open BrevardClerk.us home page with Playwright and check it loads.

  ```js
  const { chromium } = require('playwright');

  (async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.brevardclerk.us/');
    console.log(await page.title());
    await browser.close();
  })();
  ```

---

### **Step 2: Config Management**

* Config file `config.json`:

```json
{
  "attorney": "Kernan Rodney",
  "judge": "Traffic Hearing Officer",
  "startDate": "2026-01-01",
  "endDate": "2026-01-07"
}
```

* Test: `console.log(config)` → verify values load correctly.

---

### **Step 3: Navigate to Search Page (Discrete Steps)**

1. Go to home page → verify unique selector exists.
2. Click **Public Records Search** → verify next page.
3. Click **Case Search** → verify page.
4. Click **General Public Record Search** → verify page.
5. Click **Accept and Submit** → verify final search page.
6. Click **General Public Court Record Search** → verify ready for input.

* Test each step:

  * Check that expected selector exists.
  * Take screenshot (`page.screenshot({ path: 'step1.png' })`) for visual confirmation.

---

### **Step 4: Fill Search Form**

* Enter **Judiciary tab**, select judge, start/end date.
* Test:

  * Verify dropdown value matches config.
  * Verify date fields match config.

---

### **Step 5: Submit Search**

* Click **Submit**.
* Wait for results table.
* Handle “No records found” gracefully.
* Test: Confirm table exists or log “No records”.

---

### **Step 6: Scrape Results Table**

* Iterate rows.
* Click into details page for each row.
* Check **Participants → Name** column for attorney.
* Collect required data:

  * Defendant Name
  * Case Number
  * Court Date
  * Court Time
  * Location
  * Case Title
* Test: Print collected data to console to verify correctness.

---

### **Step 7: Export CSV**

* Install CSV package:

  ```bash
  npm install csv-writer
  ```
* Name file using variables: `<attorney>_<judge>_<startDate>_to_<endDate>.csv`
* Test: Open CSV → confirm correct columns and rows.

---

### **Step 8: Modularization**

* Split into modules for maintainability:

  * `browser.js` → browser/session management
  * `navigation.js` → navigation steps
  * `formFiller.js` → fill search form
  * `scraper.js` → parse table and extract data
  * `csvExporter.js` → export to CSV
  * `config.js` → load config
* Test: Each module independently.

---

If you want, the next step can be **writing the first Playwright JS skeleton** that:

1. Loads config
2. Launches browser
3. Goes through each discrete navigation step to the search page
4. Takes screenshots at each step to confirm

This will give you something **immediately testable on your dad’s Windows machine**.

Do you want me to write that skeleton next?
