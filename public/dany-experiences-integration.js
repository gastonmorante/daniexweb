/**
 * Dany Experiences - Stitch Integration Script
 * Integrates Miatz AI Chat, Lead Capture, Multilingual i18n Localization, and Interactive Tour Details Modals.
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
    bookTulumBtn: '#book-tulum-btn',
    tourCards: '.tour-card-interactive'
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
      hero_subtitle: "Aventuras a la medida diseñadas para el viajero exigente. Descubre el alma oculta de la Riviera Maya a través de nuestras expediciones privadas exclusivas.",
      hero_plan_ai: "Planear con IA",
      hero_explore: "Explorar Tours",
      ai_tag: "Potenciado con IA",
      ai_title: "Tu Concierge Digital",
      ai_desc: "Nuestro asistente de viajes inteligente diseña itinerarios basados en tus preferencias personales, patrones estacionales y accesos exclusivos. Planificación sin esfuerzo en segundos.",
      ai_bullet1: "Sincronización del clima en tiempo real",
      ai_bullet2: "Reservas en restaurantes de lujo seleccionados",
      ai_bullet3: "Gestión de permisos de acceso privado",
      tours_tag: "Rutas Diseñadas para Ti",
      tours_title: "Experiencias Personalizadas",
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
      hero_subtitle: "Bespoke adventures curated for the discerning traveler. Discover the hidden soul of the Riviera Maya through our signature private expeditions.",
      hero_plan_ai: "Plan with AI",
      hero_explore: "Explore Tours",
      ai_tag: "Powered by AI",
      ai_title: "Your Digital Concierge",
      ai_desc: "Our intelligent travel partner designs itineraries based on your personal preferences, seasonal patterns, and exclusive access points. Experience effortless planning in seconds.",
      ai_bullet1: "Real-time weather synchronization",
      ai_bullet2: "Curated luxury restaurant bookings",
      ai_bullet3: "Private access permits management",
      tours_tag: "Tours Designed for You",
      tours_title: "Personalized Experiences",
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
      hero_subtitle: "Des aventures sur mesure conçues pour le voyageur exigeant. Découvrez l'âme cachée de la Riviera Maya à travers nos expéditions privées exclusives.",
      hero_plan_ai: "Planifier avec l'IA",
      hero_explore: "Explorer les Tours",
      ai_tag: "Propulsé par l'IA",
      ai_title: "Votre Concierge Numérique",
      ai_desc: "Notre partenaire de voyage intelligent conçoit des itinéraires basés sur vos préférences personnelles, les tendances saisonnières et des accès exclusifs. Planifiez sans effort en quelques secondes.",
      ai_bullet1: "Synchronisation météo en temps réel",
      ai_bullet2: "Réservations de restaurants de luxe",
      ai_bullet3: "Gestion des permis d'accès privés",
      tours_tag: "Itinéraires Conçus pour Vous",
      tours_title: "Expériences Personnalisées",
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
      hero_subtitle: "Avventure su misura per il viaggiatore esigente. Scopri l'anima nascosta della Riviera Maya attraverso le nostre esclusive spedizioni private.",
      hero_plan_ai: "Pianifica con l'IA",
      hero_explore: "Esplora i Tour",
      ai_tag: "Alimentato da IA",
      ai_title: "Il Tuo Concierge Digitale",
      ai_desc: "Il nostro assistente di viaggio intelligente progetta itinerari in base alle tue preferenze personali, all'andamento stagionale e a punti di accesso esclusivi. Pianifica senza sforzo in pochi secondi.",
      ai_bullet1: "Sincronizzazione meteo in tempo reale",
      ai_bullet2: "Prenotazioni di ristoranti di lusso curati",
      ai_bullet3: "Gestione dei permessi di accesso privato",
      tours_tag: "Percorsi Progettati per Te",
      tours_title: "Esperienze Personalizzate",
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
      hero_subtitle: "Aventuras personalizadas criadas para o viajante exigente. Descubra a alma oculta da Riviera Maya através de nossas expedições privadas exclusivas.",
      hero_plan_ai: "Planejar com IA",
      hero_explore: "Explorar Tours",
      ai_tag: "Alimentado por IA",
      ai_title: "Seu Concierge Digital",
      ai_desc: "Nosso parceiro de viagem inteligente projeta roteiros com base em suas preferências pessoais, padrões sazonais e pontos de acesso exclusivos. Planejamento sem esforço em segundos.",
      ai_bullet1: "Sincronização de clima em tempo real",
      ai_bullet2: "Reservas de restaurantes de luxo selecionadas",
      ai_bullet3: "Gestão de autorizações de acesso privado",
      tours_tag: "Rotas Projetadas para Você",
      tours_title: "Experiências Personalizadas",
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
      trust_quote: "\"Dany Experiences redefiniu o que significa viajar para nós. Cada detalhe foi selecionado com tal precauge e cuidado que nos sentimos mais do que hóspedes: nos sentimos parte da história da terra.\"",
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
      footer_terms: "Terminos de Serviço",
      footer_insurance: "Seguro de Viagem",
      footer_follow: "Siga-nos",
      footer_newsletter: "Assinar Boletim",
      footer_email_placeholder: "E-mail",
      chat_header_title: "Concierge Miatz IA",
      chat_header_status: "Online & pronto para ajudar",
      chat_input_placeholder: "Escreva suas preferências de viagem..."
    }
  };

  // Rich Tour Data for Interactive Detail Modal
  const TOUR_DETAILS = {
    Chichen_Gold_Expedition: {
      images: ['./assets/chichen_itza_hero.webp', './assets/chichen_1.webp', './assets/chichen_2.webp', './assets/chichen_3.webp'],
      es: {
        title: "Chichén Itzá - Expedición de Oro",
        subtitle: "Una de las 7 Maravillas del Mundo Moderno",
        description: "Descubre la majestuosidad de Chichén Itzá, Patrimonio Mundial de la UNESCO. Recorre los templos sagrados junto a un guía federal certificado que te revelará la arqueastronomía y la precisión del calendario solar maya. Además, disfruta de un baño en un místico cenote y visita la hermosa ciudad colonial de Valladolid.",
        itinerary: [
          "Acceso temprano exclusivo (evita calor y multitudes).",
          "Recorrido detallado de la Pirámide de Kukulkán, Templo de los Guerreros y el Juego de Pelota.",
          "Nado relajante en un cenote sagrado de aguas cristalinas.",
          "Almuerzo tradicional yucateco (opcional/libre).",
          "Paseo por las históricas calles coloniales de Valladolid."
        ],
        includes: ["Guía Federal Certificado", "Acceso temprano", "Visita a Cenote", "Visita a Valladolid"],
        policies: "Presentarse 15 minutos antes. Uso de protector solar biodegradable por respeto al medio ambiente. Cancelación gratuita con 24 horas de anticipación."
      },
      en: {
        title: "Chichén Itzá - Gold Expedition",
        subtitle: "One of the 7 Wonders of the Modern World",
        description: "Discover the majesty of Chichén Itzá, a UNESCO World Heritage site. Explore the sacred temples with a certified federal guide who will reveal Mayan archeoastronomy and solar calendar precision. Also, enjoy a swim in a mystic cenote and visit the beautiful colonial city of Valladolid.",
        itinerary: [
          "Exclusive early access (avoid heat and crowds).",
          "Detailed tour of the Kukulkan Pyramid, Temple of the Warriors, and Ball Court.",
          "Relaxing swim in a sacred cenote with crystal-clear waters.",
          "Traditional Yucatecan lunch (optional/free time).",
          "Stroll through the historic colonial streets of Valladolid."
        ],
        includes: ["Certified Federal Guide", "Early access entry", "Cenote visit & swim", "Valladolid colonial tour"],
        policies: "Arrive 15 minutes before departure. Biodegradable sunscreen required to protect the ecosystem. Free cancellation 24h in advance."
      },
      fr: {
        title: "Chichén Itzá - Expédition d'Or",
        subtitle: "L'une des 7 merveilles du monde moderne",
        description: "Découvrez la majesté de Chichén Itzá, site classé au patrimoine mondial de l'UNESCO. Explorez les temples sacrés avec un guide fédéral certifié qui vous révélera l'archéoastronomie maya. Profitez d'une baignade dans un cénoté mystique et visitez la magnifique ville coloniale de Valladolid.",
        itinerary: [
          "Accès anticipé exclusif (évite la chaleur et la foule).",
          "Visite détaillée de la pyramide de Kukulkan et du temple des guerriers.",
          "Baignade relaxante dans un cénoté sacré aux eaux cristallines.",
          "Déjeuner traditionnel du Yucatan (optionnel/temps libre).",
          "Promenade dans les rues coloniales historiques de Valladolid."
        ],
        includes: ["Guide Fédéral Certifié", "Entrée accès anticipé", "Baignade en cénoté", "Visite coloniale de Valladolid"],
        policies: "Arriver 15 minutes avant le départ. Crème solaire biodégradable obligatoire. Annulation gratuite 24h à l'avance."
      },
      it: {
        title: "Chichén Itzá - Spedizione d'Oro",
        subtitle: "Una delle 7 meraviglie del mondo moderno",
        description: "Scopri la maestosità di Chichén Itzá, patrimonio mondiale dell'UNESCO. Esplora i templi sacri con una guida federale certificata che ti svelerà l'archeoastronomia maya. Inoltre, goditi un bagno in un mistico cenote e visita la splendida città coloniale di Valladolid.",
        itinerary: [
          "Accesso anticipato esclusivo (evita calore e folla).",
          "Tour dettagliato della Piramide di Kukulkan e del Tempio dei Guerrieri.",
          "Nuotata rilassante in un cenote sacro con acque cristalline.",
          "Pranzo tradizionale dello Yucatan (opzionale/tempo libero).",
          "Passeggiata tra le storiche vie coloniali di Valladolid."
        ],
        includes: ["Guida Federale Certificata", "Ingresso prioritario", "Bagno nel cenote", "Tour coloniale di Valladolid"],
        policies: "Arrivare 15 minuti prima della partenza. Crema solare biodegradabile obbligatoria. Cancellazione gratuita con 24h di anticipo."
      },
      pt: {
        title: "Chichén Itzá - Expedição de Ouro",
        subtitle: "Uma das 7 maravilhas do mundo moderno",
        description: "Descubra a majestade de Chichén Itzá, patrimônio mundial da UNESCO. Explore os templos sagrados com um guia federal certificado que revelará a arqueastronomia maia. Além disso, desfrute de um mergulho em um místico cenote e visite a bela cidade colonial de Valladolid.",
        itinerary: [
          "Acesso antecipado exclusivo (evita calor e multidões).",
          "Tour detalhado da Pirâmide de Kukulkán e Templo dos Guerreiros.",
          "Mergulho relaxante em um cenote sagrado de águas cristalinas.",
          "Almoço tradicional de Yucatán (opcional/tempo livre).",
          "Passeio pelas ruas coloniais históricas de Valladolid."
        ],
        includes: ["Guia Federal Certificado", "Entrada com acesso antecipado", "Nado em cenote", "Visita colonial de Valladolid"],
        policies: "Apresentar-se 15 minutos antes. Uso de protetor solar biodegradável. Cancelamento gratuito com 24h de antecedência."
      }
    },
    Tortuga_Nature_Pass: {
      images: ['./assets/casa_tortuga_hero.webp', './assets/tortuga_1.webp', './assets/tortuga_2.webp', './assets/tortuga_3.webp'],
      es: {
        title: "Casa Tortuga - Cenotes y Aventura",
        subtitle: "Aventura y Relajación en el Inframundo Maya",
        description: "Una experiencia inmersiva de contacto directo con la naturaleza en el Parque Casa Tortuga. Explora 5 cenotes espectaculares: tres cenotes abiertos tipo albercas naturales rodeados de selva exuberante y dos místicas cavernas con impresionantes formaciones de estalactitas y estalagmitas.",
        itinerary: [
          "Recorrido guiado por los 5 cenotes del parque.",
          "Tiempo libre para nadar y relajarte en tu cenote favorito.",
          "Acceso a servicios del parque (baños, regaderas, áreas de descanso).",
          "Actividades opcionales disponibles (tirolesas y paseo en ATV con reserva previa)."
        ],
        includes: ["Guía acuático certificado", "Chaleco salvavidas obligatorio", "Entrada completa al parque", "Tiempo libre en cenotes"],
        policies: "Horario de operación: 9:00 AM a 5:00 PM. Presentarse 15 minutos antes. Prohibido usar protector solar o repelente no biodegradable. No se permite ingresar alcohol."
      },
      en: {
        title: "Casa Tortuga - Cenotes & Adventure",
        subtitle: "Adventure & Relaxation in the Mayan Underworld",
        description: "An immersive direct contact experience with nature at Casa Tortuga Park. Explore 5 spectacular cenotes: three open natural pool cenotes surrounded by lush jungle and two mystical caverns with stunning stalactite and stalagmitite formations.",
        itinerary: [
          "Guided tour of the park's 5 cenotes.",
          "Free time to swim and relax in your favorite cenote.",
          "Access to park services (restrooms, showers, relaxation areas).",
          "Optional activities available (zipline and ATV tours with prior booking)."
        ],
        includes: ["Certified aquatic guide", "Mandatory life jacket", "Full park entry ticket", "Free time in the cenotes"],
        policies: "Operating hours: 9:00 AM to 5:00 PM. Arrive 15 minutes before. Prohibited to use non-biodegradable sunscreen or repellent. Alcohol entry not permitted."
      },
      fr: {
        title: "Casa Tortuga - Cénotes & Aventure",
        subtitle: "Aventure et détente dans l'inframonde maya",
        description: "Une expérience immersive de contact direct avec la nature au parc Casa Tortuga. Explorez 5 cénotes spectaculaires : trois cénotes ouverts de type piscine naturelle entourés de jungle et deux cavernes mystiques aux stalactites impressionnantes.",
        itinerary: [
          "Visite guidée des 5 cénotes du parc.",
          "Temps libre pour nager et vous détendre dans votre cénoté préféré.",
          "Accès aux services du parc (vestiaires, douches, zones de repos).",
          "Activités optionnelles disponibles (tyroliennes et tyroliennes ATV sur réservation)."
        ],
        includes: ["Guide aquatique certifié", "Gilet de sauvetage obligatoire", "Entrée complète du parc", "Temps libre dans les cénotes"],
        policies: "Heures d'ouverture: 9h00 à 17h00. Arriver 15 minutes avant. Crème solaire biodégradable uniquement. Alcool interdit."
      },
      it: {
        title: "Casa Tortuga - Cenotes & Avventura",
        subtitle: "Avventura e relax nell'inframondo maya",
        description: "Un'esperienza immersiva a diretto contatto con la natura nel Parco Casa Tortuga. Esplora 5 cenotes spettacolari: tre cenote aperti in stile piscina naturale circondati dalla giungla e due mistiche caverne con stalattiti.",
        itinerary: [
          "Tour guidato dei 5 cenotes del parco.",
          "Tempo libero per nuotare e rilassarsi nel tuo cenote preferito.",
          "Accesso ai servizi del parco (bagni, docce, aree relax).",
          "Attività opzionali disponibili (zipline e tour in ATV con prenotazione anticipata)."
        ],
        includes: ["Guida acquatica certificata", "Giubbotto di salvataggio obbligatorio", "Ingresso completo al parco", "Tempo libero nei cenote"],
        policies: "Orari di apertura: dalle 9:00 alle 17:00. Arrivare 15 minuti prima. Solo crema solare biodegradabile. Vietato introdurre alcolici."
      },
      pt: {
        title: "Casa Tortuga - Cenotes e Aventura",
        subtitle: "Aventura e relaxamento no submundo maia",
        description: "Uma experiência de contato direto com a natureza no Parque Casa Tortuga. Explore 5 cenotes espetaculares: três cenotes abertos estilo piscina natural cercados pela selva e duas cavernas místicas com estalactites.",
        itinerary: [
          "Tour guiado pelos 5 cenotes do parque.",
          "Tempo livre para nadar e relaxar no seu cenote favorito.",
          "Acesso aos serviços do parque (banheiros, duchas, áreas de descanso).",
          "Atividades opcionais disponíveis (tirolesa e passeios de ATV com reserva)."
        ],
        includes: ["Guia aquático certificado", "Colete salva-vidas obrigatório", "Entrada completa do parque", "Tempo livre nos cenotes"],
        policies: "Horário de funcionamento: 9:00 às 17:00. Apresentar-se 15 minutos antes. Proibido protetor solar comum. Bebidas alcoólicas não permitidas."
      }
    },
    Tulum_Oceanic_Expedition: {
      images: ['./assets/tulum_hero.webp', './assets/tulum_1.webp', './assets/tulum_2.webp', './assets/tulum_3.webp'],
      es: {
        title: "Tulum - Ruinas del Caribe",
        subtitle: "La Única Ciudad Maya Frente al Mar Caribe",
        description: "Explora la espectacular zona arqueológica de Tulum, la única ciudad amurallada construida en un acantilado con vistas al Mar Caribe. Conoce la historia de Zamá (amanecer), que funcionó como un importante puerto comercial marítimo maya.",
        itinerary: [
          "Recorrido guiado de los templos de El Castillo, Dios Descendente, y de los Frescos.",
          "Paseo a lo largo de las murallas defensivas mayas.",
          "Acceso a miradores panorámicos espectaculares con vista al Caribe.",
          "Tiempo libre para disfrutar de la playa de Tulum y tomar fotografías memorables."
        ],
        includes: ["Guía certificado", "Entrada a la Zona Arqueológica", "Tiempo libre en la playa", "Explicación histórica"],
        policies: "Traer ropa cómoda y fresca, calzado antiderrapante, gorra y traje de baño. Cancelación gratuita con 24h de anticipación. Sujeto a indicaciones del INAH."
      },
      en: {
        title: "Tulum - Ruins of the Caribbean",
        subtitle: "The Only Mayan City Facing the Caribbean Sea",
        description: "Explore the spectacular archaeological site of Tulum, the only walled city built on a cliff overlooking the Caribbean Sea. Learn the history of Zamá (dawn), which operated as a key Mayan maritime trade port.",
        itinerary: [
          "Guided tour of El Castillo, Temple of the Descending God, and Temple of the Frescoes.",
          "Walk along the ancient Mayan defensive walls.",
          "Access to spectacular panoramic viewpoints overlooking the Caribbean.",
          "Free time to enjoy Tulum beach and take memorable photos."
        ],
        includes: ["Certified guide", "Entry ticket to Archaeological Zone", "Free time at the beach", "Historical explanations"],
        policies: "Bring comfortable fresh clothing, non-slip footwear, hat, and swimsuit. Free cancellation 24h in advance. Subject to INAH instructions."
      },
      fr: {
        title: "Tulum - Ruines des Caraïbes",
        subtitle: "La seule ville maya face à la mer des Caraïbes",
        description: "Explorez le site archéologique spectaculaire de Tulum, la seule ville fortifiée bâtie sur une falaise surplombant la mer des Caraïbes. Apprenez l'histoire de Zamá (l'aube), qui servait de port commercial maritime maya.",
        itinerary: [
          "Visite guidée d'El Castillo, du temple du Dieu Descendant et des Fresques.",
          "Promenade le long des anciennes murailles défensives mayas.",
          "Accès à des points de vue panoramiques spectaculaires sur les Caraïbes.",
          "Temps libre pour profiter de la plage de Tulum et prendre des photos mémorables."
        ],
        includes: ["Guide certifié", "Billet d'entrée à la zone archéologique", "Temps libre sur la plage", "Explications historiques"],
        policies: "Apporter vêtements légers, chaussures antidérapantes, chapeau et maillot de bain. Annulation gratuite 24h à l'avance. Sujet aux règles de l'INAH."
      },
      it: {
        title: "Tulum - Rovine dei Caraibi",
        subtitle: "L'unica città maya di fronte al mare dei Caraibi",
        description: "Esplora lo spettacolare sito archeologico di Tulum, l'unica città murata costruita su una scogliera a picco sul Mar dei Caraibi. Scopri la storia di Zamá (alba), antico e importante porto commerciale marittimo maya.",
        itinerary: [
          "Visite guidate a El Castillo, Tempio del Dio Discendente e degli Affreschi.",
          "Passeggiata lungo le antiche mura difensive maya.",
          "Accesso a spettacolari punti panoramici con vista sui Caraibi.",
          "Tempo libero per godersi la spiaggia di Tulum e scattare foto memorabili."
        ],
        includes: ["Guida certificata", "Ingresso alla zona archeologica", "Tempo libero in spiaggia", "Spiegazioni storiche"],
        policies: "Portare abiti comodi e freschi, scarpe antiscivolo, cappello e costume. Cancellazione gratuita entro 24 ore. Soggetto alle regole INAH."
      },
      pt: {
        title: "Tulum - Ruínas do Caribe",
        subtitle: "A única cidade maia em frente ao mar do Caribe",
        description: "Explore o espetacular sítio arqueológico de Tulum, a única cidade amuralhada construída em um penhasco com vista para o Mar do Caribe. Conheça a história de Zamá (amanhecer), que funcionou como um importante porto comercial maia.",
        itinerary: [
          "Tour guiado pelos templos de El Castillo, Deus Descendente e dos Frescos.",
          "Caminhada pelas antigas muralhas defensivas maias.",
          "Acesso a mirantes panorâmicos espetaculares com vista para o Caribe.",
          "Tempo livre para desfrutar da praia de Tulum e tirar fotos memoráveis."
        ],
        includes: ["Guia certificado", "Ingresso para a zona arqueológica", "Tempo livre na praia", "Explicação histórica"],
        policies: "Trazer roupas leves, calçado antiderrapante, boné e roupa de banho. Cancelamento gratuito com 24h de antecedência. Sujeito às regras do INAH."
      }
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

  // React-like Interactive Modal system
  window.openTourModal = function(productCode) {
    console.log(`[Tour Modal] Opening details for: ${productCode}`);
    const tour = TOUR_DETAILS[productCode];
    if (!tour) return;

    const dict = tour[userLanguage] || tour.es;

    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'tour-detail-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300';
    
    // Add custom keyframe animations dynamically
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.innerHTML = `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }

    modal.innerHTML = `
      <div class="bg-[#F6F3E6] border-2 border-[#B09A6D] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row animate-fade-in">
        <!-- Close Button -->
        <button onclick="document.getElementById('tour-detail-modal').remove()" class="absolute right-4 top-4 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>

        <!-- Left Column: Gallery -->
        <div class="w-full md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#B09A6D]/20">
          <div class="relative w-full aspect-video md:aspect-[4/3] rounded-lg overflow-hidden border border-[#B09A6D]/30 bg-black flex items-center justify-center shadow-md">
            <img id="modal-main-img" src="${tour.images[0]}" class="w-full h-full object-cover transition-all duration-300" alt="${dict.title}">
          </div>
          <!-- Thumbnails -->
          <div class="flex gap-2 mt-4 overflow-x-auto pb-2">
            ${tour.images.map((imgUrl, i) => `
              <button onclick="document.getElementById('modal-main-img').src='${imgUrl}'" class="w-20 h-16 rounded overflow-hidden border-2 border-[#B09A6D]/20 hover:border-[#1F6C7B] focus:border-[#1F6C7B] flex-shrink-0 transition-all shadow-sm">
                <img src="${imgUrl}" class="w-full h-full object-cover" alt="Thumbnail">
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Right Column: Details -->
        <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div class="space-y-5">
            <div>
              <span class="text-xs font-semibold text-[#1F6C7B] uppercase tracking-widest">${dict.subtitle}</span>
              <h3 class="text-2xl font-bold text-[#00334D] mt-1 mb-2 font-display-xl">${dict.title}</h3>
            </div>
            
            <p class="text-sm text-[#7A6947] leading-relaxed">${dict.description}</p>
            
            <!-- Itinerary -->
            <div>
              <h4 class="text-xs font-bold text-[#00334D] uppercase tracking-widest mb-2 border-b border-[#B09A6D]/20 pb-1">${userLanguage === 'en' ? 'Itinerary & Highlights' : 'Itinerario y Puntos Clave'}</h4>
              <ul class="space-y-1.5">
                ${dict.itinerary.map(item => `
                  <li class="flex items-start gap-2 text-xs text-[#00334D]">
                    <span class="material-symbols-outlined text-[8px] text-[#1F6C7B] mt-1" style="font-variation-settings: 'FILL' 1;">circle</span>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Inclusions -->
            <div>
              <h4 class="text-xs font-bold text-[#00334D] uppercase tracking-widest mb-2 border-b border-[#B09A6D]/20 pb-1">${userLanguage === 'en' ? 'What\'s Included' : 'Qué Incluye'}</h4>
              <div class="flex flex-wrap gap-1.5">
                ${dict.includes.map(inc => `
                  <span class="bg-[#1F6C7B]/10 text-[#1F6C7B] px-3 py-1 rounded-full text-caption font-semibold">${inc}</span>
                `).join('')}
              </div>
            </div>

            <!-- Policies -->
            <div>
              <h4 class="text-xs font-bold text-red-800 uppercase tracking-widest mb-2 border-b border-red-800/10 pb-1">${userLanguage === 'en' ? 'Policies & Inclusions' : 'Políticas y Requisitos'}</h4>
              <p class="text-caption text-red-900/80 leading-relaxed">${dict.policies}</p>
            </div>
          </div>

          <div class="mt-8">
            <button onclick="window.triggerCheckout('${productCode}')" class="w-full bg-[#1F6C7B] hover:bg-[#00334D] text-white py-3.5 rounded-full font-label-md uppercase tracking-widest transition-colors duration-300 shadow-md">
              ${userLanguage === 'en' ? 'Book This Adventure' : 'Reservar Esta Aventura'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside the container
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
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

    // Connect tour cards to the React-like detail modal click
    const tourCards = document.querySelectorAll(SELECTORS.tourCards);
    tourCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const productCode = card.getAttribute('data-product');
        if (productCode) {
          openTourModal(productCode);
        }
      });
    });

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
          e.stopPropagation(); // Avoid triggering openTourModal
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
