// options.js
document.addEventListener('DOMContentLoaded', async () => {
    const baseUrl = document.getElementById('baseUrl');
    const apiKey = document.getElementById('apiKey');
    const model = document.getElementById('model');
    const systemRole = document.getElementById('systemRole');
    const userRole = document.getElementById('userRole');
    const saveBtn = document.getElementById('save');
    const statusDiv = document.getElementById('status');
  
    // Default values for roles
    const defaultSystemRole = "You are a summarizer assistant that briefly summarizes text. Response language must be Russian.";
    const defaultUserRole = "Briefly summarize the following text in 3-5 sentences";
  
    // Load current settings
    const saved = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'model', 'systemRoleContent', 'userRoleContent']);
    baseUrl.value = saved.baseUrl || 'http://localhost:1234/v1';
    apiKey.value = saved.apiKey || '';
    model.value = saved.model || 'llama3.2';
    systemRole.value = saved.systemRoleContent || defaultSystemRole;
    userRole.value = saved.userRoleContent || defaultUserRole;
  
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