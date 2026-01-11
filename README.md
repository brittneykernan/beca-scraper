# **BrevardClerk Automation Tool**

Automates case searches on [BrevardClerk.us](https://www.brevardclerk.us/) and extracts case information for a specified attorney, judge, and date range.
This project uses **Playwright (JS)** for browser automation and is modular, easy to maintain, and testable.

---

## **Features**

* Opens BrevardClerk.us and navigates through the search pages automatically
* Configurable attorney, judge, and date range
* HTML caching for offline development (optional)
* Screenshots taken at each navigation step for testing and verification
* Modular code: easy to extend for scraping, CSV export, or report generation
* Works on **Windows, Mac, and Linux**

---

## **Requirements**

* **Node.js** (latest LTS)
* **npm** (comes with Node.js)

> Note: Playwright will download its own browser binaries automatically.

---

## **Project Structure**

```
/brevardclerk-automation
│
├─ package.json
├─ index.js           # Main script
├─ /src
│   ├─ config.json    # Editable search parameters
│   ├─ browser.js     # Browser launch & session
│   ├─ navigation.js  # Navigation through search pages
│   ├─ htmlCache.js   # HTML caching utilities
│   └─ scraper.js     # (Future) Scraping logic
├─ /html-cache        # Cached HTML files (created when caching enabled)
└─ /tests
    └─ runTests.js    # (Future) Test scripts
```

---

## **Installation**

1. **Clone or download the project folder** to your computer.
2. Open **PowerShell** (Windows) or **Terminal** (Mac) in the project folder.
3. Run:

```bash
npm install
```

* This will install the necessary dependencies and **automatically download Playwright browsers**.

---

## **Configuration**

Edit `src/config.json` to set:

```json
{
  "attorney": "Kernan Rodney",
  "judge": "Traffic Hearing Officer",
  "startDate": "2026-01-01",
  "endDate": "2026-01-07"
}
```

* **attorney** → Name to search for
* **judge** → Judge dropdown selection
* **startDate / endDate** → Date range for court calendar

---

## **Running the Script**

### **Option 1: Using npm**

```bash
npm start
```

### **Option 2: Using a batch file (Windows only)**

1. Create `run-script.bat` in the project folder:

```bat
@echo off
cd /d "C:\path\to\brevardclerk-automation"
npm start
pause
```

2. Double-click the `.bat` file to run the script.
3. The console will open and the browser will launch. Screenshots are saved at each navigation step.

---

## **HTML Caching**

The tool supports HTML caching to save scraped pages to disk, allowing you to develop features against saved HTML without hitting the BECA server repeatedly.

### **Enabling Caching**

To enable HTML caching, set the `USE_HTML_CACHE` environment variable to `true`:

**On macOS/Linux:**
```bash
USE_HTML_CACHE=true npm start
```

**On Windows (PowerShell):**
```powershell
$env:USE_HTML_CACHE="true"; npm start
```

**On Windows (Command Prompt):**
```cmd
set USE_HTML_CACHE=true && npm start
```

### **How It Works**

* **First run (with caching enabled)**: The script fetches HTML from the BECA server and saves it to the `html-cache/` directory
* **Subsequent runs (with caching enabled)**: The script uses cached HTML instead of making live server requests
* **With caching disabled (default)**: The script always fetches fresh HTML from the server

### **Cache Directory**

* Cached HTML files are stored in the `html-cache/` directory (automatically created when caching is enabled)
* Files are named using MD5 hashes of URLs for filesystem safety
* The `html-cache/` directory is automatically ignored by git (already in `.gitignore`)

### **Use Cases**

* **Development**: Speed up development by avoiding repeated server requests
* **Testing**: Test scraping logic against consistent HTML snapshots
* **Offline Development**: Develop features even when the BECA server is unavailable

---

## **First-Time Notes**

* If you get an error like `Executable doesn't exist`, run:

```bash
npx playwright install
```

* This ensures all required browsers are downloaded.

> With the `postinstall` script in `package.json`, this step is automatic after `npm install`.

---

## **Screenshots & Testing**

* Screenshots are automatically taken for each navigation step:

  * `step1_home.png`
  * `step2_public_records.png`
  * …
  * `step6_final_search.png`
* Verify each screenshot to confirm the script successfully navigated the site.

---

## **Future Enhancements**

* Fill out search form and submit automatically
* Scrape results table for attorney matches
* Export results to CSV with a file name like:

```
<attorney>_<judge>_<startDate>_to_<endDate>.csv
```

* Multi-attorney support
* Generate printable PDF reports
* GUI interface for easier use

---

## **Support**

If you run into issues:

* Make sure Node.js LTS is installed
* Make sure dependencies are installed via `npm install`
* Ensure your internet connection allows access to `https://www.brevardclerk.us/`
* Check console logs for errors — screenshots are saved for debugging

---

I can also **update the project folder to include this README** and the `postinstall` script in `package.json` so your dad literally just runs `npm install` and `npm start` — no manual Playwright steps needed.

Do you want me to do that next?
