// background.js

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "summarize-selection",
      title: "Summarize with LLM",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "summarize-selection" && info.selectionText) {
      try {
        const settings = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'model']);
        const baseUrl = settings.baseUrl?.trim();
        const apiKey = settings.apiKey?.trim() || '';
        const model = settings.model?.trim() || 'llama3.2';
  
        if (!baseUrl) {
          // Отправляем ошибку на страницу
          chrome.tabs.sendMessage(tab.id, {
            action: "showSummary",
            summary: "❌ Error: Base URL not set.\nGo to extension Settings."
          });
          return;
        }
  
        const trimmed = info.selectionText.substring(0, 10000);
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
  
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
        const data = await response.json();
        const summary = data.choices?.[0]?.message?.content?.trim() || 'No summary returned.';
  
        // ✅ Отправляем сводку на страницу
        chrome.tabs.sendMessage(tab.id, {
          action: "showSummary",
          summary: summary
        });
  
        // Сохраняем в историю
        const historyData = await chrome.storage.local.get(['summaryHistory']);
        let history = historyData.summaryHistory || [];
        history.push({ text: summary, timestamp: Date.now() });
        if (history.length > 5) history = history.slice(-5);
        await chrome.storage.local.set({ summaryHistory: history });
  
      } catch (error) {
        chrome.tabs.sendMessage(tab.id, {
          action: "showSummary",
          summary: `❌ Summarization failed:\n${error.message}`
        });
      }
    }
  });