/**
 * Dany Experiences - Stitch Integration Script
 * Integrates Miatz AI Chat, Lead Capture, and Multilingual i18n Localization.
 */

(function () {
  // CONFIGURATION: Set your backend API base URL here
  const BACKEND_URL = window.location.origin.includes('file://') || window.location.origin === 'null' 
    ? 'https://negocioup-cerebro.onrender.com' 
    : window.location.origin;

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

  // i18n Translation Dictionary
  const TRANSLATIONS = {
    es: {
      nav_destinations: "Destinos",
      nav_experiences: "Experiencias",
      nav_jet: "Jet Privado",
      nav_concierge: "Conserjería",
      nav_book: "Reservar Ahora",
      hero_title: "Viajes Transformativos",
      hero_subtitle: "Aventuras a la medida diseñadas para el viajero exigente. Descubre el alma oculta de Yucatán a través de nuestras expediciones privadas exclusivas.",
      hero_plan_ai: "Planear con IA",
      hero_explore: "Explorar Tours",
      ai_tag: "Potenciado con IA",
      ai_title: "Tu Concierge Digital",
      ai_desc: "Nuestro asistente de viajes inteligente diseña itinerarios basados en tus preferencias personales, patrones estacionales y accesos exclusivos. Planificación sin esfuerzo en segundos.",
      ai_bullet1: "Sincronización del clima en tiempo real",
      ai_bullet2: "Reservas en restaurantes de lujo seleccionados",
      ai_bullet3: "Gestión de permisos de acceso privado",
      tours_tag: "Colecciones Curadas",
      tours_title: "Expediciones de Firma",
      tours_view_all: "Ver Todas las Experiencias",
      tour1_title: "Chichén Itzá",
      tour1_subtitle: "La Gran Maravilla",
      tour1_desc: "Experiencia majestuosa en el corazón maya. Acceso temprano para evitar las multitudes y guía con explicaciones arqueoastronómicas.",
      tour1_book: "Reservar Ahora",
      tour2_title: "Casa Tortuga",
      tour2_subtitle: "Cenotes y Naturaleza",
      tour2_desc: "Sumérgete en las aguas sagradas del inframundo maya en cavernas y cenotes de piedra caliza prístinas con guía acuático certificado.",
      tour2_book: "Reservar Ahora",
      tour3_title: "Tulum",
      tour3_subtitle: "Ruinas Oceánicas",
      tour3_desc: "Una mezcla única de historia maya y espectaculares vistas sobre los acantilados del mar Caribe, lejos de las multitudes.",
      tour3_book: "Reservar Ahora",
      bento_title: "Pasiones a la Medida",
      bento_subtitle: "Explora según tus intereses específicos de viaje.",
      cat_archaeology: "Arqueología",
      cat_cenotes: "Cenotes",
      cat_jets: "Jets Privados",
      cat_adventure: "Aventura",
      cat_gastronomy: "Gastronomía Local",
      cat_wellness: "Bienestar",
      cat_service: "Servicio Personal",
      cat_photography: "Fotografía",
      trust_title: "Con la confianza de viajeros del mundo",
      trust_quote: "\"Dany Experiences rediseñó lo que significa viajar para nosotros. Cada detalle fue seleccionado con tal precisión y cuidado que nos sentimos más que huéspedes: nos sentimos parte de la historia de la tierra.\"",
      trust_author: "— Elena V., Viajera Privada",
      pay_title: "Pagos Seguros",
      pay_desc: "Aceptamos las principales tarjetas de crédito y pagos digitales seguros. Sistemas de transacciones encriptados y verificados.",
      pay_btn: "Iniciar Reserva",
      footer_desc: "© 2024 Dany Experiences. Viajes transformativos para el viajero exigente.",
      footer_company: "Compañía",
      footer_about: "Sobre Nosotros",
      footer_partner: "Trabaja con Nosotros",
      footer_sustainability: "Sustentabilidad",
      footer_contact: "Contacto",
      footer_legal: "Legal",
      footer_privacy: "Política de Privacidad",
      footer_terms: "Términos de Servicio",
      footer_insurance: "Seguro de Viaje",
      footer_follow: "Síguenos",
      footer_newsletter: "Únete a nuestro Boletín",
      footer_email_placeholder: "Correo electrónico",
      chat_header_title: "Miatz AI Concierge",
      chat_header_status: "En línea y listo para ayudarte",
      chat_input_placeholder: "Escribe tus preferencias de viaje..."
    },
    en: {
      nav_destinations: "Destinations",
      nav_experiences: "Experiences",
      nav_jet: "Private Jet",
      nav_concierge: "Concierge",
      nav_book: "Book Now",
      hero_title: "Transformative Journeys",
      hero_subtitle: "Bespoke adventures curated for the discerning traveler. Discover the hidden soul of the Yucatan through our signature private expeditions.",
      hero_plan_ai: "Plan with AI",
      hero_explore: "Explore Tours",
      ai_tag: "Powered by AI",
      ai_title: "Your Digital Concierge",
      ai_desc: "Our intelligent travel partner designs itineraries based on your personal preferences, seasonal patterns, and exclusive access points. Experience effortless planning in seconds.",
      ai_bullet1: "Real-time weather synchronization",
      ai_bullet2: "Curated luxury restaurant bookings",
      ai_bullet3: "Private access permits management",
      tours_tag: "Curated Collections",
      tours_title: "Signature Expeditions",
      tours_view_all: "View All Experiences",
      tour1_title: "Chichén Itzá",
      tour1_subtitle: "The Great Wonder",
      tour1_desc: "Experience the majesty of the Mayan world with exclusive early-access and expert archeoastronomical insights.",
      tour1_book: "Book Now",
      tour2_title: "Casa Tortuga",
      tour2_subtitle: "Cenotes & Nature",
      tour2_desc: "Dive into the sacred waters of the Mayan underworld in caverns and cenotes with a certified aquatic guide.",
      tour2_book: "Book Now",
      tour3_title: "Tulum",
      tour3_subtitle: "Oceanic Ruins",
      tour3_desc: "A perfect blend of ancient history and spectacular cliffside Caribbean views, away from the crowds.",
      tour3_book: "Book Now",
      bento_title: "Tailored Passions",
      bento_subtitle: "Explore by your specific travel interests and desires.",
      cat_archaeology: "Archaeology",
      cat_cenotes: "Cenotes",
      cat_jets: "Private Jets",
      cat_adventure: "Adventure",
      cat_gastronomy: "Local Gastronomy",
      cat_wellness: "Wellness",
      cat_service: "Personal Service",
      cat_photography: "Photography",
      trust_title: "Trusted by World Travelers",
      trust_quote: "\"Dany Experiences redefined what travel means to us. Every detail was curated with such precision and care that we felt like more than just guests—we felt like part of the land's history.\"",
      trust_author: "— Elena V., Private Traveler",
      pay_title: "Secure Payments",
      pay_desc: "We accept all major credit cards and secure digital payments. Encrypted and verified transaction systems.",
      pay_btn: "Start Your Booking",
      footer_desc: "© 2024 Dany Experiences. Transformative journeys for the discerning traveler.",
      footer_company: "Company",
      footer_about: "About Us",
      footer_partner: "Partner with Us",
      footer_sustainability: "Sustainability",
      footer_contact: "Contact",
      footer_legal: "Legal",
      footer_privacy: "Privacy Policy",
      footer_terms: "Terms of Service",
      footer_insurance: "Travel Insurance",
      footer_follow: "Follow Us",
      footer_newsletter: "Join our Newsletter",
      footer_email_placeholder: "Email",
      chat_header_title: "Miatz AI Concierge",
      chat_header_status: "Online & ready to assist",
      chat_input_placeholder: "Type your travel preferences..."
    },
    fr: {
      nav_destinations: "Destinations",
      nav_experiences: "Expériences",
      nav_jet: "Jet Privé",
      nav_concierge: "Conciergerie",
      nav_book: "Réserver",
      hero_title: "Voyages Transformateurs",
      hero_subtitle: "Des aventures sur mesure conçues pour le voyageur exigeant. Découvrez l'âme cachée du Yucatan à travers nos expéditions privées exclusives.",
      hero_plan_ai: "Planifier avec l'IA",
      hero_explore: "Explorer les Tours",
      ai_tag: "Propulsé par l'IA",
      ai_title: "Votre Concierge Numérique",
      ai_desc: "Notre partenaire de voyage intelligent conçoit des itinéraires basés sur vos préférences personnelles, les tendances saisonnières et des accès exclusifs. Planifiez sans effort en quelques secondes.",
      ai_bullet1: "Synchronisation météo en temps réel",
      ai_bullet2: "Réservations de restaurants de luxe",
      ai_bullet3: "Gestion des permis d'accès privés",
      tours_tag: "Collections Sélectionnées",
      tours_title: "Expéditions Signatures",
      tours_view_all: "Voir Toutes les Expériences",
      tour1_title: "Chichén Itzá",
      tour1_subtitle: "La Grande Merveille",
      tour1_desc: "Découvrez la majesté du monde maya avec un accès anticipé exclusif et des explications archéoastronomiques d'experts.",
      tour1_book: "Réserver",
      tour2_title: "Casa Tortuga",
      tour2_subtitle: "Cénotes & Nature",
      tour2_desc: "Plongez dans les eaux sacrées de l'inframonde maya dans des grottes et cénotes de calcaire avec un guide aquatique certifié.",
      tour2_book: "Réserver",
      tour3_title: "Tulum",
      tour3_subtitle: "Ruines Océaniques",
      tour3_desc: "Un mélange unique d'histoire ancienne et de vues spectaculaires sur les falaises de la mer des Caraïbes, loin des foules.",
      tour3_book: "Réserver",
      bento_title: "Passions sur Mesure",
      bento_subtitle: "Explorez selon vos intérêts de voyage spécifiques.",
      cat_archaeology: "Archéologie",
      cat_cenotes: "Cénotes",
      cat_jets: "Jets Privés",
      cat_adventure: "Aventure",
      cat_gastronomy: "Gastronomie Locale",
      cat_wellness: "Bien-être",
      cat_service: "Service Personnel",
      cat_photography: "Photographie",
      trust_title: "Approuvé par les Voyageurs du Monde",
      trust_quote: "\"Dany Experiences a redéfini ce que signifie voyager pour nous. Chaque détail a été sélectionné avec une précision et un soin tels que nous nous sommes sentis plus que de simples invités : nous avons fait partie de l'histoire de cette terre.\"",
      trust_author: "— Elena V., Voyageuse Privée",
      pay_title: "Paiements Sécurisés",
      pay_desc: "Nous acceptons toutes les principales cartes de crédit et paiements numériques sécurisés. Systèmes cryptés et vérifiés.",
      pay_btn: "Commencer la Réservation",
      footer_desc: "© 2024 Dany Experiences. Voyages transformateurs pour le voyageur exigeant.",
      footer_company: "Compagnie",
      footer_about: "À Propos de Nous",
      footer_partner: "Devenir Partenaire",
      footer_sustainability: "Durabilité",
      footer_contact: "Contact",
      footer_legal: "Mentions Légales",
      footer_privacy: "Politique de Confidentialité",
      footer_terms: "Conditions d'Utilisation",
      footer_insurance: "Assurance Voyage",
      footer_follow: "Suivez-nous",
      footer_newsletter: "Rejoindre notre Newsletter",
      footer_email_placeholder: "E-mail",
      chat_header_title: "Concierge Miatz IA",
      chat_header_status: "En ligne & prêt à vous aider",
      chat_input_placeholder: "Écrivez vos préférences de voyage..."
    },
    it: {
      nav_destinations: "Destinazioni",
      nav_experiences: "Esperienze",
      nav_jet: "Jet Privato",
      nav_concierge: "Portineria",
      nav_book: "Prenota Ora",
      hero_title: "Viaggi Trasformativi",
      hero_subtitle: "Avventure su misura per il viaggiatore esigente. Scopri l'anima nascosta dello Yucatan attraverso le nostre esclusive spedizioni private.",
      hero_plan_ai: "Pianifica con l'IA",
      hero_explore: "Esplora i Tour",
      ai_tag: "Alimentato da IA",
      ai_title: "Il Tuo Concierge Digitale",
      ai_desc: "Il nostro assistente di viaggio intelligente progetta itinerari in base alle tue preferenze personali, all'andamento stagionale e a punti di accesso esclusivi. Pianifica senza sforzo in pochi secondi.",
      ai_bullet1: "Sincronizzazione meteo in tempo reale",
      ai_bullet2: "Prenotazioni di ristoranti di lusso curati",
      ai_bullet3: "Gestione dei permessi di accesso privato",
      tours_tag: "Collezioni Curate",
      tours_title: "Spedizioni d'Autore",
      tours_view_all: "Visualizza Tutte le Esperienze",
      tour1_title: "Chichén Itzá",
      tour1_subtitle: "La Grande Meraviglia",
      tour1_desc: "Vivi la maestosità del mondo maya con un accesso anticipato esclusivo e approfondimenti archeoastronomici di esperti.",
      tour1_book: "Prenota Ora",
      tour2_title: "Casa Tortuga",
      tour2_subtitle: "Cenotes & Natura",
      tour2_desc: "Immergiti nelle acque sacre dell'inframondo maya in grotte calcaree e cenotes incontaminati con guida acquatica certificata.",
      tour2_book: "Prenota Ora",
      tour3_title: "Tulum",
      tour3_subtitle: "Rovine Oceaniche",
      tour3_desc: "Un mix perfetto di storia antica e spettacolari viste caraibiche sulle scogliere, lontano dalla folla.",
      tour3_book: "Prenota Ora",
      bento_title: "Passioni su Misura",
      bento_subtitle: "Esplora in base ai tuoi specifici interessi e desideri di viaggio.",
      cat_archaeology: "Archeologia",
      cat_cenotes: "Cenotes",
      cat_jets: "Jet Privati",
      cat_adventure: "Avventura",
      cat_gastronomy: "Gastronomia Locale",
      cat_wellness: "Benessere",
      cat_service: "Servizio Personale",
      cat_photography: "Fotografia",
      trust_title: "Scelto dai Viaggiatori del Mondo",
      trust_quote: "\"Dany Experiences ha ridefinito il significato di viaggio per noi. Ogni dettaglio è stato curato con tale precisione e cura che ci siamo sentiti più che semplici ospiti: ci siamo sentiti parte della storia di questa terra.\"",
      trust_author: "— Elena V., Viaggiatrice Privata",
      pay_title: "Pagamenti Sicuri",
      pay_desc: "Accettiamo tutte le principali carte di credito e pagamenti digitali sicuri. Sistemi crittografati e verificati.",
      pay_btn: "Inizia la Prenotazione",
      footer_desc: "© 2024 Dany Experiences. Viaggi trasformativi per il viaggiatore esigente.",
      footer_company: "Società",
      footer_about: "Chi Siamo",
      footer_partner: "Collabora con Noi",
      footer_sustainability: "Sostenibilità",
      footer_contact: "Contatto",
      footer_legal: "Note Legali",
      footer_privacy: "Informativa sulla Privacy",
      footer_terms: "Termini di Servizio",
      footer_insurance: "Assicurazione di Viaggio",
      footer_follow: "Seguici",
      footer_newsletter: "Iscriviti alla Newsletter",
      footer_email_placeholder: "E-mail",
      chat_header_title: "Miatz AI Concierge",
      chat_header_status: "Online & pronto ad assisterti",
      chat_input_placeholder: "Scrivi le tue preferenze di viaggio..."
    },
    pt: {
      nav_destinations: "Destinos",
      nav_experiences: "Experiências",
      nav_jet: "Jato Privado",
      nav_concierge: "Concierge",
      nav_book: "Reservar Agora",
      hero_title: "Viagens Transformativas",
      hero_subtitle: "Aventuras personalizadas criadas para o viajante exigente. Descubra a alma oculta do Yucatan através de nossas expedições privadas exclusivas.",
      hero_plan_ai: "Planejar com IA",
      hero_explore: "Explorar Tours",
      ai_tag: "Alimentado por IA",
      ai_title: "Seu Concierge Digital",
      ai_desc: "Nosso parceiro de viagem inteligente projeta roteiros com base em suas preferências pessoais, padrões sazonais e pontos de acesso exclusivos. Planejamento sem esforço em segundos.",
      ai_bullet1: "Sincronização de clima em tempo real",
      ai_bullet2: "Reservas de restaurantes de luxo selecionadas",
      ai_bullet3: "Gestão de autorizações de acesso privado",
      tours_tag: "Coleções Selecionadas",
      tours_title: "Expedições Exclusivas",
      tours_view_all: "Ver Todas as Experiências",
      tour1_title: "Chichén Itzá",
      tour1_subtitle: "La Gran Maravilla",
      tour1_desc: "Experimente a majestade do mundo maia com acesso antecipado exclusivo e percepções arqueoastronômicas de especialistas.",
      tour1_book: "Reservar Agora",
      tour2_title: "Casa Tortuga",
      tour2_subtitle: "Cenotes e Natureza",
      tour2_desc: "Mergulhe nas águas sagradas do submundo maia em cavernas e cenotes de calcário intocados com guia aquático certificado.",
      tour2_book: "Reservar Agora",
      tour3_title: "Tulum",
      tour3_subtitle: "Ruínas Oceânicas",
      tour3_desc: "Uma mistura perfeita de história antiga e vistas espetaculares das falésas do mar do Caribe, longe das multidões.",
      tour3_book: "Reservar Agora",
      bento_title: "Paixões sob Medida",
      bento_subtitle: "Explore por seus interesses e desejos específicos de viagem.",
      cat_archaeology: "Arqueologia",
      cat_cenotes: "Cenotes",
      cat_jets: "Jatos Privados",
      cat_adventure: "Aventura",
      cat_gastronomy: "Gastronomia Local",
      cat_wellness: "Bem-estar",
      cat_service: "Serviço Pessoal",
      cat_photography: "Fotografia",
      trust_title: "Aprovado por Viajantes do Mundo",
      trust_quote: "\"Dany Experiences redefiniu o que significa viajar para nós. Cada detalhe foi selecionado com tal precisão e cuidado que nos sentimos mais do que hóspedes: nos sentimos parte da história da terra.\"",
      trust_author: "— Elena V., Viajante Privada",
      pay_title: "Pagamentos Seguros",
      pay_desc: "Aceitamos todos os principais cartões de crédito e pagamentos digitais seguros. Sistemas encriptados e verificados.",
      pay_btn: "Iniciar Reserva",
      footer_desc: "© 2024 Dany Experiences. Viagens transformativas para o viajante exigente.",
      footer_company: "Empresa",
      footer_about: "Sobre Nós",
      footer_partner: "Trabalhe Conosco",
      footer_sustainability: "Sustentabilidade",
      footer_contact: "Contato",
      footer_legal: "Informações Legais",
      footer_privacy: "Política de Privacidade",
      footer_terms: "Termos de Serviço",
      footer_insurance: "Seguro de Viagem",
      footer_follow: "Siga-nos",
      footer_newsletter: "Assinar Boletim",
      footer_email_placeholder: "E-mail",
      chat_header_title: "Concierge Miatz IA",
      chat_header_status: "Online & pronto para ajudar",
      chat_input_placeholder: "Escreva suas preferências de viagem..."
    }
  };

  // Main i18n localization logic
  function localizePage(lang) {
    console.log(`[i18n] Translating page content to: ${lang}`);
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.es; // Default to Spanish (es)
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', dict[key]);
        } else {
          el.innerHTML = dict[key];
        }
      }
    });
  }

  // Detect language and run localization
  function detectAndApplyLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'es';
    let lang = 'es'; // default

    if (browserLang.startsWith('en')) lang = 'en';
    else if (browserLang.startsWith('fr')) lang = 'fr';
    else if (browserLang.startsWith('it')) lang = 'it';
    else if (browserLang.startsWith('pt')) lang = 'pt';

    userLanguage = lang;
    localizePage(lang);
  }

  // Get initial greeting based on language
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
          const greetingText = getInitialGreeting(userLanguage);
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

    if (existingBubbles.length > 0) {
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
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    
    messageWrapper.appendChild(bubble);
    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message to Miatz backend
  async function sendMessageToAI(message) {
    appendMessage('user', message);
    chatHistory.push({ role: 'user', text: message });

    const messagesContainer = document.querySelector(SELECTORS.chatMessages);
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'flex w-full my-2 justify-start id-typing-indicator';
    
    let typingText = 'Miatz está escribiendo...';
    if (userLanguage === 'en') typingText = 'Miatz is typing...';
    if (userLanguage === 'fr') typingText = 'Miatz écrit...';
    if (userLanguage === 'it') typingText = 'Miatz sta scrivendo...';
    if (userLanguage === 'pt') typingText = 'Miatz está escrevendo...';

    typingIndicator.innerHTML = `<div class="bg-[#F6F3E6] text-[#7A6947] italic rounded-lg p-3 max-w-[75%] my-1">${typingText}</div>`;
    if (messagesContainer) {
      messagesContainer.appendChild(typingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
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

      const match = aiResponseText.match(/\[LEAD_QUALIFIED\]:\s*(\{.*\})/);
      if (match) {
        aiResponseText = aiResponseText.replace(/\[LEAD_QUALIFIED\]:[\s\S]*/, '').trim();
        try {
          const leadData = JSON.parse(match[1]);
          syncLeadToSheets(leadData);
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
    if (userLanguage === 'fr') headingText = 'Prêt pour l\'aventure ? Réservez votre place ici :';
    if (userLanguage === 'it') headingText = 'Pronto per la tua avventura? Prenota il tuo posto qui:';
    if (userLanguage === 'pt') headingText = 'Pronto para a sua aventura? Reserve o seu lugar aqui:';

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
    const priceText = productCode === 'Chichen_Gold_Expedition' ? '1,800 MXN' : 
                      productCode === 'Tortuga_Nature_Pass' ? '1,200 MXN' : '1,500 MXN';

    const confirmCheckout = confirm(
      `[MOCK MERCADO PAGO CHECKOUT]\n\nProducto: ${productCode}\nPrecio: ${priceText}\n\n¿Deseas simular una compra exitosa y regresar al sitio?`
    );

    if (confirmCheckout) {
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

      let messageText = `Pago confirmado. Soy Miatz, el asistente de Dany. Estoy preparando tu equipo para ${product.replace(/_/g, ' ')}. Te contactaré en menos de 30 min por WhatsApp.`;
      if (userLanguage === 'en') messageText = `Payment confirmed. I am Miatz, Dany's assistant. I am preparing your gear for ${product.replace(/_/g, ' ')}. I will contact you in less than 30 mins via WhatsApp.`;
      if (userLanguage === 'fr') messageText = `Paiement confirmé. Je suis Miatz, l'assistant de Dany. Je prépare votre équipement pour ${product.replace(/_/g, ' ')}. Je vous contacterai dans moins de 30 minutes via WhatsApp.`;
      if (userLanguage === 'it') messageText = `Pagamento confermato. Sono Miatz, l'assistente di Dany. Sto preparando la tua attrezzatura per ${product.replace(/_/g, ' ')}. Ti contatterò in meno de 30 minuti tramite WhatsApp.`;
      if (userLanguage === 'pt') messageText = `Pagamento confirmado. Sou Miatz, assistente do Dany. Estou preparando seus equipamentos para ${product.replace(/_/g, ' ')}. Entrarei em contato em menos de 30 minutos via WhatsApp.`;

      setTimeout(() => {
        appendMessage('assistant', messageText);
      }, 1500);

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
      
      let modalTitle = '¡Reserva Confirmada!';
      let modalSub = `Pago procesado exitosamente.`;
      let closeText = 'Excelente';

      if (userLanguage === 'en') { modalTitle = 'Booking Confirmed!'; modalSub = 'Payment processed successfully.'; closeText = 'Great'; }
      if (userLanguage === 'fr') { modalTitle = 'Réservation Confirmée !'; modalSub = 'Paiement traité avec succès.'; closeText = 'Excellent'; }
      if (userLanguage === 'it') { modalTitle = 'Prenotazione Confermata!'; modalSub = 'Pagamento elaborato con successo.'; closeText = 'Eccellente'; }
      if (userLanguage === 'pt') { modalTitle = 'Reserva Confirmada!'; modalSub = 'Pagamento processado com sucesso.'; closeText = 'Excelente'; }

      modal.innerHTML = `
        <div class="bg-[#F6F3E6] border-2 border-[#B09A6D] rounded-xl p-6 max-w-md w-full text-center shadow-2xl relative">
          <div class="w-16 h-16 bg-[#1F6C7B]/20 text-[#1F6C7B] flex items-center justify-center rounded-full mx-auto mb-4 text-3xl">✓</div>
          <h3 class="text-2xl font-bold text-[#00334D] mb-2">${modalTitle}</h3>
          <p class="text-[#7A6947] mb-6">${modalSub}</p>
          <div class="bg-[#00334D] text-white p-4 rounded-lg text-sm mb-6 border border-[#B09A6D]">
            "${messageText}"
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="bg-[#B09A6D] hover:bg-[#7A6947] text-white font-bold py-2.5 px-6 rounded-lg transition-all w-full shadow-md">
            ${closeText}
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('payment_status');
      cleanUrl.searchParams.delete('status');
      cleanUrl.searchParams.delete('product_code');
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }
  }

  // EVENT BINDINGS
  function bindEvents() {
    // 1. Detect browser language and localize page layout
    detectAndApplyLanguage();

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

    const planBtn = document.querySelector(SELECTORS.planWithAiBtn);
    if (planBtn) {
      planBtn.addEventListener('click', (e) => {
        e.preventDefault();
        initPlanWithAI();
      });
    }

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

    handlePostPayment();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
