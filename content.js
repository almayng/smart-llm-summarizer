// content.js

// Handle messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageText") {
    sendResponse({ text: document.body.innerText || "" });
  } else if (request.action === "getSelectedText") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    sendResponse({ text: selectedText || "" });
  } else if (request.action === "showSummary") {
    showSummaryPopup(request.summary);
    sendResponse({ success: true });
  }
});

// Function to create floating window
function showSummaryPopup(summaryText) {
  // Remove previous window if exists
  const existing = document.getElementById('llm-summary-popup');
  if (existing) existing.remove();

  // Create container
  const popup = document.createElement('div');
  popup.id = 'llm-summary-popup';
  popup.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 600px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    color: #333;
    overflow: hidden;
    cursor: default;
  `;

  // Header (now draggable)
  const header = document.createElement('div');
  header.id = 'llm-summary-header';
  header.style.cssText = `
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
  `;
  header.innerHTML = `
    <strong>LLM Summary</strong>
    <button id="llm-close-btn" style="
      background: none; border: none; font-size: 18px; cursor: pointer;
      color: #666; padding: 0; width: 24px; height: 24px;
    ">&times;</button>
  `;

  // Body with text
  const body = document.createElement('div');
  body.style.cssText = `
    padding: 16px;
    max-height: 400px;
    overflow: auto;
    white-space: pre-wrap;
    line-height: 1.5;
  `;
  body.textContent = summaryText;

  popup.appendChild(header);
  popup.appendChild(body);
  document.body.appendChild(popup);

  // Dragging logic
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    // Save cursor offset relative to window
    const rect = popup.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault(); // prevent text selection
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    // Calculate new position (without transform!)
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    // Disable transform, use top/left
    popup.style.transform = 'none';
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Window closing
  document.getElementById('llm-close-btn').onclick = () => popup.remove();

  // Close on click outside window (but not while dragging)
  document.addEventListener('click', function closeOnClick(e) {
    if (!popup.contains(e.target) && !isDragging) {
      popup.remove();
      document.removeEventListener('click', closeOnClick);
    }
  });
}