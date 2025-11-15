// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    // Элементы интерфейса
    const summarizePageBtn = document.getElementById('summarizePage');
    const copySummaryBtn = document.getElementById('copySummary');
    const summaryDiv = document.getElementById('summary');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const openOptionsLink = document.getElementById('openOptions');
  
    // Открытие страницы настроек
    openOptionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  
    // Загрузка истории
    async function loadHistory() {
      const data = await chrome.storage.local.get(['summaryHistory']);
      const history = data.summaryHistory || [];
      historyList.innerHTML = '';
      history.slice().reverse().forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <div class="history-label">📌 ${new Date(item.timestamp).toLocaleString()}</div>
          ${item.text}
          <button class="copy-history" data-index="${i}">Copy</button>
        `;
        historyList.appendChild(div);
      });
  
      historyList.querySelectorAll('.copy-history').forEach(btn => {
        btn.addEventListener('click', async () => {
          const index = history.length - 1 - parseInt(btn.dataset.index);
          await navigator.clipboard.writeText(history[index].text);
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 1000);
        });
      });
    }
  
    // === Суммаризация всей страницы ===
    async function summarizePage() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.tabs.sendMessage(tab.id, { action: "getPageText" });
        const text = result?.text || '';
  
        if (!text.trim()) {
          summaryDiv.textContent = '⚠️ No text found on page';
          return;
        }
  
        const settings = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'model']);
        const baseUrl = settings.baseUrl?.trim();
        const apiKey = settings.apiKey?.trim() || '';
        const model = settings.model?.trim() || 'llama3.2';
  
        if (!baseUrl) {
          summaryDiv.textContent = '⚠️ Base URL not set. Open Settings.';
          return;
        }
  
        summaryDiv.textContent = '🧠 Summarizing page...';
        copySummaryBtn.disabled = true;
  
        const trimmed = text.substring(0, 10000);
        const payload = {
          model: model,
          messages: [
            { role: "system", content: "You are a summarizer assistant that briefly summarizes text." },
            { role: "user", content: `Briefly summarize the following text in 3-5 sentences:\n\n${trimmed}` }
          ],
          temperature: 0.3,
          max_tokens: 500
        };
  
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
  
        if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  
        const data = await response.json();
        const summary = data.choices?.[0]?.message?.content?.trim() || 'No summary returned.';
        summaryDiv.textContent = summary;
        copySummaryBtn.disabled = false;
  
        // Сохраняем в историю
        const historyData = await chrome.storage.local.get(['summaryHistory']);
        let history = historyData.summaryHistory || [];
        history.push({ text: summary, timestamp: Date.now() });
        if (history.length > 5) history = history.slice(-5);
        await chrome.storage.local.set({ summaryHistory: history });
        loadHistory();
  
      } catch (error) {
        console.error('Page summarization error:', error);
        summaryDiv.textContent = `❌ ${error.message}`;
        copySummaryBtn.disabled = false;
      }
    }
  
    summarizePageBtn.addEventListener('click', summarizePage);
  
    // === Копирование сводки ===
    copySummaryBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(summaryDiv.textContent);
      copySummaryBtn.textContent = 'Copied!';
      setTimeout(() => {
        copySummaryBtn.textContent = 'Copy Summary';
      }, 1000);
    });
  
    // === Очистка истории ===
    clearHistoryBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ summaryHistory: [] });
      loadHistory();
    });
  
    // Инициализация
    loadHistory();
  });