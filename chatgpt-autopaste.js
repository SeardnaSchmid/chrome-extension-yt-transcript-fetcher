// Use Chrome APIs directly

console.log('ChatGPT auto-paste script loaded');

const autoPasteOnChatGPT = async () => {
  try {
    // Check if we have text to paste
    const result = await chrome.storage.local.get(['autoPasteText', 'autoPasteDestination', 'autoPasteTimestamp']);
    
    // Only auto-paste if:
    // 1. We have text to paste
    // 2. The destination is ChatGPT
    // 3. The timestamp is recent (within 30 seconds)
    if (!result.autoPasteText || 
        result.autoPasteDestination !== 'chatgpt' || 
        !result.autoPasteTimestamp ||
        Date.now() - result.autoPasteTimestamp > 30000) {
      console.log('No valid auto-paste data found for ChatGPT');
      return;
    }

    console.log('Auto-pasting transcript to ChatGPT...');

    // Wait for ChatGPT interface to load
    const waitForTextbox = () => {
      return new Promise((resolve) => {
        const checkTextbox = () => {
          // Try multiple possible selectors for ChatGPT's text input
          const selectors = [
            'textarea[placeholder*="Message"]',
            'textarea[data-id*="prompt"]',
            '#prompt-textarea',
            'textarea[placeholder*="Send a message"]',
            'div[contenteditable="true"]',
            'textarea'
          ];
          
          for (const selector of selectors) {
            const textbox = document.querySelector(selector);
            if (textbox && !textbox.disabled) {
              console.log('Found textbox with selector:', selector);
              resolve(textbox);
              return;
            }
          }
          
          // If not found, try again in 250ms
          setTimeout(checkTextbox, 250);
        };
        
        checkTextbox();
      });
    };

    // Wait up to 5 seconds for the textbox to appear
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout waiting for textbox')), 5000);
    });

    try {
      const textbox = await Promise.race([waitForTextbox(), timeout]);
      
      // Focus the textbox
      textbox.focus();
      
      // Clear any existing content
      textbox.value = '';
      
      // Insert the transcript text
      if (textbox.tagName.toLowerCase() === 'textarea') {
        textbox.value = result.autoPasteText;
        // Trigger input event to notify ChatGPT of the change
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
        textbox.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (textbox.contentEditable === 'true') {
        textbox.textContent = result.autoPasteText;
        // Trigger input event for contenteditable
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      console.log('Text successfully pasted to ChatGPT');
      
      // Wait a moment for the UI to process the input, then press Enter
      setTimeout(() => {
        console.log('Pressing Enter to submit...');
        
        // Try to find and click the send button first
        const sendButtonSelectors = [
          'button[aria-label*="Send"]',
          'button[data-testid*="send"]',
          'button[type="submit"]',
          '[aria-label*="Send message"]',
          'button svg[data-icon="send"]',
          'button:has(svg)',
          'form button[type="submit"]'
        ];
        
        let sentViaButton = false;
        for (const selector of sendButtonSelectors) {
          const sendButton = document.querySelector(selector);
          if (sendButton && !sendButton.disabled) {
            console.log('Found send button with selector:', selector);
            sendButton.click();
            sentViaButton = true;
            break;
          }
        }
        
        // If no send button found, try pressing Enter key
        if (!sentViaButton) {
          console.log('No send button found, trying Enter key...');
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          
          textbox.dispatchEvent(enterEvent);
          
          // Also try the keyup event
          const enterUpEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          
          textbox.dispatchEvent(enterUpEvent);
        }
        
        console.log('Message submitted to ChatGPT');
      }, 500);
      
      // Clear the stored text so it doesn't paste again
      await chrome.storage.local.remove(['autoPasteText', 'autoPasteDestination', 'autoPasteTimestamp']);
      
    } catch (error) {
      console.error('Failed to find or fill textbox:', error);
    }

  } catch (error) {
    console.error('Error in ChatGPT auto-paste:', error);
  }
};

// Start auto-paste process after a short delay to ensure page is loaded
setTimeout(autoPasteOnChatGPT, 1000);

// Also try again if the page content changes (in case it's a SPA navigation)
const observer = new MutationObserver((mutations) => {
  // Check if significant content has been added (indicating page load/navigation)
  const hasSignificantChanges = mutations.some(mutation => 
    mutation.addedNodes.length > 0 && 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeType === Node.ELEMENT_NODE && 
      (node.tagName === 'MAIN' || node.tagName === 'FORM' || node.querySelector('textarea'))
    )
  );
  
  if (hasSignificantChanges) {
    setTimeout(autoPasteOnChatGPT, 500);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
