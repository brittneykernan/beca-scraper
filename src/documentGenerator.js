const fs = require('fs').promises;
const path = require('path');

/**
 * Format date string as "Month Day, Year, DayOfWeek"
 * @param {string} dateString - Date string (e.g., "2026-01-12" or "01/12/2026")
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time as "HH:MM AM/PM - HH:MM AM/PM" (30-min block)
 * @param {string} timeString - Time string (e.g., "8:30 AM" or "08:30")
 * @returns {string} - Formatted time block
 */
function formatTimeBlock(timeString) {
  if (!timeString) return '';
  
  // Parse the time
  const time = parseTime(timeString);
  if (!time) return timeString;
  
  // Format start time
  const startTime = formatTime(time.hours, time.minutes);
  
  // Add 30 minutes for end time
  let endHours = time.hours;
  let endMinutes = time.minutes + 30;
  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes -= 60;
  }
  const endTime = formatTime(endHours, endMinutes);
  
  return `${startTime} - ${endTime}`;
}

/**
 * Parse time string into hours and minutes
 * @param {string} timeString - Time string in various formats
 * @returns {object|null} - {hours, minutes} or null if invalid
 */
function parseTime(timeString) {
  if (!timeString) return null;
  
  // Handle formats like "8:30 AM", "08:30", "8:30:00"
  const match = timeString.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  
  // Convert to 24-hour format if AM/PM specified
  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

/**
 * Format hours and minutes as "H:MM AM/PM"
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @returns {string} - Formatted time
 */
function formatTime(hours, minutes) {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Group cases by date and time
 * @param {Array} cases - Array of case objects
 * @returns {object} - Object with dates as keys, each containing time blocks
 */
function groupCasesByDateAndTime(cases) {
  const grouped = {};
  
  cases.forEach(caseData => {
    // Extract date - try different possible field names
    const dateKey = caseData['Date'] || caseData['Court Date'] || caseData['Hearing Date'] || caseData.date;
    if (!dateKey) return;
    
    // Extract time - try different possible field names
    const timeKey = caseData['Time'] || caseData['Court Time'] || caseData['Hearing Time'] || caseData.time;
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = {};
    }
    
    // Use time or 'Unknown' as key
    const time = timeKey || 'Unknown';
    if (!grouped[dateKey][time]) {
      grouped[dateKey][time] = [];
    }
    
    grouped[dateKey][time].push(caseData);
  });
  
  // Sort times within each date
  Object.keys(grouped).forEach(date => {
    const times = Object.keys(grouped[date]);
    const sortedTimes = times.sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      const timeA = parseTime(a);
      const timeB = parseTime(b);
      if (!timeA || !timeB) return a.localeCompare(b);
      if (timeA.hours !== timeB.hours) return timeA.hours - timeB.hours;
      return timeA.minutes - timeB.minutes;
    });
    
    const sorted = {};
    sortedTimes.forEach(time => {
      sorted[time] = grouped[date][time];
    });
    grouped[date] = sorted;
  });
  
  return grouped;
}

/**
 * Generate HTML document from cases data
 * @param {Array} cases - Array of case objects
 * @param {object} config - Configuration object (attorney, startDate, endDate)
 * @returns {string} - HTML string
 */
function generateHTML(cases, config) {
  if (!cases || cases.length === 0) {
    return generateEmptyHTML(config);
  }
  
  const grouped = groupCasesByDateAndTime(cases);
  const dates = Object.keys(grouped).sort();
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Court Calendar - ${config.attorney || 'Cases'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 0.5in;
    }
    
    .date-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .date-header {
      font-size: 14pt;
      font-weight: normal;
      background-color: #d3d3d3;
      padding: 8px 12px;
      margin-bottom: 5px;
    }
    
    .day-of-week {
      font-size: 12pt;
      font-weight: normal;
      margin-bottom: 15px;
    }
    
    .time-block {
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    
    .time-header {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .case-entry {
      margin-left: 30px;
      margin-bottom: 4px;
      font-size: 11pt;
      white-space: pre;
    }
    
    .defendant-name {
      display: inline-block;
      min-width: 200px;
    }
    
    .case-id {
      display: inline-block;
      min-width: 120px;
    }
    
    .charge-status {
      display: inline-block;
      min-width: 80px;
    }
    
    .officer-name {
      display: inline-block;
      text-align: right;
      float: right;
      min-width: 180px;
    }
    
    .hearing-type {
      margin-left: 15px;
      margin-bottom: 5px;
      font-size: 11pt;
    }
    
    @media print {
      @page {
        size: letter;
        margin: 0.75in;
      }
      
      body {
        padding: 0;
      }
      
      .date-section {
        page-break-after: always;
        margin-bottom: 0;
      }
      
      .date-section:last-child {
        page-break-after: auto;
      }
      
      .time-block {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
`;
  
  dates.forEach(date => {
    const formattedDate = formatDate(date);
    // formatDate returns "DayOfWeek, Month Day, Year" (e.g., "Tuesday, January 13, 2026")
    // Split by comma: ["DayOfWeek", " Month Day", " Year"]
    const dateParts = formattedDate.split(',');
    // Join middle and last parts for date with year: "Month Day, Year"
    const dateOnly = dateParts.length >= 3 
      ? (dateParts[1].trim() + ',' + dateParts[2].trim())
      : dateParts.length >= 2 
        ? (dateParts[0].trim() + ',' + dateParts[1].trim())
        : dateParts[0].trim();
    // First part is day of week
    const dayOfWeek = dateParts.length >= 1 ? dateParts[0].trim() : '';
    
    html += `  <div class="date-section">
    <div class="date-header">${dateOnly}</div>
    <div class="day-of-week">${dayOfWeek}</div>
`;
    
    const times = Object.keys(grouped[date]);
    times.forEach(time => {
      const timeBlock = time !== 'Unknown' ? formatTimeBlock(time) : 'Time TBD';
      html += `    <div class="time-block">
      <div class="time-header">${timeBlock}</div>
      <div class="hearing-type">Tr Hrg -- Viera</div>
`;
      
      grouped[date][time].forEach((caseData) => {
        const caseNumber = caseData['Case Number'] || caseData['Case #'] || caseData.caseNumber || 'N/A';
        const defendantName = caseData['Defendant Name'] || caseData.defendantName || 'N/A';
        const officerName = caseData['Officer Name'] || caseData.officerName || 'N/A';
        const placeholderId = caseData.placeholderId || 'AXXXXX';
        const annotation = caseData.annotation || '---';
        
        // Format: Defendant Name | Case ID | Charge/Status | Officer Name (right-aligned)
        html += `      <div class="case-entry">
        <span class="defendant-name">${defendantName}</span><span class="case-id">${caseNumber}</span><span class="charge-status">${annotation}</span><span class="officer-name">${officerName}</span>
      </div>
`;
      });
      
      html += `    </div>
`;
    });
    
    html += `  </div>
`;
  });
  
  html += `</body>
</html>`;
  
  return html;
}

/**
 * Generate empty HTML when no cases
 * @param {object} config - Configuration object
 * @returns {string} - HTML string
 */
function generateEmptyHTML(config) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Court Calendar - ${config.attorney || 'Cases'}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      padding: 2in;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>No cases found</h1>
  <p>No cases were found for the specified criteria.</p>
</body>
</html>`;
}

/**
 * Save HTML document to file
 * @param {string} html - HTML content
 * @param {object} config - Configuration object with startDate and endDate
 * @param {string} filename - Output filename (optional)
 * @returns {Promise<string>} - Path to saved file
 */
async function saveHTML(html, config = {}, filename = null) {
  const outputDir = path.join(__dirname, '..', 'output');
  
  // Ensure output directory exists
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  let defaultFilename;
  if (config.startDate && config.endDate) {
    // Format dates for filename: YYYY-MM-DD
    const startDate = config.startDate.replace(/-/g, '');
    const endDate = config.endDate.replace(/-/g, '');
    defaultFilename = `court-calendar-${startDate}-to-${endDate}.html`;
  } else {
    defaultFilename = `court-calendar-${new Date().toISOString().split('T')[0]}.html`;
  }
  
  const outputFile = filename || defaultFilename;
  const filePath = path.join(outputDir, outputFile);
  
  await fs.writeFile(filePath, html, 'utf-8');
  return filePath;
}

module.exports = {
  generateHTML,
  saveHTML,
  formatDate,
  formatTimeBlock,
  groupCasesByDateAndTime,
};
