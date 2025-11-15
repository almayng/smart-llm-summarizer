// options.js
document.addEventListener('DOMContentLoaded', async () => {
    const baseUrl = document.getElementById('baseUrl');
    const apiKey = document.getElementById('apiKey');
    const model = document.getElementById('model');
    const saveBtn = document.getElementById('save');
    const statusDiv = document.getElementById('status');
  
    // Загрузка текущих настроек
    const saved = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'model']);
    baseUrl.value = saved.baseUrl || 'http://localhost:1234/v1';
    apiKey.value = saved.apiKey || '';
    model.value = saved.model || 'llama3.2';
  
    saveBtn.addEventListener('click', async () => {
      await chrome.storage.sync.set({
        baseUrl: baseUrl.value.trim(),
        apiKey: apiKey.value.trim(),
        model: model.value.trim()
      });
  
      statusDiv.textContent = '✅ Настройки сохранены!';
      statusDiv.className = 'status success';
      setTimeout(() => statusDiv.textContent = '', 2000);
    });
  });