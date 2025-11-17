// background.js

// Default values for roles
const defaultSystemRole = "You are a summarizer assistant that briefly summarizes text. Response language must be Russian.";
const defaultUserRole = "Briefly summarize the following text in 3-5 sentences";

// Function to perform summarization
async function performSummarization(text, tabId) {
  try {
    const settings = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'model', 'systemRoleContent', 'userRoleContent']);
    const baseUrl = settings.baseUrl?.trim();
    const apiKey = settings.apiKey?.trim() || '';
    const model = settings.model?.trim() || 'llama3.2';
    const systemRoleContent = settings.systemRoleContent?.trim() || defaultSystemRole;
    const userRoleContent = settings.userRoleContent?.trim() || defaultUserRole;

    if (!baseUrl) {
      chrome.tabs.sendMessage(tabId, {
        action: "showSummary",
        summary: "❌ Error: Base URL not set.\nGo to extension Settings."
      });
      return;
    }

    const trimmed = text.substring(0, 10000);
    const payload = {
      model: model,
      messages: [
        { role: "system", content: systemRoleContent },
        { role: "user", content: `${userRoleContent}:\n\n${trimmed}` }
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

    // Send summary to page
    chrome.tabs.sendMessage(tabId, {
      action: "showSummary",
      summary: summary
    });

    // Save to history
    const historyData = await chrome.storage.local.get(['summaryHistory']);
    let history = historyData.summaryHistory || [];
    history.push({ text: summary, timestamp: Date.now() });
    if (history.length > 5) history = history.slice(-5);
    await chrome.storage.local.set({ summaryHistory: history });

  } catch (error) {
    chrome.tabs.sendMessage(tabId, {
      action: "showSummary",
      summary: `❌ Summarization failed:\n${error.message}`
    });
  }
}

// Function to summarize selected text
async function summarizeSelection(tab) {
  if (!tab?.id) return;
  
  try {
    // Try to get selection from the page
    const result = await chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" });
    const selectedText = result?.text || '';
    
    if (!selectedText.trim()) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showSummary",
        summary: "❌ No text selected. Please select some text first."
      });
      return;
    }

    await performSummarization(selectedText, tab.id);
  } catch (error) {
    // Fallback: try to get selection from clipboard or show error
    chrome.tabs.sendMessage(tab.id, {
      action: "showSummary",
      summary: `❌ Error: ${error.message}\nPlease select text on the page.`
    });
  }
}

// Function to summarize entire page
async function summarizePage(tab) {
  if (!tab?.id) return;
  
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { action: "getPageText" });
    const text = result?.text || '';
    
    if (!text.trim()) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showSummary",
        summary: "❌ No text found on page"
      });
      return;
    }

    await performSummarization(text, tab.id);
  } catch (error) {
    chrome.tabs.sendMessage(tab.id, {
      action: "showSummary",
      summary: `❌ Error: ${error.message}`
    });
  }
}

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "Summarize with LLM",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarize-selection" && info.selectionText) {
    await performSummarization(info.selectionText, tab.id);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (command === "summarize-page") {
    await summarizePage(tab);
  } else if (command === "summarize-selection") {
    await summarizeSelection(tab);
  }
});