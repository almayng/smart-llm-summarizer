// options.js
document.addEventListener('DOMContentLoaded', async () => {
    const baseUrl = document.getElementById('baseUrl');
    const apiKey = document.getElementById('apiKey');
    const model = document.getElementById('model');
    const systemRole = document.getElementById('systemRole');
    const userRole = document.getElementById('userRole');
    const saveBtn = document.getElementById('save');
    const statusDiv = document.getElementById('status');
    const shortcutPage = document.getElementById('shortcut-page');
    const shortcutSelection = document.getElementById('shortcut-selection');
    const configureShortcutsLink = document.getElementById('configureShortcuts');
  
    // Default values for roles
    const defaultSystemRole = "You are a summarizer assistant that briefly summarizes text. Response language must be Russian.";
    const defaultUserRole = "Briefly summarize the following text in 3-5 sentences";
  
    // Function to format keyboard shortcut
    function formatShortcut(shortcut) {
      if (!shortcut) return 'Not set';
      // Convert to more readable format
      return shortcut
        .replace('Ctrl+', 'Ctrl+')
        .replace('Alt+', 'Alt+')
        .replace('Shift+', 'Shift+')
        .replace('Command+', '⌘+')
        .replace('MacCtrl+', '⌃+');
    }
  
    // Load and display keyboard shortcuts
    async function loadShortcuts() {
      try {
        const commands = await chrome.commands.getAll();
        const pageCommand = commands.find(c => c.name === 'summarize-page');
        const selectionCommand = commands.find(c => c.name === 'summarize-selection');
        
        if (pageCommand) {
          shortcutPage.textContent = formatShortcut(pageCommand.shortcut);
        }
        if (selectionCommand) {
          shortcutSelection.textContent = formatShortcut(selectionCommand.shortcut);
        }
      } catch (error) {
        console.error('Error loading shortcuts:', error);
      }
    }
  
    // Open shortcuts configuration page
    configureShortcutsLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // Try to open the shortcuts page
        const url = 'chrome://extensions/shortcuts';
        chrome.tabs.create({ url: url }, () => {
          // Check if there was an error
          if (chrome.runtime.lastError) {
            // Fallback: show instructions
            statusDiv.innerHTML = `
              <strong>To configure shortcuts:</strong><br>
              1. Open a new tab<br>
              2. Navigate to: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">chrome://extensions/shortcuts</code><br>
              3. Find "Smart LLM Summarizer" and set your shortcuts
            `;
            statusDiv.className = 'status';
            setTimeout(() => {
              statusDiv.textContent = '';
              statusDiv.className = '';
            }, 8000);
          }
        });
      } catch (error) {
        // Fallback: show manual instructions
        statusDiv.innerHTML = `
          <strong>To configure shortcuts:</strong><br>
          Open: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">chrome://extensions/shortcuts</code>
        `;
        statusDiv.className = 'status';
        setTimeout(() => {
          statusDiv.textContent = '';
          statusDiv.className = '';
        }, 8000);
      }
    });
  
    // Load current settings
    const saved = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'model', 'systemRoleContent', 'userRoleContent']);
    baseUrl.value = saved.baseUrl || 'http://localhost:1234/v1';
    apiKey.value = saved.apiKey || '';
    model.value = saved.model || 'llama3.2';
    systemRole.value = saved.systemRoleContent || defaultSystemRole;
    userRole.value = saved.userRoleContent || defaultUserRole;
  
    // Load keyboard shortcuts
    loadShortcuts();
  
    // Refresh shortcuts when page becomes visible (user might have changed them)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        loadShortcuts();
      }
    });
  
    saveBtn.addEventListener('click', async () => {
      await chrome.storage.sync.set({
        baseUrl: baseUrl.value.trim(),
        apiKey: apiKey.value.trim(),
        model: model.value.trim(),
        systemRoleContent: systemRole.value.trim(),
        userRoleContent: userRole.value.trim()
      });
  
      statusDiv.textContent = '✅ Settings saved!';
      statusDiv.className = 'status success';
      setTimeout(() => statusDiv.textContent = '', 2000);
    });
  });