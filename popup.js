// Firefox compatibility layer - use browser API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const TRANSLATIONS = {
  en: {
    buttonText: "Copy Transcript",
    loadingText: "Copying...",
    successText: "Copied!",
    summarizePrompt: "Please summarize this video transcript:",
    interfaceLanguage: "Interface Language",
    splitOptions: "Split Options",
    llmModel: "LLM Model",
    characterLimit: "Character Limit",
    includeTimestamps: "Include timestamps in copied text",
    redirectAfterCopy: "Redirect after copying",
    redirectDestination: "Redirect Destination",
    autoPaste: "Auto-paste transcript on redirect",
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    mistral: "Mistral",
    copilot: "GitHub Copilot",
    settingsSaved: "Settings saved",
    autoSplit: "Auto-split for LLMs",
    noSplit: "No split",
    customLimit: "Custom limit",
    extensionSettings: "Extension Settings",
    promptLanguage: "Prompt Language",
    promptType: "Prompt Type",
    noPrompt: "No Prompt",
    bulletSummary: "Bulletpoint Summary",
    sectionedProse: "Sectioned Prose Summary", 
    briefOverviewIdeas: "Brief Overview, then Ideas Review",
    chars: "chars",
    gpt4: "GPT-4 (400k chars)",
    gpt35: "GPT-3.5 (13k chars)",
    customLimitOption: "Custom limit"
  },
  pt: {
    buttonText: "Copiar Transcrição",
    loadingText: "Copiando...",
    successText: "Copiado!",
    summarizePrompt: "Por favor, resuma esta transcrição do vídeo:",
    interfaceLanguage: "Idioma da Interface",
    splitOptions: "Opções de Divisão",
    llmModel: "Modelo LLM",
    characterLimit: "Limite de Caracteres",
    includeTimestamps: "Incluir marcadores de tempo no texto copiado",
    redirectAfterCopy: "Redirecionar após copiar",
    redirectDestination: "Destino do Redirecionamento",
    autoPaste: "Colar automaticamente a transcrição no redirecionamento",
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    mistral: "Mistral",
    copilot: "GitHub Copilot",
    settingsSaved: "Configurações salvas",
    autoSplit: "Divisão automática para LLMs",
    noSplit: "Sem divisão",
    customLimit: "Limite personalizado",
    extensionSettings: "Configurações da Extensão",
    promptLanguage: "Idioma do Prompt",
    promptType: "Tipo de Prompt",
    noPrompt: "Sem Prompt",
    bulletSummary: "Resumo em Tópicos",
    sectionedProse: "Resumo em Prosa por Seções",
    briefOverviewIdeas: "Visão Geral, depois Revisão de Ideias",
    chars: "caracteres",
    gpt4: "GPT-4 (400k caracteres)",
    gpt35: "GPT-3.5 (13k caracteres)",
    customLimitOption: "Limite personalizado"
  },
  es: {
    buttonText: "Copiar Transcripción",
    loadingText: "Copiando...",
    successText: "¡Copiado!",
    summarizePrompt: "Por favor, resume esta transcripción del video:",
    interfaceLanguage: "Idioma de la Interfaz",
    splitOptions: "Opciones de División",
    llmModel: "Modelo LLM",
    characterLimit: "Límite de Caracteres",
    includeTimestamps: "Incluir marcas de tiempo en el texto copiado",
    redirectAfterCopy: "Redirigir después de copiar",
    redirectDestination: "Destino del Redireccionamiento",
    autoPaste: "Pegar automáticamente la transcripción al redirigir",
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    mistral: "Mistral",
    copilot: "GitHub Copilot",
    settingsSaved: "Configuración guardada",
    autoSplit: "División automática para LLMs",
    noSplit: "Sin división",
    customLimit: "Límite personalizado",
    extensionSettings: "Configuración de la Extensión",
    promptLanguage: "Idioma del Prompt",
    promptType: "Tipo de Prompt",
    noPrompt: "Sin Prompt",
    bulletSummary: "Resumen en Puntos",
    sectionedProse: "Resumen en Prosa por Secciones",
    briefOverviewIdeas: "Visión General, luego Revisión de Ideas",
    chars: "caracteres",
    gpt4: "GPT-4 (400k caracteres)",
    gpt35: "GPT-3.5 (13k caracteres)",
    customLimitOption: "Límite personalizado"
  }
};

const saveOptions = () => {
  const includeTimestamps = document.getElementById('includeTimestamps').checked;
  const redirectToChatGPT = document.getElementById('redirectToChatGPT').checked;
  const redirectDestination = document.getElementById('redirectDestination').value;
  const autoPaste = document.getElementById('autoPaste').checked;
  const promptLanguage = document.getElementById('promptLanguage').value;
  const splitType = document.getElementById('splitType').value;
  const llmModel = document.getElementById('llmModel').value;
  const customCharLimit = parseInt(document.getElementById('customCharLimit').value) || 13000;
  
  browserAPI.storage.sync.set(
    {
      includeTimestamps,
      redirectToChatGPT,
      redirectDestination,
      autoPaste,
      promptLanguage,
      splitType,
      llmModel,
      customCharLimit
    },
    () => {
      updateVisibility();
      const status = document.getElementById('status');
      status.textContent = 'Settings saved';
      setTimeout(() => {
        status.textContent = '';
      }, 500);
    }
  );
};

const restoreOptions = () => {
  browserAPI.storage.sync.get(
    {
      includeTimestamps: true,
      redirectToChatGPT: true,
      redirectDestination: 'chatgpt',
      autoPaste: true,
      promptLanguage: 'en',
      splitType: 'none',
      llmModel: 'gpt35',
      customCharLimit: 13000
    },
    (items) => {
      document.getElementById('includeTimestamps').checked = items.includeTimestamps;
      document.getElementById('redirectToChatGPT').checked = items.redirectToChatGPT;
      document.getElementById('redirectDestination').value = items.redirectDestination;
      document.getElementById('autoPaste').checked = items.autoPaste;
      document.getElementById('promptLanguage').value = items.promptLanguage;
      document.getElementById('splitType').value = items.splitType;
      document.getElementById('llmModel').value = items.llmModel;
      document.getElementById('customCharLimit').value = items.customCharLimit;
      
      updateVisibility();
    }
  );
};

const updateVisibility = () => {
  const splitType = document.getElementById('splitType').value;
  const llmModel = document.getElementById('llmModel').value;
  const redirectEnabled = document.getElementById('redirectToChatGPT').checked;
  
  document.getElementById('modelContainer').classList.toggle('hidden', splitType !== 'auto');
  document.getElementById('customLimitContainer').classList.toggle('hidden', 
    splitType !== 'auto' || llmModel !== 'custom');
  document.getElementById('redirectOptionsContainer').classList.toggle('hidden', !redirectEnabled);
  document.getElementById('autoPasteContainer').classList.toggle('hidden', !redirectEnabled);
};

const updateInterfaceLanguage = (language) => {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (TRANSLATIONS[language][key]) {
      if (element.tagName === 'LABEL') {
        const textNode = Array.from(element.childNodes)
          .find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = TRANSLATIONS[language][key];
        }
      } else if (element.tagName === 'SPAN') {
        element.textContent = TRANSLATIONS[language][key];
      } else {
        element.textContent = TRANSLATIONS[language][key];
      }
    }
  });

  document.querySelectorAll('option[data-i18n]').forEach(option => {
    const key = option.getAttribute('data-i18n');
    if (TRANSLATIONS[language][key]) {
      option.textContent = TRANSLATIONS[language][key];
    }
  });
};

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('includeTimestamps').addEventListener('change', saveOptions);
document.getElementById('redirectToChatGPT').addEventListener('change', () => {
  updateVisibility();
  saveOptions();
});
document.getElementById('redirectDestination').addEventListener('change', saveOptions);
document.getElementById('autoPaste').addEventListener('change', saveOptions);
document.getElementById('promptLanguage').addEventListener('change', saveOptions);
document.getElementById('splitType').addEventListener('change', () => {
  updateVisibility();
  saveOptions();
});
document.getElementById('llmModel').addEventListener('change', () => {
  updateVisibility();
  saveOptions();
});
document.getElementById('customCharLimit').addEventListener('change', saveOptions);
