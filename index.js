// Import xml reader
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");
const { join } = require("path");

function getJsonThreads() {
  // Read the XML file
  const input = fs.readFileSync(join("input", "input.xml"), "utf8");

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

    if (!threads[phoneNumber]) {
      threads[phoneNumber] = {
        from: sms["@_contact_name"],
        messages: [],
      };
    }

    // Generate unique hash
    const hash = `${phoneNumber}-${sms["@_body"]}`;
    if (set.has(hash)) {
      continue;
    }
    set.add(hash);

    threads[phoneNumber].messages.push({
      date: sms["@_readable_date"],
      body: sms["@_body"],
    });
  }

  // console.log(JSON.stringify(threads, null, 2));
  return threads;
}

function generateWebpage(threads) {
  // Create HTML content
  let htmlContent =
    "<!DOCTYPE html>\n<html>\n<head>\n<title>Message Threads</title>\n</head>\n<body>\n<h1>Message Threads</h1>\n<ul>\n";

  // Loop through phone numbers
  Object.keys(threads).forEach((phoneNumber) => {
    const contactName = threads[phoneNumber].from;
    const messages = threads[phoneNumber].messages;

    // Create list item for each phone number
    htmlContent += `<li><h3>${contactName} - ${phoneNumber}</h3>\n<ul>\n`;

    // Add messages for each phone number
    messages.forEach((message) => {
      htmlContent += `<li>${message.date} - ${message.body}</li>\n`;
    });

    htmlContent += "</ul>\n</li>\n";
  });

  // Close HTML content
  htmlContent += "</ul>\n</body>\n</html>";

  // Write HTML content to file
  fs.writeFileSync(join("output", "index.html"), htmlContent, "utf-8");
}

function main() {
  const threads = getJsonThreads();
  generateWebpage(threads);
}

main();
