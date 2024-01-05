# AI SDR
Researches partial contacts in a Google Sheet and returns nicely formatted results

## Motivation
We got a ton of new platform users at [Camcorder AI](https://github.com/camcorderai) and it's felt like a huge miss that we know little about them other than their email. Let's try to learn what's publicly known about them.

## How it works

### 1. Copy example Google Sheet

Go here https://docs.google.com/spreadsheets/d/1wnsMl9OC5aNgq32-ooJmbRcJj1qRdqAGYybpDvBTKXU/edit?usp=sharing and click File, "Make a Copy" and then button "Make a Copy".

### 2. Paste in your data
Paste in your partial contacts. Add as much info on them as you know to disambiguate common names.

The input column combines all this info together. The formula is like this: =CONCATENATE(A2," ",B2, " ",D2)

### 3. Get your API keys
Grab API keys for:

* Perplexity - for the research: https://docs.perplexity.ai/docs/getting-started
* Google Site Search - to find LinkedIn & Twitter profiles & websites: https://developers.google.com/custom-search/v1/introduction
* OpenAI - for exact formatting: https://platform.openai.com/api-keys

Create a Google Programmable Search Engine. It takes 30 sec. Go here: https://programmablesearchengine.google.com/controlpanel/create. Type in Google for the engine name, and select "Search the entire web" option. On the next page it will show you the cx id. Write that down.

### 4. Add your keys
In Google Sheets, click on Extensions menu, and Apps Script. In the script you see, add your API keys and cx id at the top. 

Click "Run" and approve the permissions. Now, close Apps Script.

### 5. Run it
Now select some input cells and click on Extensions menu, Macros, and SearchContacts.

Wait for the script to run, then the new data will populate to the right of your selected input cells.

## Cost & speed
It costs $0.02 per contact. And runs at 10 contacts/min.

## Manual install (completely optional)
If you don't want to use the example Google Sheet, here's how to install AI SDR manually. Modify step 4:

In Google Sheets, click on Extensions menu, and Apps Script.  Paste in this script: https://github.com/philtsip/aisdr/blob/main/index.js And add your API keys and cx id at the top. Click Save.

Click "Run" and approve the permissions. Now, close Apps Script.

In Google Sheets, click on Extensions menu, Macros, and Import Macro. Select SearchContacts.

Now go to step 5.

That's all.


