// Use Chrome APIs directly

console.log('GitHub Copilot auto-paste script loaded');

const autoPasteOnGitHub = async () => {
  try {
    // Check if we have text to paste
    const result = await chrome.storage.local.get(['autoPasteText', 'autoPasteDestination', 'autoPasteTimestamp']);
    
    // Only auto-paste if:
    // 1. We have text to paste
    // 2. The destination is GitHub Copilot
    // 3. The timestamp is recent (within 30 seconds)
    if (!result.autoPasteText || 
        result.autoPasteDestination !== 'copilot' || 
        !result.autoPasteTimestamp ||
        Date.now() - result.autoPasteTimestamp > 30000) {
      console.log('No valid auto-paste data found for GitHub Copilot');
      return;
    }

    console.log('Auto-pasting transcript to GitHub Copilot...');

    // Wait for GitHub interface to load
    const waitForTextarea = () => {
      return new Promise((resolve) => {
        const checkTextarea = () => {
          // Try multiple possible selectors for GitHub's text input areas
          const selectors = [
            '#copilot-chat-textarea',
            'textarea[placeholder*="How can I help you?"]',
            'textarea[aria-label*="How can I help you?"]',
            '.ChatInput-module__input--HalEQ',
            'textarea[placeholder*="Ask Copilot"]',
            'textarea[placeholder*="Type a message"]',
            'textarea[name="comment"]',
            'textarea[aria-label*="comment"]',
            'textarea[aria-label*="message"]',
            '.copilot-chat-input textarea',
            '#copilot-chat-input',
            'textarea'
          ];
          
          for (const selector of selectors) {
            const textarea = document.querySelector(selector);
            if (textarea && !textarea.disabled && textarea.offsetParent !== null) {
              console.log('Found textarea with selector:', selector);
              resolve(textarea);
              return;
            }
          }
          
          // If not found, try again in 250ms
          setTimeout(checkTextarea, 250);
        };
        
        checkTextarea();
      });
    };

    // Wait up to 5 seconds for the textarea to appear
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout waiting for textarea')), 5000);
    });

    try {
      const textarea = await Promise.race([waitForTextarea(), timeout]);
      
      // Make sure we don't accidentally focus the attach button
      const attachButton = document.querySelector('button[data-testid="attachment-menu-button"]');
      if (attachButton) {
        attachButton.blur();
      }
      
      // Focus the textarea multiple times to ensure it gets focus
      textarea.focus();
      textarea.click();
      
      // Clear any existing content
      textarea.value = '';
      
      // Insert the transcript text
      textarea.value = result.autoPasteText;
      
      // Trigger input events to notify GitHub of the change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new Event('keyup', { bubbles: true }));
      
      // Ensure focus is still on textarea
      textarea.focus();
      
      console.log('Text successfully pasted to GitHub Copilot');
      
      // Wait a moment for the UI to process the input, then press Enter
      setTimeout(() => {
        console.log('Pressing Enter to submit...');
        
        // Try to find and click the send/submit button first
        const sendButtonSelectors = [
          'button[aria-labelledby*="ro"]', // The specific ID from the HTML
          'button.prc-Button-IconButton-szpyj',
          'button[aria-label*="Send now"]',
          'button.prc-Button-IconButton-szpyj svg.octicon-paper-airplane',
          'button[data-component="IconButton"] svg.octicon-paper-airplane',
          'button[type="submit"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="Submit"]',
          'input[type="submit"]',
          'button:has(svg[data-icon="send"])',
          'button:has(svg.octicon-paper-airplane)',
          'form button',
          '.copilot-chat-send-button',
          '[data-testid*="send"]'
        ];
        
        let sentViaButton = false;
        
        // Look for submit button in the same form/container as the textarea
        const form = textarea.closest('form') || textarea.closest('.ChatInput-module__container--qmP6j') || textarea.closest('[role="dialog"]');
        if (form) {
          for (const selector of sendButtonSelectors) {
            const sendButton = form.querySelector(selector);
            if (sendButton && !sendButton.disabled && sendButton.offsetParent !== null) {
              console.log('Found send button with selector:', selector);
              // Ensure textarea still has focus before clicking send
              textarea.focus();
              sendButton.click();
              sentViaButton = true;
              break;
            }
          }
        }
        
        // If no send button found in container, search globally
        if (!sentViaButton) {
          for (const selector of sendButtonSelectors) {
            const sendButton = document.querySelector(selector);
            if (sendButton && !sendButton.disabled && sendButton.offsetParent !== null) {
              console.log('Found global send button with selector:', selector);
              // Ensure textarea still has focus before clicking send
              textarea.focus();
              sendButton.click();
              sentViaButton = true;
              break;
            }
          }
        }
        
        // If no send button found, try pressing Enter key
        if (!sentViaButton) {
          console.log('No send button found, trying Enter key...');
          
          // Make sure textarea has focus before sending key events
          textarea.focus();
          textarea.click();
          
          // Wait a moment to ensure focus
          setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            
            textarea.dispatchEvent(enterEvent);
            
            // Also try Ctrl+Enter (common for GitHub)
            const ctrlEnterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              ctrlKey: true,
              bubbles: true,
              cancelable: true
            });
            
            textarea.dispatchEvent(ctrlEnterEvent);
            
            // Also try the keyup events
            const enterUpEvent = new KeyboardEvent('keyup', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            
            textarea.dispatchEvent(enterUpEvent);
          }, 100);
        }
        
        console.log('Message submitted to GitHub Copilot');
      }, 500);
      
      // Clear the stored text so it doesn't paste again
      await chrome.storage.local.remove(['autoPasteText', 'autoPasteDestination', 'autoPasteTimestamp']);
      
    } catch (error) {
      console.error('Failed to find or fill textarea:', error);
    }

  } catch (error) {
    console.error('Error in GitHub auto-paste:', error);
  }
};

// Start auto-paste process after a short delay to ensure page is loaded
setTimeout(autoPasteOnGitHub, 1000);

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
    setTimeout(autoPasteOnGitHub, 500);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
