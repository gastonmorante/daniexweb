/**
 * Dany Experiences - Stitch Integration Script
 * Integrates Miatz AI Chat, Lead Capture, and Payment Checkouts.
 * 
 * Instructions:
 * 1. Paste this script before the closing </body> tag of your Stitch HTML file.
 * 2. Update BACKEND_URL with your production backend URL (e.g., your Render service URL).
 * 3. Make sure to assign the corresponding IDs or data attributes to your HTML elements.
 */

(function () {
  // CONFIGURATION: Set your backend API base URL here
  const BACKEND_URL = window.location.origin; 

  // DOM SELECTORS
  const SELECTORS = {
    chatContainer: '#ai-agent-container',
    chatInput: '#ai-agent-container input, #ai-agent-container textarea, #ai-agent-input',
    chatSendBtn: '#ai-agent-send',
    chatMessages: '#ai-agent-messages, #ai-agent-container .overflow-y-auto, #ai-agent-container .scroll-area',
    planWithAiBtn: '#plan-with-ai-btn',
    bookChichenBtn: '#book-chichen-btn',
    bookTortugaBtn: '#book-tortuga-btn',
    bookTulumBtn: '#book-tulum-btn'
  };

  // State
  let chatHistory = [];
  let userLanguage = 'es'; // default

  // Helper: Detect language from text
  function detectLanguage(text) {
    const cleanText = text.toLowerCase().trim();
    if (cleanText.startsWith('hello') || cleanText.startsWith('hi') || cleanText.includes('the jungle') || cleanText.includes('how much')) {
      return 'en';
    }
    if (cleanText.startsWith('bonjour') || cleanText.startsWith('salut') || cleanText.includes('s\'il vous')) {
      return 'fr';
    }
    if (cleanText.startsWith('ciao') || cleanText.includes('per favore') || cleanText.includes('giungla')) {
      return 'it';
    }
    if (cleanText.startsWith('oi') || cleanText.startsWith('olá') || cleanText.includes('por favor') || cleanText.includes('selva')) {
      return 'pt';
    }
    return 'es';
  }

  // Helper: Get initial greeting based on language
  function getInitialGreeting(lang) {
    const greetings = {
      es: '¡Hola! Soy Miatz, tu asistente de IA. He preparado algunas rutas exclusivas hoy con Dany, ¿prefieres la selva o el mar?',
      en: 'Hello! I am Miatz, your AI assistant. I have prepared some exclusive routes today with Dany, do you prefer the jungle or the sea?',
      fr: 'Bonjour! Je suis Miatz, votre assistant IA. J\'ai préparé des itinéraires exclusifs aujourd\'hui avec Dany, préférez-vous la jungle ou la mer?',
      it: 'Ciao! Sono Miatz, il tuo assistente IA. Ho preparato dei percorsi esclusivi oggi con Dany, preferisci la giungla o el mare?',
      pt: 'Olá! Sou Miatz, o seu assistente de IA. Preparei algumas rotas exclusivas hoje com Dany, você prefere a selva ou o mar?'
    };
    return greetings[lang] || greetings.es;
  }

  // Smooth scroll to element and focus input
  function initPlanWithAI() {
    const target = document.querySelector(SELECTORS.chatContainer);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Send initial greeting if chat is empty
      const messagesContainer = document.querySelector(SELECTORS.chatMessages);
      if (messagesContainer && messagesContainer.children.length <= 1) {
        setTimeout(() => {
          const inputLang = navigator.language || navigator.userLanguage || 'es';
          const lang = inputLang.startsWith('en') ? 'en' :
                       inputLang.startsWith('fr') ? 'fr' :
                       inputLang.startsWith('it') ? 'it' :
                       inputLang.startsWith('pt') ? 'pt' : 'es';
          
          userLanguage = lang;
          const greetingText = getInitialGreeting(lang);
          
          appendMessage('assistant', greetingText);
          chatHistory.push({ role: 'assistant', text: greetingText });
        }, 800);
      }

      // Focus input
      const input = document.querySelector(SELECTORS.chatInput);
      if (input) setTimeout(() => input.focus(), 1000);
    }
  }

  // Append message bubble to chat area
  function appendMessage(sender, text) {
    const messagesContainer = document.querySelector(SELECTORS.chatMessages);
    if (!messagesContainer) return;

    // Try to find existing bubbles to clone styles
    const existingBubbles = messagesContainer.querySelectorAll('[class*="rounded"]');
    let userClasses = 'bg-[#00334D] text-white self-end ml-auto rounded-lg p-3 max-w-[75%] my-1';
    let modelClasses = 'bg-[#F6F3E6] text-[#00334D] border border-[#B09A6D] self-start mr-auto rounded-lg p-3 max-w-[75%] my-1';

    // If bubbles exist, try to extract classes dynamically to match Stitch maquetación
    if (existingBubbles.length > 0) {
      // Typically user bubble is last child or contains certain alignment classes
      existingBubbles.forEach(bubble => {
        const parent = bubble.parentElement;
        const alignRight = bubble.classList.contains('justify-end') || 
                           bubble.classList.contains('ml-auto') || 
                           (parent && (parent.classList.contains('justify-end') || parent.classList.contains('items-end')));
        if (alignRight) {
          userClasses = bubble.className;
        } else {
          modelClasses = bubble.className;
        }
      });
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full my-2 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? userClasses : modelClasses;
    
    // Convert line breaks to HTML
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    
    messageWrapper.appendChild(bubble);
    messagesContainer.appendChild(messageWrapper);

    // Auto scroll down
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message to Miatz backend
  async function sendMessageToAI(message) {
    appendMessage('user', message);
    chatHistory.push({ role: 'user', text: message });

    // Show typing loader placeholder
    const messagesContainer = document.querySelector(SELECTORS.chatMessages);
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'flex w-full my-2 justify-start id-typing-indicator';
    typingIndicator.innerHTML = `<div class="bg-[#F6F3E6] text-[#7A6947] italic rounded-lg p-3 max-w-[75%] my-1">Miatz está escribiendo...</div>`;
    if (messagesContainer) {
      messagesContainer.appendChild(typingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
      userLanguage = detectLanguage(message);
      
      const response = await fetch(`${BACKEND_URL}/api/dany/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: chatHistory })
      });

      if (typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }

      if (!response.ok) {
        throw new Error('Server responded with error status');
      }

      const data = await response.json();
      let aiResponseText = data.response || '';

      // Check if lead capture tag is triggered
      const match = aiResponseText.match(/\[LEAD_QUALIFIED\]:\s*(\{.*\})/);
      if (match) {
        // Clean JSON tag out of the UI response
        aiResponseText = aiResponseText.replace(/\[LEAD_QUALIFIED\]:[\s\S]*/, '').trim();
        
        try {
          const leadData = JSON.parse(match[1]);
          console.log('[Miatz AI] Lead qualified in chat:', leadData);
          
          // Send to sheets webhook
          syncLeadToSheets(leadData);

          // Render tour buttons in chat as a helper
          setTimeout(() => {
            appendBookingOptions(leadData.interest);
          }, 1000);

        } catch (e) {
          console.error('[Miatz AI] Error parsing lead json:', e);
        }
      }

      appendMessage('assistant', aiResponseText);
      chatHistory.push({ role: 'assistant', text: aiResponseText });

    } catch (error) {
      console.error('[Miatz AI Error]', error);
      if (typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
      
      const errorMsg = userLanguage === 'en' ? 'I am experiencing a slight issue connected to the jungle spirits. Can you try again?' :
                        userLanguage === 'fr' ? 'J\'ai un léger problème de connexion avec les esprits de la jungle. Pouvez-vous réessayer?' :
                        'Tengo un pequeño inconveniente de conexión con la selva. ¿Podrías intentar de nuevo?';
      
      appendMessage('assistant', errorMsg);
    }
  }

  // Push lead to Google Sheets webhook via backend proxy
  async function syncLeadToSheets(leadData) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dany/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      const resData = await response.json();
      console.log('[Lead Capture] Lead synchronized successfully:', resData);
    } catch (err) {
      console.error('[Lead Capture Error] Failed to sync lead:', err);
    }
  }

  // Appends booking suggestions directly inside the chat
  function appendBookingOptions(interest) {
    const messagesContainer = document.querySelector(SELECTORS.chatMessages);
    if (!messagesContainer) return;

    const optWrapper = document.createElement('div');
    optWrapper.className = 'flex flex-col gap-2 w-full my-2 items-center p-3 border border-[#B09A6D]/30 bg-[#F6F3E6]/50 rounded-lg';
    
    let headingText = '¿Listo para tu aventura? Reserva tu acceso aquí:';
    if (userLanguage === 'en') headingText = 'Ready for your adventure? Book your spot here:';
    if (userLanguage === 'fr') headingText = 'Prêt pour l\'aventure ? Réservez votre place aquí:';

    optWrapper.innerHTML = `
      <p class="text-xs font-semibold text-[#00334D] mb-1">${headingText}</p>
      <div class="flex flex-wrap gap-2 justify-center">
        <button onclick="window.triggerCheckout('Chichen_Gold_Expedition')" class="bg-[#B09A6D] hover:bg-[#7A6947] text-white text-xs px-3 py-1.5 rounded transition-all font-medium">Chichén Itzá</button>
        <button onclick="window.triggerCheckout('Tortuga_Nature_Pass')" class="bg-[#1F6C7B] hover:bg-[#00334D] text-white text-xs px-3 py-1.5 rounded transition-all font-medium">Casa Tortuga</button>
        <button onclick="window.triggerCheckout('Tulum_Oceanic_Expedition')" class="bg-[#00334D] hover:bg-[#1F6C7B] text-white text-xs px-3 py-1.5 rounded transition-all font-medium">Tulum</button>
      </div>
    `;
    messagesContainer.appendChild(optWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Trigger Checkout Redirect
  window.triggerCheckout = function (productCode) {
    console.log(`[Checkout Triggered] Opening checkout for ${productCode}`);
    
    // MERCADO PAGO INTEGRATION (Mock placeholder, finalized at the end)
    // For now, alerts the product selection and simulates a payment redirect.
    const priceText = productCode === 'Chichen_Gold_Expedition' ? '1,800 MXN' : 
                      productCode === 'Tortuga_Nature_Pass' ? '1,200 MXN' : '1,500 MXN';

    const confirmCheckout = confirm(
      `[MOCK MERCADO PAGO CHECKOUT]\n\nProducto: ${productCode}\nPrecio: ${priceText}\n\n¿Deseas simular una compra exitosa y regresar al sitio?`
    );

    if (confirmCheckout) {
      // Redirect to landing page with success URL param to trigger post-payment workflow
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('payment_status', 'approved');
      currentUrl.searchParams.set('product_code', productCode);
      window.location.href = currentUrl.toString();
    }
  };

  // Displays the post-payment popup or chat notification
  function handlePostPayment() {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status') || params.get('status');
    const product = params.get('product_code') || 'tu aventura';

    if (paymentStatus === 'approved') {
      console.log('[Post-Payment] Approved status detected in URL parameters.');

      // 1. Prepend dynamic confirmation inside the chat (if visible)
      setTimeout(() => {
        appendMessage('assistant', `Pago confirmado. Soy Miatz, estoy preparando tu equipo para ${product.replace(/_/g, ' ')}. Te contactaré en menos de 30 min por WhatsApp.`);
      }, 1500);

      // 2. Render a premium floating pop-up card
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in';
      modal.innerHTML = `
        <div class="bg-[#F6F3E6] border-2 border-[#B09A6D] rounded-xl p-6 max-w-md w-full text-center shadow-2xl relative">
          <div class="w-16 h-16 bg-[#1F6C7B]/20 text-[#1F6C7B] flex items-center justify-center rounded-full mx-auto mb-4 text-3xl">✓</div>
          <h3 class="text-2xl font-bold text-[#00334D] mb-2">¡Reserva Confirmada!</h3>
          <p class="text-[#7A6947] mb-6">Pago procesado exitosamente por <strong>${product.replace(/_/g, ' ')}</strong>.</p>
          <div class="bg-[#00334D] text-white p-4 rounded-lg text-sm mb-6 border border-[#B09A6D]">
            "Soy Miatz, estoy preparando tu equipo. Te contactaré en menos de 30 min por WhatsApp."
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="bg-[#B09A6D] hover:bg-[#7A6947] text-white font-bold py-2.5 px-6 rounded-lg transition-all w-full shadow-md">
            Excelente
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      // Clean query params so it doesn't trigger again on refresh
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('payment_status');
      cleanUrl.searchParams.delete('status');
      cleanUrl.searchParams.delete('product_code');
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }
  }

  // EVENT BINDINGS
  function bindEvents() {
    // Chat Send button click
    const sendBtn = document.querySelector(SELECTORS.chatSendBtn);
    const chatInput = document.querySelector(SELECTORS.chatInput);

    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) {
          chatInput.value = '';
          sendMessageToAI(text);
        }
      });

      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = chatInput.value.trim();
          if (text) {
            chatInput.value = '';
            sendMessageToAI(text);
          }
        }
      });
    }

    // Hero "Plan with AI" button click
    const planBtn = document.querySelector(SELECTORS.planWithAiBtn);
    if (planBtn) {
      planBtn.addEventListener('click', (e) => {
        e.preventDefault();
        initPlanWithAI();
      });
    }

    // Tour Reservation Buttons
    const bookButtons = [
      { sel: SELECTORS.bookChichenBtn, prod: 'Chichen_Gold_Expedition' },
      { sel: SELECTORS.bookTortugaBtn, prod: 'Tortuga_Nature_Pass' },
      { sel: SELECTORS.bookTulumBtn, prod: 'Tulum_Oceanic_Expedition' }
    ];

    bookButtons.forEach(btnInfo => {
      const btn = document.querySelector(btnInfo.sel);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          window.triggerCheckout(btnInfo.prod);
        });
      }
    });

    // Check for incoming approved payment indicators
    handlePostPayment();
  }

  // Wait for DOM to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
