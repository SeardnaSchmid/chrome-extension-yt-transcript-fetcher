console.log('Content script loaded for YouTube Transcript Fetcher v1.0'); // Debug log

// Firefox compatibility layer - use browser API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Debug function to check current page state
const debugPageState = () => {
  console.log('=== YouTube Transcript Fetcher Debug ===');
  console.log('Current URL:', window.location.href);
  console.log('Is video page:', isVideoPage());
  console.log('Transcript available:', isTranscriptionAvailable());
  console.log('Existing button:', !!document.querySelector("#yt-transcript-fetcher-button"));
  
  // Check for transcript button variants
  const transcriptButtons = [
    "button[aria-label*='transcript']",
    "button[aria-label*='Transcript']", 
    "button[aria-label*='transcrição']",
    "button[aria-label*='transcripción']",
    "ytd-video-description-transcript-section-renderer button"
  ];
  
  transcriptButtons.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found transcript button with selector "${selector}":`, elements[0]);
    }
  });
  
  // Check for button containers
  const containers = [
    "#top-level-buttons-computed",
    "#menu-container #top-level-buttons",
    "#actions #top-level-buttons-computed"
  ];
  
  containers.forEach(selector => {
    const container = document.querySelector(selector);
    console.log(`Container "${selector}":`, !!container);
  });
  
  console.log('=======================================');
};

// Get interface language (now fixed to English)
const getInterfaceLanguage = async () => {
  return 'en';
};

// Create notification system
const createNotificationSystem = () => {
  const notificationContainer = document.createElement('div');
  notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  document.body.appendChild(notificationContainer);

  return {
    show: async ({ message, type = 'info', duration = 3000, actions = [] }) => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        background-color: ${type === 'warning' ? '#ffd700' : '#2ba640'};
        color: ${type === 'warning' ? '#000' : '#fff'};
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        opacity: 0;
        transform: translateX(50px);
        transition: all 0.3s ease;
      `;

      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      messageDiv.style.flex = '1';
      notification.appendChild(messageDiv);

      // Add action buttons if any
      actions.forEach(({ label, onClick }) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.cssText = `
          background: none;
          border: 1px solid ${type === 'warning' ? '#000' : '#fff'};
          color: ${type === 'warning' ? '#000' : '#fff'};
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;
        button.onclick = () => {
          onClick();
          notification.remove();
        };
        notification.appendChild(button);
      });

      notificationContainer.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 50);

      if (duration > 0) {
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transform = 'translateX(50px)';
          setTimeout(() => notification.remove(), 300);
        }, duration);
      }

      return notification;
    }
  };
};

// Initialize notification system
const notify = createNotificationSystem().show;

// Debounce mechanism to prevent rapid button creation
let buttonCreationTimeout = null;
const debouncedAddCopyButton = () => {
  if (buttonCreationTimeout) {
    clearTimeout(buttonCreationTimeout);
  }
  buttonCreationTimeout = setTimeout(() => {
    addCopyButton();
  }, 1000); // Wait 1 second before adding buttons
};

// Listen for changes in storage (removed interface language handling)

const translations = {
  en: {
    buttonText: "Copy Transcript",
    promptButtonText: "Select Prompt",
    loadingText: "Copying...",
    successText: (chars) => `Copied ${formatCharCount(chars)} chars!`,
    errorTooLong: "This transcript is quite long. Would you like to split it automatically?",
    partIndicator: "Part {current} of {total}",
    copied: "copied!",
    copyNext: "Copy Next Part",
    splitOptions: {
      auto: "Auto-split for ChatGPT"
    },
    promptTypes: {
      raw: { label: 'Raw Transcript', description: 'Copy transcript without any prompt or formatting' },
      bullet: { label: 'Bullet Points', description: 'Summarize in clear bullet points with sub-points' },
      section: { label: 'Sectioned Summary', description: 'Divide into logical sections with prose summaries' },
      detailed: { label: 'Detailed Analysis', description: 'Comprehensive overview with detailed explanations' },
      custom: { label: 'Custom Prompt', description: 'Use your own custom prompt text' }
    },
    prompts: {
      none: "",
      bullet: "Summarize the following YouTube video transcript in clear bulletpoints. For each main point, add up to one level of child bulletpoints for details or examples. Keep the summary concise and focused on the core ideas presented in the video.",
      section: "Summarize the following YouTube video transcript by dividing the content into logical sections. For each section, write a short prose summary (not bulletpoints) that describes the main ideas and supporting details. Use clear headings for each section, and ensure the summary flows smoothly.",
      detailed: "First, provide a brief overview (2-3 sentences) of the YouTube video's general topic and purpose. Then, summarize the main contents and ideas, reviewing each in 3-5 sentences. Focus on explaining key points, arguments, or concepts discussed in the video transcript. Make sure each idea is reviewed thoughtfully and clearly."
    }
  },
  pt: {
    buttonText: "Copiar Transcrição",
    promptButtonText: "Selecionar Prompt",
    loadingText: "Copiando...",
    successText: (chars) => `Copiado ${formatCharCount(chars)} caracteres!`,
    errorTooLong: "Esta transcrição é muito longa. Deseja ativar a divisão automática?",
    partIndicator: "Parte {current} de {total}",
    copied: "copiado!",
    copyNext: "Copiar Próxima Parte",
    splitOptions: {
      auto: "Divisão automática para ChatGPT"
    },
    promptTypes: {
      none: { label: 'Sem Prompt', description: 'Copiar transcrição sem nenhum prompt' },
      bullet: { label: 'Tópicos', description: 'Resumir em tópicos claros com sub-tópicos' },
      section: { label: 'Resumo por Seções', description: 'Dividir em seções lógicas com resumos em prosa' },
      detailed: { label: 'Análise Detalhada', description: 'Visão geral abrangente com explicações detalhadas' }
    },
    prompts: {
      none: "",
      bullet: "Resuma a seguinte transcrição de vídeo do YouTube em tópicos claros. Para cada ponto principal, adicione até um nível de sub-tópicos para detalhes ou exemplos. Mantenha o resumo conciso e focado nas ideias principais apresentadas no vídeo.",
      section: "Resuma a seguinte transcrição de vídeo do YouTube dividindo o conteúdo em seções lógicas. Para cada seção, escreva um resumo em prosa curto (não em tópicos) que descreva as ideias principais e detalhes de apoio. Use cabeçalhos claros para cada seção e garanta que o resumo flua suavemente.",
      detailed: "Primeiro, forneça uma visão geral breve (2-3 frases) do tópico geral e propósito do vídeo do YouTube. Em seguida, resuma os principais conteúdos e ideias, revisando cada um em 3-5 frases. Foque em explicar pontos-chave, argumentos ou conceitos discutidos na transcrição do vídeo. Certifique-se de que cada ideia seja revisada de forma cuidadosa e clara."
    }
  },
  es: {
    buttonText: "Copiar Transcripción",
    promptButtonText: "Seleccionar Prompt",
    loadingText: "Copiando...",
    successText: (chars) => `¡Copiado ${formatCharCount(chars)} caracteres!`,
    errorTooLong: "Esta transcripción es muy larga. ¿Deseas activar la división automática?",
    partIndicator: "Parte {current} de {total}",
    copied: "¡copiado!",
    copyNext: "Copiar Siguiente Parte",
    splitOptions: {
      auto: "División automática para ChatGPT"
    },
    promptTypes: {
      none: { label: 'Sin Prompt', description: 'Copiar transcripción sin ningún prompt' },
      bullet: { label: 'Puntos Clave', description: 'Resumir en puntos claros con sub-puntos' },
      section: { label: 'Resumen por Secciones', description: 'Dividir en secciones lógicas con resúmenes en prosa' },
      detailed: { label: 'Análisis Detallado', description: 'Visión general comprensiva con explicaciones detalladas' }
    },
    prompts: {
      none: "",
      bullet: "Resume la siguiente transcripción de video de YouTube en puntos claros. Para cada punto principal, agrega hasta un nivel de sub-puntos para detalles o ejemplos. Mantén el resumen conciso y enfocado en las ideas principales presentadas en el video.",
      section: "Resume la siguiente transcripción de video de YouTube dividiendo el contenido en secciones lógicas. Para cada sección, escribe un resumen en prosa corto (no en puntos) que describa las ideas principales y detalles de apoyo. Usa encabezados claros para cada sección y asegúrate de que el resumen fluya suavemente.",
      detailed: "Primero, proporciona una visión general breve (2-3 oraciones) del tema general y propósito del video de YouTube. Luego, resume los principales contenidos e ideas, revisando cada uno en 3-5 oraciones. Enfócate en explicar puntos clave, argumentos o conceptos discutidos en la transcripción del video. Asegúrate de que cada idea sea revisada de manera reflexiva y clara."
    }
  }
};

const formatCharCount = (count) => {
  if (count >= 1000) {
    return `${Math.round(count / 1000)}k`;
  }
  return count.toString();
};

const addCopyButton = async () => {
  const existingContainer = document.querySelector("#yt-transcript-fetcher-container");
  if (existingContainer) return;

  // Additional safety check - remove any existing containers first
  const allContainers = document.querySelectorAll("#yt-transcript-fetcher-container");
  
  // Remove all existing containers to prevent duplicates
  allContainers.forEach(container => container.remove());

  const interfaceLanguage = await getInterfaceLanguage();
  
  // Try multiple possible button containers
  const possibleContainers = [
    "#top-level-buttons-computed",
    "#menu-container #top-level-buttons",
    ".ytd-menu-renderer #top-level-buttons-computed",
    "#actions #top-level-buttons-computed",
    "#actions-inner #top-level-buttons-computed"
  ];
  
  let buttonsContainer = null;
  for (const selector of possibleContainers) {
    buttonsContainer = document.querySelector(selector);
    if (buttonsContainer) break;
  }
  
  if (!buttonsContainer) {
    console.log("Could not find buttons container");
    return;
  }

  // Create the segmented button container
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "yt-transcript-fetcher-container";
  buttonContainer.style.cssText = `
    display: flex;
    margin-right: 8px;
    border-radius: 18px;
    overflow: hidden;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  `;

  // Create the copy transcript button (left segment)
  const copyButton = document.createElement("button");
  copyButton.id = "yt-transcript-fetcher-button";
  copyButton.className = "yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--segmented-start yt-spec-button-shape-next--enable-backdrop-filter-experiment";
  copyButton.setAttribute("aria-label", "Copy Transcript");
  copyButton.setAttribute("aria-pressed", "false");
  copyButton.setAttribute("aria-disabled", "false");
  copyButton.style.cssText = `
    border-radius: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    background: transparent;
    border: none;
    color: white;
  `;
  
  // Set icon with text for copy button
  copyButton.innerHTML = `
    <div class="yt-spec-button-shape-next__icon" aria-hidden="true">
      <span class="ytIconWrapperHost" style="width: 24px; height: 24px;">
        <span class="yt-icon-shape ytSpecIconShapeHost">
          <div style="width: 100%; height: 100%; display: block; fill: currentcolor;">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"></path>
            </svg>
          </div>
        </span>
      </span>
    </div>
    <div class="yt-spec-button-shape-next__button-text-content">Transcript</div>
    <yt-touch-feedback-shape aria-hidden="true" class="yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response">
      <div class="yt-spec-touch-feedback-shape__stroke"></div>
      <div class="yt-spec-touch-feedback-shape__fill"></div>
    </yt-touch-feedback-shape>
  `;

  // Create the prompt selector button with YouTube's exact structure
  const promptButton = document.createElement("button");
  promptButton.id = "yt-transcript-prompt-selector-button";
  promptButton.className = "yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-button yt-spec-button-shape-next--segmented-end yt-spec-button-shape-next--enable-backdrop-filter-experiment";
  promptButton.setAttribute("aria-label", translations.en.promptButtonText);
  promptButton.setAttribute("aria-pressed", "false");
  promptButton.setAttribute("aria-disabled", "false");
  promptButton.style.cssText = `
    border-radius: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    background: transparent;
    border: none;
    color: white;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  // Set icon-only button HTML with YouTube's structure - Settings/Gear icon
  promptButton.innerHTML = `
    <div class="yt-spec-button-shape-next__icon" aria-hidden="true">
      <span class="ytIconWrapperHost" style="width: 24px; height: 24px;">
        <span class="yt-icon-shape ytSpecIconShapeHost">
          <div style="width: 100%; height: 100%; display: block; fill: currentcolor;">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"></path>
            </svg>
          </div>
        </span>
      </span>
    </div>
    <yt-touch-feedback-shape aria-hidden="true" class="yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response">
      <div class="yt-spec-touch-feedback-shape__stroke"></div>
      <div class="yt-spec-touch-feedback-shape__fill"></div>
    </yt-touch-feedback-shape>
  `;

  // Add buttons to the segmented container
  buttonContainer.appendChild(copyButton);
  buttonContainer.appendChild(promptButton);
  
  
  // Insert the segmented container as first child of the buttons container
  buttonsContainer.insertBefore(buttonContainer, buttonsContainer.firstChild);

  // Add click event listener
  copyButton.addEventListener("click", async () => {
    try {
      // Get current settings
      const settings = await browserAPI.storage.sync.get({
        includeTimestamps: true,
        redirectToChatGPT: true,
        redirectDestination: 'chatgpt',
        autoPaste: true,
        promptLanguage: 'en',
        promptType: 'raw',
        splitType: 'none',
        llmModel: 'gpt35',
        customCharLimit: 13000,
        customPromptText: ''
      });
      
      console.log('All settings loaded:', settings);

      // Find and click the transcript button if it exists
      const transcriptSelectors = [
        "ytd-video-description-transcript-section-renderer button",
        "button[aria-label*='transcript']",
        "button[aria-label*='Transcript']",
        "button[aria-label*='transcrição']",
        "button[aria-label*='transcripción']",
        "[aria-label*='Show transcript']",
        "[aria-label*='Mostrar transcrição']",
        "[aria-label*='Mostrar transcripción']"
      ];
      
      let transcriptButton = null;
      for (const selector of transcriptSelectors) {
        transcriptButton = document.querySelector(selector);
        if (transcriptButton) break;
      }
      
      if (transcriptButton) {
        transcriptButton.click();
      }

      // Wait for transcript panel to open and content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get transcript text with better error handling
      const transcriptSegmentSelectors = [
        "ytd-transcript-segment-renderer",
        ".ytd-transcript-segment-renderer",
        "[role='button'] .ytd-transcript-segment-renderer"
      ];
      
      let transcriptItems = [];
      for (const selector of transcriptSegmentSelectors) {
        transcriptItems = document.querySelectorAll(selector);
        if (transcriptItems.length > 0) break;
      }
      
      if (transcriptItems.length === 0) {
        console.error("No transcript segments found. Available selectors:", 
          transcriptSegmentSelectors.map(s => document.querySelectorAll(s).length));
        notify({
          message: "No transcript found. Make sure transcripts are available for this video.",
          type: 'warning'
        });
        return;
      }
      
      console.log(`Found ${transcriptItems.length} transcript segments`); // Debug log

      // Build transcript text with optional timestamps
      const transcriptText = Array.from(transcriptItems)
        .map(segment => {
          const textElement = segment.querySelector("[class*='segment-text']") || 
                             segment.querySelector("#content") ||
                             segment.querySelector("#text");
          const timestampElement = segment.querySelector("[class*='segment-timestamp']") ||
                                  segment.querySelector("#timestamp");
          
          const text = textElement ? textElement.textContent.trim() : '';
          const timestamp = timestampElement ? timestampElement.textContent.trim() : '';
          
          return settings.includeTimestamps ? `${timestamp} ${text}` : text;
        })
        .filter(text => text)
        .join("\n");

      // Add prompt (handle raw transcript case)
      let finalText = transcriptText;
      if (settings.promptType !== 'raw') {
        let prompt;
        if (settings.promptType === 'custom') {
          // Use custom prompt from storage
          prompt = settings.customPromptText || '';
        } else {
          // Use predefined prompt
          prompt = translations[settings.promptLanguage]?.prompts[settings.promptType] || translations.en.prompts[settings.promptType];
        }
        if (prompt) {
          finalText = `${prompt}\n\n${transcriptText}`;
        }
      }
      // For 'raw' mode, finalText remains as just the transcriptText

      // Handle text splitting if auto-split is enabled
      if (settings.splitType === 'auto') {
        const charLimit = settings.llmModel === 'gpt4' ? 400000 :
                         settings.llmModel === 'gpt35' ? 13000 :
                         settings.customCharLimit;

        if (finalText.length > charLimit) {
          const parts = splitText(finalText, charLimit);
          let currentPart = 0;

          const copyNextPart = async () => {
            try {
              await navigator.clipboard.writeText(parts[currentPart]);
              
              if (currentPart < parts.length - 1) {
                notify({
                  message: translations[settings.promptLanguage]?.partIndicator || translations.en.partIndicator
                    .replace('{current}', currentPart + 1)
                    .replace('{total}', parts.length),
                  type: 'info',
                  duration: 0,
                  actions: [{
                    label: translations[settings.promptLanguage]?.copyNext || translations.en.copyNext,
                    onClick: () => {
                      currentPart++;
                      copyNextPart();
                    }
                  }]
                });
              } else {
                notify({
                  message: translations[settings.promptLanguage]?.successText(finalText.length) || translations.en.successText(finalText.length),
                  type: 'success'
                });
                
                // Redirect if enabled
                console.log('Redirect settings:', { enabled: settings.redirectToChatGPT, destination: settings.redirectDestination });
                if (settings.redirectToChatGPT) {
                  console.log('Scheduling redirect in 1 second...');
                  setTimeout(() => redirectToDestination(settings.redirectDestination, finalText, settings.autoPaste), 500);
                }
              }
            } catch (err) {
              console.error("Failed to copy transcript part:", err);
              notify({
                message: "Failed to copy text. Please try again.",
                type: 'warning'
              });
            }
          };

          // Start copying the first part immediately
          copyNextPart();
          return;
        }
      }

      // Copy to clipboard if no splitting needed
      await navigator.clipboard.writeText(finalText);
      notify({
        message: translations[settings.promptLanguage]?.successText(finalText.length) || translations.en.successText(finalText.length),
        type: 'success'
      });
      
      // Redirect if enabled
      console.log('Redirect settings:', { enabled: settings.redirectToChatGPT, destination: settings.redirectDestination });
      if (settings.redirectToChatGPT) {
        console.log('Scheduling redirect in 1 second...');
        setTimeout(() => redirectToDestination(settings.redirectDestination, finalText, settings.autoPaste), 500);
      }
    } catch (err) {
      console.error("Failed to copy transcript:", err);
      notify({
        message: "Failed to copy transcript. Please try again.",
        type: 'warning'
      });
    }
  });

  // Add click event listener for prompt selector button
  promptButton.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      showPromptSelectorDialog();
    } catch (err) {
      console.error("Failed to show prompt selector:", err);
      notify({
        message: "Failed to open prompt selector. Please try again.",
        type: 'warning'
      });
    }
  };
};

// Function to show prompt selector dialog
const showPromptSelectorDialog = async () => {
  // Remove any existing dialog
  const existingDialog = document.querySelector("#yt-prompt-selector-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create dialog overlay
  const dialog = document.createElement("div");
  dialog.id = "yt-prompt-selector-dialog";
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Roboto", "Arial", sans-serif;
  `;

  // Create dialog content
  const dialogContent = document.createElement("div");
  dialogContent.style.cssText = `
    background-color: #fff;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    position: relative;
  `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;
  `;

  const title = document.createElement("h2");
  title.textContent = translations.en.promptButtonText;
  title.style.cssText = `
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: #0f0f0f;
  `;

  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #606060;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  `;
  closeButton.onmouseover = () => closeButton.style.backgroundColor = "#f0f0f0";
  closeButton.onmouseout = () => closeButton.style.backgroundColor = "transparent";
  closeButton.onclick = () => dialog.remove();

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create main content container with side-by-side layout
  const mainContent = document.createElement("div");
  mainContent.style.cssText = `
    display: flex;
    gap: 20px;
    min-height: 400px;
  `;

  // Create prompt options container
  const promptOptions = document.createElement("div");
  promptOptions.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-width: 300px;
  `;

  // Create preview container
  const previewContainer = document.createElement("div");
  previewContainer.style.cssText = `
    flex: 1;
    min-width: 300px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    background-color: #f9f9f9;
    position: relative;
  `;

  const previewTitle = document.createElement("h3");
  previewTitle.textContent = "Prompt Preview";
  previewTitle.style.cssText = `
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 500;
    color: #0f0f0f;
  `;

  const previewContent = document.createElement("div");
  previewContent.id = "prompt-preview-content";
  previewContent.style.cssText = `
    font-size: 14px;
    line-height: 1.5;
    color: #333;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 300px;
    overflow-y: auto;
  `;

  // Default preview text
  previewContent.textContent = "Select a prompt option to see its preview here...";

  previewContainer.appendChild(previewTitle);
  previewContainer.appendChild(previewContent);


  const promptTypes = [
    { key: 'raw', label: translations.en.promptTypes.raw.label, description: translations.en.promptTypes.raw.description },
    { key: 'bullet', label: translations.en.promptTypes.bullet.label, description: translations.en.promptTypes.bullet.description },
    { key: 'section', label: translations.en.promptTypes.section.label, description: translations.en.promptTypes.section.description },
    { key: 'detailed', label: translations.en.promptTypes.detailed.label, description: translations.en.promptTypes.detailed.description },
    { key: 'custom', label: translations.en.promptTypes.custom.label, description: translations.en.promptTypes.custom.description }
  ];

  promptTypes.forEach(promptType => {
    const option = document.createElement("div");
    option.style.cssText = `
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
      background-color: #fff;
    `;

    const label = document.createElement("div");
    label.textContent = promptType.label;
    label.style.cssText = `
      font-weight: 500;
      font-size: 16px;
      color: #0f0f0f;
      margin-bottom: 4px;
    `;

    const description = document.createElement("div");
    description.textContent = promptType.description;
    description.style.cssText = `
      font-size: 14px;
      color: #606060;
      line-height: 1.4;
    `;

    // Add a select button
    const selectButton = document.createElement("button");
    selectButton.textContent = "Select";
    selectButton.style.cssText = `
      margin-top: 8px;
      padding: 6px 12px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: background-color 0.2s;
    `;
    selectButton.onmouseover = () => selectButton.style.backgroundColor = "#1565c0";
    selectButton.onmouseout = () => selectButton.style.backgroundColor = "#1976d2";

    option.appendChild(label);
    option.appendChild(description);
    option.appendChild(selectButton);

    // Add hover effects and preview functionality
    option.onmouseover = () => {
      option.style.borderColor = "#1976d2";
      option.style.backgroundColor = "#f5f5f5";
      
      // Show preview
      let previewText = "";
      if (promptType.key === 'raw') {
        previewText = "Transcript will be copied as-is without any prompt or formatting.";
      } else if (promptType.key === 'custom') {
        // Try to get custom prompt from storage
        browserAPI.storage.sync.get({ customPromptText: '' }).then(settings => {
          if (settings.customPromptText) {
            previewContent.textContent = settings.customPromptText;
          } else {
            previewContent.textContent = "No custom prompt saved yet. Click to create one.";
          }
        });
        return;
      } else {
        // Get the actual prompt text
        const promptText = translations.en.prompts[promptType.key] || "";
        previewText = promptText;
      }
      previewContent.textContent = previewText;
    };
    option.onmouseout = () => {
      option.style.borderColor = "#e0e0e0";
      option.style.backgroundColor = "#fff";
    };

    // Add click handler for the select button
    selectButton.onclick = async (e) => {
      e.stopPropagation();
      
      // Handle selection
      if (promptType.key === 'custom') {
        // Show custom prompt input dialog
        showCustomPromptDialog(dialog);
      } else {
        try {
          // Update the prompt type in storage
          await browserAPI.storage.sync.set({
            promptType: promptType.key
          });

          // Show success notification
          notify({
            message: `Prompt set to: ${promptType.label}`,
            type: 'success'
          });

          // Close dialog
          dialog.remove();
        } catch (err) {
          console.error("Failed to save prompt selection:", err);
          notify({
            message: "Failed to save prompt selection. Please try again.",
            type: 'warning'
          });
        }
      }
    };

    // Add click handler for the option (preview only)
    option.onclick = async (e) => {
      // Don't trigger if clicking the select button
      if (e.target === selectButton) return;
      
      // Show preview
      let previewText = "";
      if (promptType.key === 'raw') {
        previewText = "Transcript will be copied as-is without any prompt or formatting.";
      } else if (promptType.key === 'custom') {
        // Try to get custom prompt from storage
        const settings = await browserAPI.storage.sync.get({ customPromptText: '' });
        if (settings.customPromptText) {
          previewText = settings.customPromptText;
        } else {
          previewText = "No custom prompt saved yet. Click to create one.";
        }
      } else {
        // Get the actual prompt text
        const promptText = translations.en.prompts[promptType.key] || "";
        previewText = promptText;
      }
      previewContent.textContent = previewText;
    };

    promptOptions.appendChild(option);
  });

  // Create footer with current selection info
  const footer = document.createElement("div");
  footer.style.cssText = `
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
    font-size: 14px;
    color: #606060;
    text-align: center;
  `;

  // Get current prompt type
  try {
    const settings = await browserAPI.storage.sync.get({
      promptType: 'none'
    });
    const currentPrompt = promptTypes.find(p => p.key === settings.promptType);
    if (currentPrompt) {
      footer.textContent = `Current selection: ${currentPrompt.label}`;
    }
  } catch (err) {
    console.error("Failed to get current prompt type:", err);
  }

  // Add content to main content
  mainContent.appendChild(promptOptions);
  mainContent.appendChild(previewContainer);

  // Add info message about extension settings
  const infoMessage = document.createElement("div");
  infoMessage.style.cssText = `
    margin-top: 16px;
    padding: 12px 16px;
    background-color: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 8px;
    font-size: 14px;
    color: #1976d2;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  infoMessage.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink: 0;">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11V9Z"></path>
    </svg>
    <span>For more settings like timestamps, redirect options, and text splitting, click the extension icon in your browser toolbar.</span>
  `;

  dialogContent.appendChild(header);
  dialogContent.appendChild(mainContent);
  dialogContent.appendChild(infoMessage);
  dialogContent.appendChild(footer);
  dialog.appendChild(dialogContent);


  // Add click outside to close
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  };

  // Add to document
  document.body.appendChild(dialog);

  // Focus the dialog for accessibility
  dialog.focus();
};

// Function to show custom prompt input dialog
const showCustomPromptDialog = async (parentDialog) => {
  // Remove any existing custom prompt dialog
  const existingDialog = document.querySelector("#yt-custom-prompt-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create custom prompt dialog overlay
  const customDialog = document.createElement("div");
  customDialog.id = "yt-custom-prompt-dialog";
  customDialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Roboto", "Arial", sans-serif;
  `;

  // Create dialog content
  const dialogContent = document.createElement("div");
  dialogContent.style.cssText = `
    background-color: #fff;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    position: relative;
  `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;
  `;

  const title = document.createElement("h2");
  title.textContent = "Custom Prompt";
  title.style.cssText = `
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: #0f0f0f;
  `;

  const closeButton = document.createElement("button");
  closeButton.innerHTML = "×";
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #606060;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  `;
  closeButton.onmouseover = () => closeButton.style.backgroundColor = "#f0f0f0";
  closeButton.onmouseout = () => closeButton.style.backgroundColor = "transparent";
  closeButton.onclick = () => {
    customDialog.remove();
    parentDialog.remove();
  };

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create textarea for custom prompt
  const textareaContainer = document.createElement("div");
  textareaContainer.style.cssText = `
    margin-bottom: 20px;
  `;

  const label = document.createElement("label");
  label.textContent = "Enter your custom prompt:";
  label.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #0f0f0f;
  `;

  const textarea = document.createElement("textarea");
  textarea.id = "customPromptText";
  textarea.placeholder = "Enter your custom prompt here...";
  textarea.style.cssText = `
    width: 100%;
    height: 120px;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-family: "Roboto", "Arial", sans-serif;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
    transition: border-color 0.2s;
  `;
  textarea.onfocus = () => textarea.style.borderColor = "#1976d2";
  textarea.onblur = () => textarea.style.borderColor = "#e0e0e0";

  // Load existing custom prompt if any
  try {
    const settings = await browserAPI.storage.sync.get({
      customPromptText: ''
    });
    textarea.value = settings.customPromptText || '';
  } catch (err) {
    console.error("Failed to load custom prompt:", err);
  }

  textareaContainer.appendChild(label);
  textareaContainer.appendChild(textarea);

  // Create buttons container
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #333;
    cursor: pointer;
    font-size: 14px;
  `;
  cancelButton.onclick = () => {
    customDialog.remove();
    parentDialog.remove();
  };

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Custom Prompt";
  saveButton.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #1976d2;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
  `;
  saveButton.onclick = async () => {
    try {
      const customPromptText = textarea.value.trim();
      
      if (!customPromptText) {
        notify({
          message: "Please enter a custom prompt",
          type: 'warning'
        });
        return;
      }

      // Save custom prompt and set prompt type to custom
      await browserAPI.storage.sync.set({
        promptType: 'custom',
        customPromptText: customPromptText
      });

      // Show success notification
      notify({
        message: "Custom prompt saved successfully!",
        type: 'success'
      });

      // Close both dialogs
      customDialog.remove();
      parentDialog.remove();
    } catch (err) {
      console.error("Failed to save custom prompt:", err);
      notify({
        message: "Failed to save custom prompt. Please try again.",
        type: 'warning'
      });
    }
  };

  buttonsContainer.appendChild(cancelButton);
  buttonsContainer.appendChild(saveButton);

  dialogContent.appendChild(header);
  dialogContent.appendChild(textareaContainer);
  dialogContent.appendChild(buttonsContainer);
  customDialog.appendChild(dialogContent);

  // Add click outside to close
  customDialog.onclick = (e) => {
    if (e.target === customDialog) {
      customDialog.remove();
      parentDialog.remove();
    }
  };

  // Add to document
  document.body.appendChild(customDialog);

  // Focus the textarea
  textarea.focus();
};

// Helper function to redirect to the selected destination
const redirectToDestination = async (destination, transcriptText, autoPaste) => {
  try {
    console.log('Attempting to redirect to:', destination, 'with auto-paste:', autoPaste);
    let url;
    
    if (autoPaste && transcriptText) {
      // Store the transcript text for auto-pasting
      await browserAPI.storage.local.set({
        autoPasteText: transcriptText,
        autoPasteDestination: destination,
        autoPasteTimestamp: Date.now()
      });
    }
    
    switch (destination) {
      case 'chatgpt':
        url = 'https://chatgpt.com/?model=auto';
        break;
      case 'claude':
        url = 'https://claude.ai/new';
        break;
      case 'gemini':
        url = 'https://gemini.google.com/app';
        break;
      case 'mistral':
        url = 'https://chat.mistral.ai/chat';
        break;
      case 'copilot':
        url = 'https://github.com/copilot';
        break;
      default:
        url = 'https://chatgpt.com/?model=auto';
    }
    
    console.log('Opening URL:', url);
    
    // Send message to background script to open tab
    const response = await browserAPI.runtime.sendMessage({
      action: 'openTab',
      url: url
    });
    
    if (response && response.success) {
      console.log('Tab created successfully');
    } else {
      console.error('Failed to create tab:', response?.error);
    }
  } catch (error) {
    console.error('Failed to redirect:', error);
  }
};

// Helper function to split text
const splitText = (text, limit) => {
  const parts = [];
  let currentPart = '';
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentPart + sentence).length > limit) {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = '';
      }
      if (sentence.length > limit) {
        // Handle very long sentences by splitting at spaces
        const words = sentence.split(/\s+/);
        let chunk = '';
        for (const word of words) {
          if ((chunk + ' ' + word).length > limit) {
            parts.push(chunk.trim());
            chunk = word;
          } else {
            chunk = chunk ? chunk + ' ' + word : word;
          }
        }
        if (chunk) {
          currentPart = chunk + ' ';
        }
      } else {
        currentPart = sentence + ' ';
      }
    } else {
      currentPart += sentence + ' ';
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  return parts;
};

// Function to check if we're on a video page
const isVideoPage = () => window.location.pathname.includes('/watch');

// Function to check if transcription is available
const isTranscriptionAvailable = () => {
  // Check for transcript button with various language labels
  const transcriptSelectors = [
    "button[aria-label*='transcript']",
    "button[aria-label*='Transcript']", 
    "button[aria-label*='transcrição']",
    "button[aria-label*='transcripción']",
    "button[aria-label*='transkription']",
    "button[aria-label*='字幕']",
    "ytd-video-description-transcript-section-renderer button",
    "[aria-label*='Show transcript']",
    "[aria-label*='Mostrar transcrição']",
    "[aria-label*='Mostrar transcripción']"
  ];
  
  return transcriptSelectors.some(selector => document.querySelector(selector));
};

// Initial check with retry mechanism
const initializeButton = () => {
  debugPageState(); // Debug current state
  
  if (isVideoPage()) {
    console.log('Video page detected'); // Debug log
    
    // Wait for page to fully load, then check multiple times
    const checkTranscript = (attempt = 0) => {
      if (attempt > 10) {
        console.log('Max attempts reached, transcript may not be available');
        return;
      }
      
      if (isTranscriptionAvailable()) {
        console.log('Transcription button found'); // Debug log
        debouncedAddCopyButton();
      } else {
        console.log(`Transcript check attempt ${attempt + 1}/10`); // Debug log
        setTimeout(() => checkTranscript(attempt + 1), 500); // Retry every 500ms
      }
    };
    
    // Start checking after a brief delay
    setTimeout(() => checkTranscript(), 1000);
  }
};

// Add manual debug function accessible from console
window.debugYouTubeTranscriptFetcher = debugPageState;

initializeButton();

// Update the observer to be more specific and handle navigation
const observer = new MutationObserver((mutations) => {
  // Check for URL changes (YouTube is a SPA)
  if (window.location.href !== observer.lastUrl) {
    observer.lastUrl = window.location.href;
    if (isVideoPage()) {
      // New video loaded, reinitialize
      setTimeout(() => {
        if (isTranscriptionAvailable()) {
          debouncedAddCopyButton();
        }
      }, 3000); // Wait longer for new video to load
    }
  }
  
  // Also check if transcript becomes available on current page
  if (isVideoPage() && isTranscriptionAvailable()) {
    // Remove any duplicate containers first
    const containers = document.querySelectorAll("#yt-transcript-fetcher-container");
    
    // Remove duplicate containers
    if (containers.length > 1) {
      for (let i = 1; i < containers.length; i++) {
        containers[i].remove();
      }
    }
    
    // Only add container if none exist
    if (containers.length === 0) {
      debouncedAddCopyButton();
    }
  }
});

// Initialize the observer's URL tracking
observer.lastUrl = window.location.href;

// Make the observer more specific to reduce unnecessary checks
observer.observe(document.body, {
  childList: true,
  subtree: false, // Only observe direct children, not the entire subtree
  attributes: false,
  characterData: false
});
