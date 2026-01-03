Perfect — this is a very clear starting point. Let's plan this as a **structured automation project** using modern web automation tools. I’ll break this down carefully, step by step.

---

## Step 0: Existing Tools Check

Before building anything, there **are tools that can record and replay browser sessions**:

### No-Code / Low-Code Options

1. **UI.Vision RPA** (browser extension)

   * Can record clicks, form fills, table reads.
   * Can export CSV.
   * Can run on-demand or on a schedule (with some setup).
   * Good for a semi-technical person.
   * Limitation: editing complex logic is harder.

2. **iMacros for Chrome/Firefox**

   * Old but reliable for repetitive browser tasks.
   * Can export to CSV.
   * Logic editing is clunky, but okay for fixed workflows.

3. **Playwright Recorder / Selenium IDE**

   * Can **record a session and export a script** (Python or JavaScript) that is fully editable.
   * This is closer to a developer tool — perfect for SOLID-principled maintainable code.
   * Handles dynamic pages better than UI.Vision or iMacros.
   * Can include waits, table scraping, conditional logic.

**✅ Recommendation:** Since your dad is technical and you want maintainability, **start with Playwright (Python or Node.js)**. It can do everything, is scriptable, and can later be turned into a scheduled job or GUI.

---

## Step 1: Define the Tasks Precisely

From your description, the steps are:

1. Visit BrevardClerk.us → bypass popups.
2. Navigate:

   ```
   Public Records Search → Case Search → General Public Record Search → Accept → General Public Court Record Search
   ```
3. Search Future Court Calendars:

   * Tab: Judiciary
   * Judge: "Traffic Hearing Officer"
   * Dates: Start of week → End of week (editable)
4. Submit search → wait for results table.
5. Iterate through all rows:

   * Check if “Kernan Rodney” appears under **Participants → Name**.
   * Store data if true:

     * Defendant name (first row with Type = Defendant)
     * Case number
     * Court date
     * Court time
     * Location
     * Case title
6. Save everything into a CSV.
7. Future: generate printable document from CSV.

---

## Step 2: Tooling Choice

* **Language:** Python (easy CSV, simple syntax, wide support)
* **Automation framework:** Playwright (or Selenium if preferred)
* **CSV handling:** Python `csv` or `pandas`
* **Future GUI (optional):** Tkinter or Electron later.

---

## Step 3: Architecture & Maintainability

We want **SOLID principles**:

1. **Single Responsibility:**

   * Navigator → handles navigation and clicks.
   * Scraper → handles extracting table data.
   * CSVExporter → handles CSV creation.
   * Config → handles search parameters (judge, dates, attorney).

2. **Open/Closed:**

   * Can extend to other attorneys without changing core logic.
   * Can extend to different judges or calendars.

3. **Dependency Inversion:**

   * Code interacts with abstract “BrowserSession” or “TableParser,” not Playwright directly.

4. **Easy Testing:**

   * We can mock search results pages to test CSV export without hitting the site.

---

## Step 4: Configuration

* **Config file (JSON or YAML)**:

```json
{
  "attorney": "Kernan Rodney",
  "judge": "Traffic Hearing Officer",
  "start_date": "2026-01-01",
  "end_date": "2026-01-07"
}
```

* Easy to change without touching code.

---

## Step 5: Workflow for Script

1. Load config.
2. Start browser session.
3. Navigate to BrevardClerk.us → bypass popups.
4. Navigate through the steps to the search page.
5. Fill search form using config.
6. Submit → wait for table load.
7. Parse table → filter for attorney.
8. Extract data → map to CSV columns.
9. Write CSV.
10. Close browser.

---

## Step 6: Future Enhancements

* GUI for dates and attorney selection.
* Automatic weekly runs → generate CSV and email.
* Multi-attorney support → search list of attorneys.
* Printable report generation (PDF) from CSV.

---

## Step 7: Next Step

If you want, we can **start building a Python Playwright skeleton** that:

* Launches the browser
* Navigates through BrevardClerk.us to the search page
* Inputs a judge and date range from config
* Submits search and waits for results

This will be **the first working step**, and from there we can add table scraping and CSV export.

---

I can draft the **first Python script skeleton** for this today — it will be clean, modular, and ready for extensions.

Do you want me to do that next?
