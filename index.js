/**
 * AI SDR: Searches for contacts in a selected cell range
 * And returns nicely formatted results
 * Author: Philipp Tsipman
 */

// INPUTS

// Contact info to search for
const INFO =
  "Full Name, Email, Full LinkedIn Web URL, Twitter Handle, Employer's Name, Job Title, Employer's Website, and Contact's Bio";

const OPENAI_API_KEY = ""; //ADD YOUR OPEN AI API KEY HERE
const PERPLEXITY_API_KEY = ""; //ADD YOUR PERPLEXITY API KEY HERE
const GOOGLE_API_KEY = ""; //ADD YOUR GOOGLE API KEY HERE
const CUSTOM_SEARCH_ENGINE = ""; //ADD YOUR GOOGLE CUSTOM SEARCH ENGINE ID HERE. Takes a minute to create one: https://programmablesearchengine.google.com/controlpanel/all

// ------------------------------ //

// CONSTANTS
const SEARCH_SYSTEM_PROMPT =
  "Respond in this format: A bulleted list: " +
  INFO +
  ".   If certain information is not available, leave that part blank. No not write (not found in search results). If you don't find information on the first try, try again. You can do it.";
const SEARCH_QUERY_PROMPT = "who is ";

const FORMAT_SYSTEM_PROMPT =
"Format this text precisely in this format: A bulleted list: " +
INFO +
".  If certain information is not available, leave that part blank. Do not write 'Not available' or 'Not provided'. Provide URLs as is, do not format them as markdown. If you can't do it on the first try, try again. You can do it.";

// Default = PERPLEXITY_70_MODEL for smarts and OPEN_AI_35_MODEL for speed
const OPENAI_35_MODEL = "gpt-3.5-turbo-1106";
const OPENAI_4_MODEL = "gpt-4-1106-preview";
const PERPLEXITY_7_MODEL = "pplx-7b-online";
const PERPLEXITY_70_MODEL = "pplx-70b-online";

const MAX_TOKENS = 400;

// FUNCTIONS

function cleanContact(str) {
  if (
    str.toLowerCase().includes("not provided") ||
    str.toLowerCase().includes("not available") ||
    str.toLowerCase().includes("not applicable")
  ) {
    return "";
  }

  // Fake URL
  if (str.match(/\[[a-zA-Z\s]+\]\([a-zA-Z\s]+(URL|Website)\)/i)) {
    return ""
  }

  // Clean URL
  if (str.match(/\[[a-zA-Z\d*\',\s]+\]\(((https?:?\/\/)?[^\s)]+)\)/)) {
    return str.match(/\[[a-zA-Z\d*\',\s]+\]\(((https?:?\/\/)?[^\s)]+)\)/)[1];
  }

  return str;
}

// Format contact into a JSON object
function formatContact(contact) {
  const contactArray = contact.split("\n");
  let foundContact = {};
  contactArray.forEach((line) => {
    const lineArray = line.split(": ");
    // If the string contains: "Full Name: ", then split by ": " and save the second part as full_name key in foundContact
    if (line.includes("Full Name: ")) {
      foundContact["full_name"] = cleanContact(lineArray[1]);
    } else if (line.includes("Email: ")) {
      foundContact["email"] = cleanContact(lineArray[1]);
    } else if (line.includes("Full LinkedIn Web URL: ")) {
      foundContact["linkedin"] = cleanContact(lineArray[1]);
    } else if (line.includes("Twitter Handle: ")) {
      foundContact["twitter"] = cleanContact(lineArray[1]);
    } else if (line.includes("Employer's Name: ")) {
      foundContact["employer"] = cleanContact(lineArray[1]);
    } else if (line.includes("Job Title: ")) {
      foundContact["job_title"] = cleanContact(lineArray[1]);
    } else if (line.includes("Employer's Website: ")) {
      foundContact["employer_website"] = cleanContact(lineArray[1]);
    } else if (line.includes("Contact's Bio: ")) {
      foundContact["bio"] = cleanContact(lineArray[1]);
    }
  });
  console.log(foundContact);
  return foundContact;
}

// Google search
async function googleSearch(
  query = "Philipp Tsipman",
  siteSearch = "twitter.com"
) {
  const url =
    "https://www.googleapis.com/customsearch/v1?" +
    "key=" +
    GOOGLE_API_KEY +
    "&cx=" +
    CUSTOM_SEARCH_ENGINE +
    "&q=" +
    query +
    "&num=1" +
    "&siteSearch=" +
    siteSearch +
    "&siteSearchFilter=i";

  try {
    const response = JSON.parse(UrlFetchApp.fetch(url).getContentText());
    let data = "";
    if (response && response.items && response.items.length > 0) {
      data = response.items[0].link;
    }
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// LLM API call
async function llm(
  url = "https://api.perplexity.ai/chat/completions",
  model = PERPLEXITY_70_MODEL,
  key = PERPLEXITY_API_KEY,
  systemPrompt = SEARCH_SYSTEM_PROMPT,
  userPrompt = SEARCH_QUERY_PROMPT + prompt,
  max_tokens = MAX_TOKENS
  // url = "https://api.openai.com/v1/chat/completions",
  // model = OPENAI_35_MODEL,
  // key = OPENAI_API_KEY,
  // systemPrompt = FORMAT_SYSTEM_PROMPT,
  // userPrompt = prompt,
  // max_tokens = MAX_TOKENS
) {
  // request
  const request = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: "Bearer " + key,
    },
    payload: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens,
    }),
  };

  // connect to the LLM API, sending the request and parse the JSON response
  try {
    const response = JSON.parse(
      UrlFetchApp.fetch(url, request).getContentText()
    );
    return response.choices[0].message.content;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function SearchContact(prompt, sheet, row, lastCol) {
    try {
      let email = "";
      email = prompt.match(/\S+@\S+\.\S+/);

      let foundContact = await llm(
        "https://api.perplexity.ai/chat/completions",
        PERPLEXITY_70_MODEL,
        PERPLEXITY_API_KEY,
        SEARCH_SYSTEM_PROMPT,
        SEARCH_QUERY_PROMPT + prompt,
        MAX_TOKENS
      );

      let llmFormattedContact = await llm(
        "https://api.openai.com/v1/chat/completions",
        OPENAI_35_MODEL,
        OPENAI_API_KEY,
        FORMAT_SYSTEM_PROMPT,
        foundContact,
        MAX_TOKENS
      );

      let finalFormatedContact = formatContact(llmFormattedContact);

      let [linkedin,twitter] = Promise.all([googleSearch(prompt, "linkedin.com",googleSearch(prompt, "twitter.com"))]);
      let employer_website = "";
      if (finalFormatedContact["employer"] !== "" && finalFormatedContact["employer_website"] == "") {
        employer_website = await googleSearch(finalFormatedContact["employer"] + " website", "");
      }

      sheet.getRange(row, lastCol + 1).setValue(finalFormatedContact["full_name"]);
      if (email !== "") {
        sheet.getRange(row, lastCol + 2).setValue(email);
      } else {
        sheet.getRange(row, lastCol + 2).setValue(finalFormatedContact["email"]);
      }
      if (linkedin !== "") {
        sheet.getRange(row, lastCol + 3).setValue(linkedin);
      } else {
        sheet.getRange(row, lastCol + 3).setValue(finalFormatedContact["linkedin"]);
      }

      if (twitter !== "") {
        sheet.getRange(row, lastCol + 4).setValue(twitter);
      } else {
        sheet.getRange(row, lastCol + 4).setValue(finalFormatedContact["twitter"]);
      }
      sheet.getRange(row, lastCol + 5).setValue(finalFormatedContact["employer"]);
      sheet.getRange(row, lastCol + 6).setValue(finalFormatedContact["job_title"]);
      if (employer_website !== "") {
        sheet.getRange(row, lastCol + 7).setValue(employer_website);
      } else {
        sheet.getRange(row, lastCol + 7).setValue(finalFormatedContact["employer_website"]);
      }
      if (finalFormatedContact["bio"] === "") {
        sheet.getRange(row, lastCol + 8).setValue(foundContact);
      } else {
        sheet.getRange(row, lastCol + 8).setValue(finalFormatedContact["bio"]);
      }
      sheet.getRange(row, lastCol + 9).setValue(foundContact);
    } catch (error) {
      throw new Error(error);
    }
}

async function SearchContacts() {
  // Get selected cell range with prompts
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const range = sheet.getActiveRange(); // get the selected range
  const values = range.getValues();

  const firstRow = range.getRow(); // get first row number
  const lastCol = range.getLastColumn(); // get last column number

  // Run model on each prompt
  let promises = [];

  for (let i = 0; i < values.length; i++) {
    const row = firstRow + i; // row number
  
    let prompt = values[i][0]; // get the prompt from the first column of the selected row
  
    // If the prompt is not empty
    if (prompt !== "") {
      promises.push(SearchContact(prompt, sheet, row, lastCol));
    }
  }
  
  Promise.all(promises)

  return 1;
}
