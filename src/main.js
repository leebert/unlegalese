//NOTE: The Parse CloudCode + LiveQuery solution does not work for OpenAI API streaming.
//      Updates are blocked until the stream is completed and I could not figure out why,
//      even with the assistance of the Back4App team.
//      My solution was to switch over to fetch and api routing. Thanks for the guidance ChatGPT!
import './style.css'
// import Parse from 'parse/dist/parse.min.js';

const TEST_TERMS = "The Terms of Use are the entire agreement between you and Brave with respect to the Service, and supersede all prior or contemporaneous communications and proposals (whether oral, written or electronic) between you and Brave with respect to the Service. If any provision of the Terms of Use is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the Terms of Use will otherwise remain in full force and effect and enforceable. The failure of either party to exercise in any respect any right provided for herein shall not be deemed a waiver of any further rights hereunder. Brave shall not be liable for any failure to perform its obligations hereunder due to any cause beyond Brave’s reasonable control. The Terms of Use are personal to you, and are not assignable or transferable by you except with Brave’s prior written consent. Brave may assign, transfer or delegate any of its rights and obligations hereunder without consent. No agency, partnership, joint venture, or employment relationship is created as a result of the Terms of Use and neither party has any authority of any kind to bind the other in any respect. Except as otherwise provided herein, all notices under the Terms of Use will be in writing and will be deemed to have been duly given when received, if personally delivered or sent by certified or registered mail, return receipt requested; when receipt is electronically confirmed, if transmitted by facsimile or e-mail; or two days after it is sent, if sent for next day delivery by recognized overnight delivery service.";

window.onload = () => {
  // Parse.initialize(
  //   import.meta.env.VITE_B4A_APPLICATION_ID,
  //   import.meta.env.VITE_B4A_JAVASCRIPT_KEY,
  // );
  // Parse.serverURL = "https://parseapi.back4app.com/";
  // Parse.serverURL = `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}`;

  // const liveQueryClient = new Parse.LiveQueryClient({
  //   applicationId: import.meta.env.VITE_B4A_APPLICATION_ID,
  //   serverURL: import.meta.env.VITE_B4A_LIVE_SERVER_URL,
  //   javascriptKey: import.meta.env.VITE_B4A_JAVASCRIPT_KEY,
  // });
  // liveQueryClient.open();
  // const query = new Parse.Query("OpenAIResponse");
  // const subscription = liveQueryClient.subscribe(query);
  // subscription.on("update", data => {
  //   const now = new Date();
  //   console.log(now.toLocaleTimeString());
  //   res.innerHTML = data.get('response');
  // });

  const btn = document.querySelector('#btn-unlegalese');
  btn.addEventListener('click', () => {
    // startLiveQuery();
    if (hasError) {
      res.innerHTML = legaleseCopy;
      return;
    }
    // const now = new Date();
    // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
    // console.log('calling testApp')
    const thinking = document.querySelector('#thinking');
    thinking.style.display = 'block';
    streamUnlegalese(legaleseCopy);
    // testApp().then(()=>{
    //   // const now = new Date();
    //   // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
    //   // console.log('testApp completed')
    // });
    // getSummary(legaleseCopy).then(() => {
    //   console.log('getSummary completed')
    // });
  });
  getLegalese();
};

async function streamUnlegalese(message) {
  const controller = new AbortController();

  const response = await fetch(
    `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}/unlegalese-stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Parse-REST-API-Key": import.meta.env.VITE_B4A_REST_API_KEY,
        "X-Parse-Application-Id": import.meta.env.VITE_B4A_APPLICATION_ID,
      },
      credentials: "include",
      body: JSON.stringify({ message }),
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  const thinking = document.querySelector("#thinking");
  const results = document.querySelector("#results");

  thinking.style.display = "none";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        // SSE data event
        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();

          if (payload && payload !== "[DONE]") {
            try {
              results.innerHTML += JSON.parse(payload);
            } catch {
              results.innerHTML += payload;
            }
          }
        }

        // SSE done event
        if (line.startsWith("event: done")) {
          controller.abort();
          return;
        }
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Streaming error:", err);
    }
  }
}

// async function getSummary(legalCopy) {
//   try {
//     await Parse.Cloud.run("getSummary", { legalese: legalCopy });
//   } catch (e) {
//     console.log(`testOpenAI failed - ${e}`);
//   }
// };

// async function testApp() {
//   try {
//     await Parse.Cloud.run("testOpenAI");
//   } catch (e) {
//     console.log(`testOpenAI failed - ${e}`);
//   }
// };

var legaleseCopy, activeTabId;
var hasError = false;
const getLegalese = () => {
  if (!chrome.tabs) {
    console.log('not in extension mode')
    legaleseCopy = TEST_TERMS;
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
    var activeTab = tabs[0];
    activeTabId = activeTab.id;

    return chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      injectImmediately: true,
      func: getInnerHTML,
    });

  }).then(function (results) {
    hasError = false;
    legaleseCopy = results[0].result;
  }).catch(function (error) {
    hasError = true;
    legaleseCopy = 'There was an error injecting script : \n' + error.message + '\n activeTabId: ' + activeTabId;
  });
};

function getInnerHTML() {
  return document.body.innerText
}

// const startLiveQuery = async () => {
//   try {
//     const query = new Parse.Query("OpenAIResponse");

//     // const now = new Date();
//     // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
//     // console.log('📡 Connecting to LiveQuery...\n');
//     const subscription = await query.subscribe();

//     subscription.on('open', () => {
//       // const now = new Date();
//       // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
//       // console.log('✅ LiveQuery connected!\n');
//       // console.log('Waiting for updates... (press Ctrl+C to stop)\n');
//     });

//     subscription.on('update', (object) => {
//       const res = document.querySelector('#results');
//       res.innerHTML = object.get('response');
//       // const now = new Date();
//       // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
//       // console.log('   ID:', object.id);
//       // console.log('   Data:', JSON.stringify(object.toJSON(), null, 2));
//       // console.log('');
//     });

//     subscription.on('close', () => {
//       // console.log('⚠️  LiveQuery connection closed');
//     });

//     subscription.on('error', (error) => {
//       // console.error('❌ LiveQuery error:', error.message);
//     });

//   } catch (error) {
//     console.error('❌ Error:', error.message);
//     process.exit(1);
//   }
// }

// const hasLegalese = () => {
//   return false;
//   const text = document.body.innerText.toLowerCase();
//   return { tou: text.includes('terms of use'), tos: text.includes('terms of service'), tac: text.includes('terms and conditions'), pp: text.includes('privacy policy'), eula: (text.includes('end user license') || text.includes('end-user license')) }
// };