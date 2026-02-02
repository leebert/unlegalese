import './style.css'
import { animate, splitText, stagger } from 'animejs';
import { testMockRender } from './mockdata.js'

window.onload = () => {
  const { chars } = splitText(document.querySelector('#thinking'), {
    chars: { wrap: 'visible' },
  });

  animate(chars, {
    y: [
      { to: '-5px', ease: 'outExpo', duration: 300 },
      { to: 0, ease: 'outBounce', duration: 300, delay: 50 }
    ],
    ease: 'out(3)',
    delay: stagger(50),
    loop: true,
  });

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
    const thinking = document.querySelector('#thinking');
    thinking.style.display = 'block';

    // streamUnlegalese(legaleseCopy);
    // getStructuredUnlegalese(legaleseCopy);
    // streamStructuredUnlegalese(legaleseCopy);
    // progressiveRenderUnlegalese(legaleseCopy);
    progressiveRenderUnlegaleseFinal(legaleseCopy);
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
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          }); 
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

async function getStructuredUnlegalese(message) {
  const thinking = document.querySelector("#thinking");
  const results = document.querySelector("#results");

  try {
    const response = await fetch(
      `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}/unlegalese-structured`,
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

    thinking.style.display = "none";

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const { success, data, error } = await response.json();

    if (!success) {
      results.innerHTML = `<div class="error">Error: ${error}</div>`;
      return;
    }

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

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

  } catch (err) {
    thinking.style.display = "none";
    results.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    console.error("Structured request error:", err);
  }
}

async function streamStructuredUnlegalese(message) {
  const controller = new AbortController();
  const thinking = document.querySelector("#thinking");
  const results = document.querySelector("#results");

  // Show a progress indicator
  results.innerHTML = `
    <div class="streaming-progress">
      <div class="progress-text">Analyzing legal document...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
  `;

  try {
    const response = await fetch(
      `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}/unlegalese-structured-stream`,
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
    let charCount = 0;

    thinking.style.display = "none";

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
                // Update progress indicator with character count
                charCount += parsed.content.length;
                const progressFill = results.querySelector(".progress-fill");
                if (progressFill) {
                  // Animate the progress bar (fake progress based on chars)
                  const progress = Math.min((charCount / 50) * 100, 90);
                  progressFill.style.width = `${progress}%`;
                }
              } else if (parsed.type === "complete") {
                // Render the complete structured data
                const data = parsed.data;
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
      thinking.style.display = "none";
      results.innerHTML = `<div class="error">Error: ${err.message}</div>`;
      console.error("Streaming structured error:", err);
    }
  }
}

async function progressiveRenderUnlegalese(message) {
  const controller = new AbortController();
  const thinking = document.querySelector("#thinking");
  const results = document.querySelector("#results");

  // Initialize the container with progress bar and empty sections
  results.innerHTML = `
    <div class="streaming-progress">
      <div class="progress-text">Analyzing legal document...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    <div class="structured-summary">
      <h2 class="loading-placeholder">Analyzing document...</h2>
      
      <div class="summary-section">
        <h3>Summary</h3>
        <p class="content-placeholder">Generating summary...</p>
      </div>

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

      <div class="concerns-section" style="display: none;">
        <h3>⚠️ Things to Watch Out For</h3>
        <ul class="content-placeholder"></ul>
      </div>
    </div>
  `;

  try {
    const response = await fetch(
      `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}/unlegalese-structured-stream`,
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

    thinking.style.display = "none";

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
      thinking.style.display = "none";
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

    // Extract summary if available
    const summaryMatch = jsonString.match(/"summary"\s*:\s*"([^"]+(?:\\.[^"]+)*)"/);
    if (summaryMatch) {
      const summaryElement = resultsElement.querySelector('.summary-section p');
      if (summaryElement) {
        // Unescape JSON string
        const summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        summaryElement.textContent = summary;
        summaryElement.classList.remove('content-placeholder');
        summaryElement.classList.add('fade-in');
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
            keyPointsList.innerHTML = keyPoints.map(point => `
              <li class="fade-in">
                <strong>${point.heading}</strong>
                <p>${point.explanation}</p>
              </li>
            `).join('');
            keyPointsList.classList.remove('content-placeholder');
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
      
      <div class="summary-section">
        <h3>Summary</h3>
        <p class="fade-in">${data.summary}</p>
      </div>

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
          <h3>⚠️ Things to Watch Out For</h3>
          <ul>
            ${data.concerns.map(concern => `<li class="fade-in">${concern}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

async function progressiveRenderUnlegaleseFinal(message) {
  const controller = new AbortController();
  const thinking = document.querySelector("#thinking");
  const results = document.querySelector("#results");

  // Initialize the container with progress bar and empty sections
  results.innerHTML = `
    <div class="streaming-progress">
      <div class="progress-text">Analyzing legal document...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    <div class="structured-summary">
      <h2 class="loading-placeholder">Analyzing document...</h2>
      
      <div class="summary-section">
        <h3>Summary</h3>
        <p class="content-placeholder">Generating summary...</p>
      </div>

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

      <div class="concerns-section" style="display: none;">
        <h3>⚠️ Things to Watch Out For</h3>
        <ul class="content-placeholder"></ul>
      </div>
    </div>
  `;

  try {
    const response = await fetch(
      `https://${import.meta.env.VITE_B4A_LIVE_SERVER_URL}/unlegalese-structured-stream-final`,
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

    thinking.style.display = "none";

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
                tryProgressiveRenderFinal(accumulatedJson, results);

              } else if (parsed.type === "complete") {
                // Hide progress bar and final render with complete data
                const progressBar = results.querySelector(".streaming-progress");
                if (progressBar) {
                  progressBar.style.display = "none";
                }
                
                const data = parsed.data;
                renderCompleteFinal(data, results);

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
      thinking.style.display = "none";
      results.innerHTML = `<div class="error">Error: ${err.message}</div>`;
      console.error("Progressive render error:", err);
    }
  }
}

function tryProgressiveRenderFinal(jsonString, resultsElement) {
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

    // Extract summary if available
    const summaryMatch = jsonString.match(/"summary"\s*:\s*"([^"]+(?:\\.[^"]+)*)"/);
    if (summaryMatch) {
      const summaryElement = resultsElement.querySelector('.summary-section p');
      if (summaryElement) {
        // Unescape JSON string
        const summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        summaryElement.textContent = summary;
        summaryElement.classList.remove('content-placeholder');
        summaryElement.classList.add('fade-in');
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
            keyPointsList.innerHTML = keyPoints.map(point => `
              <li class="fade-in">
                <strong>${point.heading}</strong>
                <p>${point.explanation}</p>
              </li>
            `).join('');
            keyPointsList.classList.remove('content-placeholder');
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

function renderCompleteFinal(data, resultsElement) {
  resultsElement.innerHTML = `
    <div class="streaming-progress">
      <div class="progress-text">Analyzing legal document...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    <div class="structured-summary">
      <h2 class="fade-in">${data.title}</h2>
      
      <div class="summary-section">
        <h3>Summary</h3>
        <p class="fade-in">${data.summary}</p>
      </div>

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
          <h3>⚠️ Things to Watch Out For</h3>
          <ul>
            ${data.concerns.map(concern => `<li class="fade-in">${concern}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  results.querySelector(".progress-fill").style.width = `50%`;
}

var legaleseCopy, activeTabId;
var hasError = false;
const getLegalese = () => {
  if (!chrome.tabs) {
    console.log('not in extension mode')
    testMockRender(renderCompleteFinal);
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

//NOTE: The Parse CloudCode + LiveQuery solution does not work for OpenAI API streaming.
//      Updates are blocked until the stream is completed and I could not figure out why,
//      even with the assistance of the Back4App team.
//      My solution was to switch over to fetch and api routing. Thanks for the guidance ChatGPT!

// import Parse from 'parse/dist/parse.min.js';

//In onLoad 
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
// startLiveQuery();

//In click
// testApp().then(()=>{
//   // const now = new Date();
//   // console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
//   // console.log('testApp completed')
// });
// ~or~
// getSummary(legaleseCopy).then(() => {
//   console.log('getSummary completed')
// });

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

// async function testApp() {
//   try {
//     await Parse.Cloud.run("testOpenAI");
//   } catch (e) {
//     console.log(`testOpenAI failed - ${e}`);
//   }
// };

// async function getSummary(legalCopy) {
//   try {
//     await Parse.Cloud.run("getSummary", { legalese: legalCopy });
//   } catch (e) {
//     console.log(`testOpenAI failed - ${e}`);
//   }
// };

// const hasLegalese = () => {
//   return false;
//   const text = document.body.innerText.toLowerCase();
//   return { tou: text.includes('terms of use'), tos: text.includes('terms of service'), tac: text.includes('terms and conditions'), pp: text.includes('privacy policy'), eula: (text.includes('end user license') || text.includes('end-user license')) }
// };