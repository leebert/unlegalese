import './style.css'
import Parse from 'parse/dist/parse.min.js';

window.onload = () => {
  Parse.initialize(
    import.meta.env.VITE_B4A_APPLICATION_ID,
    import.meta.env.VITE_B4A_JAVASCRIPT_KEY,
  );
  // Parse.serverURL = "https://parseapi.back4app.com/";
  Parse.serverURL = `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}`;

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
  const res = document.querySelector('#results');
  btn.addEventListener('click', () => {
    startLiveQuery();
    if (hasError) { 
      res.innerHTML = legaleseCopy;
      return;
    }
    const now = new Date();
    // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
    // console.log('calling testApp')
    res.innerHTML = 'working...';
    testApp().then(()=>{
      // const now = new Date();
      // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
      // console.log('testApp completed')
    });
    // getSummary(legaleseCopy).then(() => {
    //   console.log('getSummary completed')
    // });
  });
  // getLegalese();
};

// const hasLegalese = () => {
//   return false;
//   const text = document.body.innerText.toLowerCase();
//   return { tou: text.includes('terms of use'), tos: text.includes('terms of service'), tac: text.includes('terms and conditions'), pp: text.includes('privacy policy'), eula: (text.includes('end user license') || text.includes('end-user license')) }
// };

async function getSummary(legalCopy) {
  try {
    await Parse.Cloud.run("getSummary", { legalese: legalCopy });
  } catch (e) {
    console.log(`testOpenAI failed - ${e}`);
  }
};

async function testApp() {
  try {
    await Parse.Cloud.run("testOpenAI");
  } catch (e) {
    console.log(`testOpenAI failed - ${e}`);
  }
};

var legaleseCopy, activeTabId;
var hasError = false;
const getLegalese = () => {
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

const startLiveQuery = async () => {
    try {
        const query = new Parse.Query("OpenAIResponse");
        
        // const now = new Date();
        // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
        // console.log('📡 Connecting to LiveQuery...\n');
        const subscription = await query.subscribe();
        
        subscription.on('open', () => {
            // const now = new Date();
            // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
            // console.log('✅ LiveQuery connected!\n');
            // console.log('Waiting for updates... (press Ctrl+C to stop)\n');
        });

        subscription.on('update', (object) => {
            const res = document.querySelector('#results');
            res.innerHTML = object.get('response');
            // const now = new Date();
            // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
            // console.log('   ID:', object.id);
            // console.log('   Data:', JSON.stringify(object.toJSON(), null, 2));
            // console.log('');
        });

        subscription.on('close', () => {
            // console.log('⚠️  LiveQuery connection closed');
        });

        subscription.on('error', (error) => {
            // console.error('❌ LiveQuery error:', error.message);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}