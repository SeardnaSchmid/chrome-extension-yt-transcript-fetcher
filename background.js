// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openTab') {
    chrome.tabs.create({ url: request.url })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Failed to create tab:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will respond asynchronously
    return true;
  }
});
