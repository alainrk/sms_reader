// Import xml reader
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");
const { join } = require("path");
const dayjs = require("dayjs");

function getTimestamp(date) {
  const customParseFormat = require("dayjs/plugin/customParseFormat");
  dayjs.extend(customParseFormat);
  dayjs.locale({
    name: "it",
    weekdays: "Domenica_Lunedì_Martedì_Mercoledì_Giovedì_Venerdì_Sabato".split(
      "_"
    ),
    months: "gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic".split("_"),
  });

  const parsedDate = dayjs(date, "DD/MMM/YYYY HH:mm:ss", "it");

  // Convert to timestamp
  const timestamp = parsedDate.unix();
  const [day, time] = parsedDate.format("DD/MM/YYYY HH:mm").split(" ");
  const dayMonth = parsedDate.format("DD/MM");
  const dayTime = parsedDate.format("DD HH:mm");
  const month = parsedDate.format("MMM");
  const monthYear = parsedDate.format("MMM/YYYY");
  return {
    day,
    time,
    dayMonth,
    dayTime,
    month,
    monthYear,
    timestamp,
  };
}

function getJsonThreads() {
  // Read the XML file
  const input = fs.readFileSync(
    join("..", "..", "Desktop", "input", "all.xml"),
    "utf8"
  );
  const set = new Set();
  const threads = {};

  // Read the XML file
  const parser = new XMLParser({
    ignoreAttributes: false,
  });
  let json = parser.parse(input);

  for (const sms of json.smses.sms) {
    // Remove +39 prefix
    const phoneNumber = sms["@_address"].replace("+39", "");

    // Get timestamp from format 09/gen/2013 00:16:14

    if (!threads[phoneNumber]) {
      threads[phoneNumber] = {
        number: phoneNumber,
        from: sms["@_contact_name"],
        messages: [],
      };
    }

    // Generate unique hash and avoid duplicates
    const hash = `${phoneNumber}-${sms["@_body"]}`;
    if (set.has(hash)) {
      continue;
    }
    set.add(hash);

    const times = getTimestamp(sms["@_readable_date"]);

    threads[phoneNumber].messages.push({
      type: sms["@_type"] === "1" ? "received" : "sent",
      date: sms["@_readable_date"],
      body: sms["@_body"],
      ...times,
    });
  }

  // Sort messages by date
  for (const phoneNumber in threads) {
    threads[phoneNumber].messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }

  threadsArray = Object.values(threads);

  // Sort threads by name
  threadsArray.sort((a, b) => {
    return a.from.localeCompare(b.from);
  });

  return threadsArray;
}

function generateWebpage(threads) {
  // Create HTML content
  let htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
  <title>Message Threads</title>
  <style>
    /* Style for the collapsible content */
    .collapsible-content {
      display: none;
      padding: 10px;
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      margin-top: 5px;
    }

    /* Style for the collapsible button */
    .collapsible-button {
      background-color: #3498db;
      color: white;
      cursor: pointer;
      padding: 10px;
      width: 100%;
      border: none;
      text-align: left;
      outline: none;
    }

    /* Change color of button on hover */
    .collapsible-button:hover {
      background-color: #2980b9;
    }
  </style>
  </head>
  <body>
  <h1>Message Threads</h1>
  <ul>
  `;

  // Loop through phone numbers
  let id = 1;
  threads.forEach((thread) => {
    const phoneNumber = thread.number;
    const contactName = thread.from;
    const messages = thread.messages;

    let header = `${contactName} (${phoneNumber})`;
    if (contactName === "(Unknown)") {
      header = phoneNumber;
    }

    htmlContent += `<button class="collapsible-button" onclick="toggleCollapsible('content${id}')">
      ${header}    [${messages.length}]
    </button>`;
    htmlContent += `<div class="collapsible-content" id="content${id}">`;
    id++;

    // Create list item for each phone number
    htmlContent += `<ul>`;

    // Add messages for each phone number
    let lastDay = "";
    messages.forEach((message) => {
      if (lastDay !== message.day) {
        htmlContent += `<h4>${message.day}</h4>`;
        lastDay = message.day;
      }
      const user = message.type === "sent" ? "Alain" : contactName;
      htmlContent += `<li>[${user} - ${message.time}]: ${message.body}</li>\n`;
    });

    htmlContent += "</ul>";

    htmlContent += `</div>`;
  });

  // Close HTML content
  htmlContent += `</ul>
  <script>
  // Function to toggle collapsible content
  function toggleCollapsible(contentId) {
    var content = document.getElementById(contentId);
    // Toggle the display of the content
    if (content.style.display === 'block') {
      content.style.display = 'none';
    } else {
      content.style.display = 'block';
    }
  }
  </script>
  </body>
  </html>`;

  // Write HTML content to file
  fs.writeFileSync(join("output", "index.html"), htmlContent, "utf-8");
}

function main() {
  const threads = getJsonThreads();
  generateWebpage(threads);
}

main();
