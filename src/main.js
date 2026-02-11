import './style.css'
import { animate, splitText, stagger } from 'animejs';
import { testMockRender } from './mockdata.js'

window.onload = () => {
  animateThinkingMode(document.querySelector('#empty-state'));
  const shim = document.querySelector('#about-modal-shim');
  shim.addEventListener('click', () => {
    shim.style.display = 'none';
  });
  document.querySelector('#btn-about').addEventListener('click', () => {
    shim.style.display = 'flex';
  });

  const btn = document.querySelector('#btn-unlegalese');
  btn.addEventListener('click', () => {
    if (hasError) {
      res.innerHTML = legaleseCopy;
      return;
    }

    document.querySelector('#btn-unlegalese-og').classList.add('disabled');
    document.querySelector('#btn-unlegalese').classList.add('disabled');
    progressiveRenderUnlegalese(legaleseCopy);
  });

  const btnOg = document.querySelector('#btn-unlegalese-og');
  btnOg.addEventListener('click', () => {
    if (hasError) {
      res.innerHTML = legaleseCopy;
      return;
    }

    document.querySelector('#btn-unlegalese-og').classList.add('disabled');
    document.querySelector('#btn-unlegalese').classList.add('disabled');
    streamUnlegalese(legaleseCopy);
    // getStructuredUnlegalese(legaleseCopy);
  });

  getLegalese();
};

function animateThinkingMode(element) {
  const { chars } = splitText(element, {
    chars: { wrap: 'visible' },
  });

  animate(chars, {
    y: [
      { to: '-5px', ease: 'outExpo', duration: 400 },
      { to: 0, ease: 'outBounce', duration: 400, delay: 50 }
    ],
    ease: 'out(3)',
    delay: stagger(50),
    loop: true,
  });
}

async function streamUnlegalese(message) {
  const controller = new AbortController();
  const empty = document.querySelector("#empty-state");
  empty.innerHTML = "🧐 Thinking...";
  animateThinkingMode(empty);

  const response = await fetch(
    `${import.meta.env.VITE_GOOGLE_SERVICE_ENDPIONT}/unlegalese/stream`,
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

  const results = document.querySelector("#results");

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
          empty.style.display = 'none';
          const payload = line.slice(6).trim();

          if (payload && payload !== "[DONE]") {
            try {
              results.innerHTML += JSON.parse(payload);
            } catch {
              results.innerHTML += payload;
            }
          }
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
          document.querySelector('#btn-unlegalese-og').classList.remove('disabled');
          document.querySelector('#btn-unlegalese').classList.remove('disabled');
        }

        // SSE done event
        if (line.startsWith("event: done")) {
          controller.abort();
          return;
        }
      }
    }
  } catch (err) {
    document.querySelector('#btn-unlegalese-og').classList.remove('disabled');
    document.querySelector('#btn-unlegalese').classList.remove('disabled');
    if (err.name !== "AbortError") {
      console.error("Streaming error:", err);
    }
  }
}

async function getStructuredUnlegalese(message) {
  const results = document.querySelector("#results");
  const empty = document.querySelector("#empty-state");
  empty.innerHTML = "🧐 Thinking...";
  animateThinkingMode(empty);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_GOOGLE_SERVICE_ENDPIONT}/unlegalese/structured`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Parse-REST-API-Key": import.meta.env.VITE_B4A_REST_API_KEY,
          "X-Parse-Application-Id": import.meta.env.VITE_B4A_APPLICATION_ID,
        },
        credentials: "include",
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const { success, data, error } = await response.json();

    if (!success) {
      results.innerHTML = `<div class="error">Error: ${error}</div>`;
      return;
    }

    empty.style.display = 'none';
    // Format the structured data as HTML
    results.innerHTML = `
      <div class="structured-summary">
        <h2>${data.title}</h2>
        
        <div class="summary-section">
          <h3>Summary</h3>
          <p>${data.summary}</p>
        </div>

        <div class="plain-language-section">
          <h3>In Plain English</h3>
          <p>${data.plain_language_version}</p>
        </div>

        <div class="key-points-section">
          <h3>Key Points</h3>
          <ul>
            ${data.key_points.map(point => `
              <li>
                <strong>${point.heading}</strong>
                <p>${point.explanation}</p>
              </li>
            `).join('')}
          </ul>
        </div>

        ${data.concerns.length > 0 ? `
          <div class="concerns-section">
            <h3>⚠️ Things to Watch Out For</h3>
            <ul>
              ${data.concerns.map(concern => `<li>${concern}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    document.querySelector('#btn-unlegalese-og').classList.remove('disabled');
    document.querySelector('#btn-unlegalese').classList.remove('disabled');
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

  } catch (err) {
    document.querySelector('#btn-unlegalese-og').classList.remove('disabled');
    document.querySelector('#btn-unlegalese').classList.remove('disabled');
    results.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    console.error("Structured request error:", err);
  }
}

async function progressiveRenderUnlegalese(message) {
  const controller = new AbortController();
  const results = document.querySelector("#results");
  const empty = document.querySelector("#empty-state");
  empty.style.display = 'none';

  // Initialize the container with progress bar and empty sections
  results.innerHTML = `
    <div class="streaming-progress">
      <div id="thinking" class="progress-text">🧐 Analyzing legal document...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    <div class="structured-summary">
      <div class="plain-language-section">
        <h3>In Plain English</h3>
        <p class="content-placeholder">Simplifying language...</p>
      </div>

      <div class="key-points-section">
        <h3>Key Points</h3>
        <ul class="content-placeholder">
          <li>Extracting key points...</li>
        </ul>
      </div>

      <div class="concerns-section">
        <h3>Things to Watch Out For</h3>
        <ul class="content-placeholder">
          <li>Finding potential red flags...</li>
        </ul>
      </div>
    </div>
  `;

  animateThinkingMode(document.querySelector('#thinking'));

  try {
    const response = await fetch(
      `${import.meta.env.VITE_GOOGLE_SERVICE_ENDPIONT}/unlegalese/structured/stream`,
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
    let accumulatedJson = "";
    let charCount = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();

          if (payload && payload !== "[DONE]") {
            try {
              const parsed = JSON.parse(payload);

              if (parsed.type === "delta") {
                accumulatedJson += parsed.content;
                charCount += parsed.content.length;

                // Update progress bar
                const progressFill = results.querySelector(".progress-fill");
                if (progressFill) {
                  const progress = Math.min((charCount / 50) * 100, 90);
                  progressFill.style.width = `${progress}%`;
                }

                // Try to parse partial JSON and render what we can
                tryProgressiveRender(accumulatedJson, results);
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
                });

              } else if (parsed.type === "complete") {
                // Hide progress bar and final render with complete data
                const progressBar = results.querySelector(".streaming-progress");
                if (progressBar) {
                  progressBar.style.display = "none";
                }

                const data = parsed.data;
                renderComplete(data, results);

                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
                });
              } else if (parsed.type === "error") {
                results.innerHTML = `<div class="error">Error: ${parsed.error}</div>`;
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }

        if (line.startsWith("event: done")) {
          controller.abort();
          return;
        }
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      results.innerHTML = `<div class="error">Error: ${err.message}</div>`;
      console.error("Progressive render error:", err);
    }
  }
}

function tryProgressiveRender(jsonString, resultsElement) {
  // Try to extract and render partial fields from incomplete JSON
  try {
    // Extract title if available
    const titleMatch = jsonString.match(/"title"\s*:\s*"([^"]+)"/);
    if (titleMatch) {
      const titleElement = resultsElement.querySelector('h2');
      if (titleElement && titleElement.classList.contains('loading-placeholder')) {
        titleElement.textContent = titleMatch[1];
        titleElement.classList.remove('loading-placeholder');
        titleElement.classList.add('fade-in');
      }
    }

    // Extract plain language version if available
    const plainMatch = jsonString.match(/"plain_language_version"\s*:\s*"([^"]+(?:\\.[^"]+)*)"/);
    if (plainMatch) {
      const plainElement = resultsElement.querySelector('.plain-language-section p');
      if (plainElement) {
        const plainText = plainMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        plainElement.textContent = plainText;
        plainElement.classList.remove('content-placeholder');
        plainElement.classList.add('fade-in');
      }
    }

    // Try to extract key points array
    const keyPointsMatch = jsonString.match(/"key_points"\s*:\s*\[([\s\S]*?)\]/);
    if (keyPointsMatch) {
      // Try to parse complete key point objects
      const keyPointsJson = keyPointsMatch[0];
      try {
        const keyPointsObj = JSON.parse(`{${keyPointsJson}}`);
        const keyPoints = keyPointsObj.key_points;

        if (keyPoints && keyPoints.length > 0) {
          const keyPointsList = resultsElement.querySelector('.key-points-section ul');
          if (keyPointsList) {
            // Track how many items we've already rendered
            const currentCount = parseInt(keyPointsList.dataset.renderedCount || '0', 10);
            
            // Only render new items
            if (keyPoints.length > currentCount) {
              const newItems = keyPoints.slice(currentCount);
              const fragment = document.createDocumentFragment();
              
              newItems.forEach(point => {
                const li = document.createElement('li');
                li.className = 'fade-in';
                li.innerHTML = `
                  <strong>${point.heading}</strong>
                  <p>${point.explanation}</p>
                `;
                fragment.appendChild(li);
              });
              
              keyPointsList.appendChild(fragment);
              keyPointsList.dataset.renderedCount = keyPoints.length;
              keyPointsList.classList.remove('content-placeholder');
            }
          }
        }
      } catch (e) {
        // Not complete yet, continue
      }
    }

    // Try to extract concerns array
    const concernsMatch = jsonString.match(/"concerns"\s*:\s*\[([\s\S]*?)\]/);
    if (concernsMatch) {
      try {
        const concernsJson = concernsMatch[0];
        const concernsObj = JSON.parse(`{${concernsJson}}`);
        const concerns = concernsObj.concerns;

        if (concerns && concerns.length > 0) {
          const concernsSection = resultsElement.querySelector('.concerns-section');
          const concernsList = concernsSection.querySelector('ul');

          concernsList.innerHTML = concerns.map(concern => `
            <li class="fade-in">${concern}</li>
          `).join('');
          concernsList.classList.remove('content-placeholder');
          concernsSection.style.display = 'block';
        }
      } catch (e) {
        // Not complete yet
      }
    }

  } catch (error) {
    // Silently fail - we'll try again with more data
  }
}

function renderComplete(data, resultsElement) {
  resultsElement.innerHTML = `
    <div class="structured-summary">
      <h2 class="fade-in">${data.title}</h2>

      <div class="plain-language-section">
        <h3>In Plain English</h3>
        <p class="fade-in">${data.plain_language_version}</p>
      </div>

      <div class="key-points-section">
        <h3>Key Points</h3>
        <ul>
          ${data.key_points.map(point => `
            <li class="fade-in">
              <strong>${point.heading}</strong>
              <p>${point.explanation}</p>
            </li>
          `).join('')}
        </ul>
      </div>

      ${data.concerns.length > 0 ? `
        <div class="concerns-section">
          <h3>Things to Watch Out For</h3>
          <ul>
            ${data.concerns.map(concern => `<li class="fade-in">${concern}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  document.querySelector('#btn-unlegalese-og').classList.remove('disabled');
  document.querySelector('#btn-unlegalese').classList.remove('disabled');
}

function renderCompleteTest(data, resultsElement) {
  resultsElement.innerHTML = `
    <div class="streaming-progress">
      <div id="thinking" class="progress-text">🧐 Analyzing legal document...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    <div class="structured-summary">
      <h2 class="fade-in">${data.title}</h2>

      <div class="structured-section">
        <h3>In Plain English</h3>
        <p class="fade-in">${data.plain_language_version}</p>
      </div>

      <div class="structured-section">
        <h3>Key Points</h3>
        <ul>
          ${data.key_points.map(point => `
            <li class="fade-in">
              <p><strong>${point.heading}</strong> ${point.explanation}</p>
            </li>
          `).join('')}
        </ul>
      </div>

      ${data.concerns.length > 0 ? `
        <div class="structured-section">
          <h3>Things to Watch Out For</h3>
          <ul>
            ${data.concerns.map(concern => `<li class="fade-in"><p>${concern}</p></li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  results.querySelector(".progress-fill").style.width = `50%`;
  animateThinkingMode(document.querySelector('#thinking'));
}

var legaleseCopy, activeTabId;
var hasError = false;
const getLegalese = () => {
  if (!chrome.tabs) {
    console.log('not in extension mode')
    testMockRender(renderCompleteTest);
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