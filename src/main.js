import './style.css'
import Parse from 'parse/dist/parse.min.js';

const TEST_COPY = 'You agree that your use of our services is solely at your own risk. You agree that such services are provided on an "as is," "as available" basis. We expressly disclaim all warranties of any kind, whether express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringemen. We make no warranty that the services will meet your requirements or that the services will be uninterrupted, timely, secure, or error free; nor do we make any warranty as to the results that may be obtained from the use of the service or as to the accuracy or reliability of any information obtained through the service or that defects in the service will be corrected. You understand and agree that any material and/or data downloaded or otherwise obtained through the use of service is done at your own discretion and risk and that you will be solely responsible for any damage to your computer system or loss of data that results from the download of such material and/or data. We make no warranty regarding any goods or services purchased or obtained through the service or any transactions entered into through the service. No advice or information, whether oral or written, obtained by you from us or through the service shall create any warranty not expressly made herein.';

window.onload = () => {
  Parse.initialize(
    import.meta.env.VITE_B4A_APPLICATION_ID,
    import.meta.env.VITE_B4A_JAVASCRIPT_KEY,
  );
  Parse.serverURL = "https://parseapi.back4app.com/";

  const liveQueryClient = new Parse.LiveQueryClient({
    applicationId: import.meta.env.VITE_B4A_APPLICATION_ID,
    serverURL: import.meta.env.VITE_B4A_LIVE_SERVER_URL,
    javascriptKey: import.meta.env.VITE_B4A_JAVASCRIPT_KEY,
  });
  liveQueryClient.open();
  const query = new Parse.Query("OpenAIResponse");
  const subscription = liveQueryClient.subscribe(query);
  subscription.on("update", data => {
    res.innerHTML = data.get('response');
  });

  const btn = document.querySelector('#btn-unlegalese');
  const res = document.querySelector('#results');
  btn.addEventListener('click', () => {
    res.innerHTML = 'working...';
    testApp().then(()=>{
      console.log('testApp completed')
    });
    // getSummary(TEST_COPY).then(response => {
    //   console.log(response.id);
    // });
  });
};

const hasLegalese = () => {
  return false;
  const text = document.body.innerText.toLowerCase();
  return { tou: text.includes('terms of use'), tos: text.includes('terms of service'), tac: text.includes('terms and conditions'), pp: text.includes('privacy policy'), eula: (text.includes('end user license') || text.includes('end-user license')) }
};

async function getSummary(legalCopy) {
  try {
    const response = await Parse.Cloud.run("getSummary", { legalese: legalCopy });
    return response;
  } catch (e) {
    console.log('getSummary failed');
    console.error(e);
  }
};

async function testApp() {
  try {
    await Parse.Cloud.run("testOpenAI");
  } catch (e) {
    console.log(`testOpenAI failed - ${e}`);
  }
};