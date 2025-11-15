// content.js

// Обработка сообщений из background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageText") {
    sendResponse({ text: document.body.innerText || "" });
  } else if (request.action === "showSummary") {
    showSummaryPopup(request.summary);
    sendResponse({ success: true });
  }
});

// Функция создания плавающего окна
function showSummaryPopup(summaryText) {
  // Удаляем предыдущее окно, если есть
  const existing = document.getElementById('llm-summary-popup');
  if (existing) existing.remove();

  // Создаём контейнер
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

  // Заголовок (теперь draggable)
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

  // Тело с текстом
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

  // === Логика перетаскивания ===
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    // Сохраняем смещение курсора относительно окна
    const rect = popup.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault(); // предотвращаем выделение текста
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    // Вычисляем новую позицию (без transform!)
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    // Отключаем transform, используем top/left
    popup.style.transform = 'none';
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // === Закрытие окна ===
  document.getElementById('llm-close-btn').onclick = () => popup.remove();

  // Закрытие по клику вне окна (но не при перетаскивании)
  document.addEventListener('click', function closeOnClick(e) {
    if (!popup.contains(e.target) && !isDragging) {
      popup.remove();
      document.removeEventListener('click', closeOnClick);
    }
  });
}