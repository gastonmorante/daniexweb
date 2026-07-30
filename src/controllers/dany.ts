import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { config } from '../config';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(config.geminiApiKey || 'mock_key_for_compilation');

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const MIATZ_SYSTEM_INSTRUCTION = `
Eres Miatz, el Agente de IA y Concierge Digital de Dany Experiences en la Riviera Maya. Tu nombre es de origen maya y significa "sabiduría" o "sabio". 
Hablas en nombre de Dany Experiences, asistiendo a los viajeros a planificar sus expediciones con Dany, quien es el Guía Federal Certificado y experto local con años de experiencia en la Riviera Maya. 
No eres un bot genérico de atención al cliente; hablas con la autoridad, el misticismo y la calidez de alguien que vive en la selva, respeta la naturaleza y conoce de primera mano los secretos ancestrales de las ruinas y cenotes transmitidos por Dany.

PAUTAS DE IDIOMA Y MULTILINGÜISMO:
- Eres nativo multilingüe. Responde SIEMPRE en el mismo idioma en el que te escriba el usuario (Español, Inglés, Francés, Italiano o Portugués). Si te escriben en inglés, responde en inglés; si en francés, responde en francés, etc.
- Mantén tu personalidad apasionada y conocedora en todos los idiomas.

BASE DE CONOCIMIENTO (Debes dominar y enfatizar estos datos y las 5 categorías de actividades):
1. Parques Temáticos y Eco-Arqueológicos:
   - Incluye toda la familia de parques de Grupo Xcaret y otros parques naturales: Xcaret Plus (con comida), Básico, Xel-Há (todo incluido), Xplor / Xplor Fuego (tirolesas, anfibios), Xenses (sensorial), Xoximilco (fiesta mexicana en trajineras), Xavage (aventura extrema), Río Secreto (cuevas y ríos subterráneos) y Aqua Nick (Nickelodeon).
   - Perfil: Ideal para familias, niños y diversión de todas las edades.

2. Zonas Arqueológicas y Cultura:
   - Ofrecen visitas guiadas regulares y privadas a los vestigios mayas principales: Chichén Itzá (Clásico, Deluxe, Privado), Tulum (Solo, Cenotes, Transporte Privado), Cobá (con pirámide Nohoch Mul y aldeas mayas), Ek Balam (combinado con Valladolid) y el combo "3 en 1" (Tulum + Cobá + Cenote).
   - Perfil: Viajeros interesados en historia, cultura, exclusividad y tours privados.

3. Actividades Acuáticas y de Mar:
   - Navegación y contacto con fauna marina: Isla Mujeres (catamarán con barra libre y snorkel), nado con Tiburón Ballena (estrictamente de temporada de mayo a septiembre), snorkel con Tortugas en Akumal, MUSA (Museo Subamarino), Jungle Tour (conducir lanchas rápidas en manglares), Pesca Deportiva desde Cancún, y Cruceros Nocturnos (cena romántica Columbus o shows de piratas).
   - Perfil: Amantes de las actividades marinas, parejas, grupos y snorkelers.

4. Nado con Delfines:
   - Programas especializados en Punta Cancún, Playa Mujeres y Puerto Morelos: Dolphin Interax (básico para familias), Primax (avanzado, foot-push), The One (experiencia 1-a-1 privada) y Entrenador por un día.
   - Perfil: Interacción íntima, familias, niños y experiencias altamente educativas y privadas.

5. Aventura y Naturaleza:
   - Combinaciones de adrenalina en la selva y Yucatán: Selvática (tirolesas, puentes, cenotes), ATVs y Motos Todoterreno por la selva, Xenotes (visita a 4 tipos de cenotes con kayak y rapel), Paseo a Camello en Playa Maroma, y Las Coloradas (lagunas rosadas y Río Lagartos).
   - Perfil: Amantes de la aventura extrema, naturaleza salvaje y espectaculares paisajes fotográficos.

LÓGICA DE RECOMENDACIÓN INTELIGENTE:
- Si el usuario busca actividades en "familia", prioriza "Parques Temáticos" (Xcaret, Aqua Nick) o "Nado con Delfines" (Dolphin Interax).
- Si el usuario busca "exclusividad" o "privacidad", prioriza "Zonas Arqueológicas" (tours arqueológicos privados) o "Nado con Delfines" (el programa privado "The One").
- Si el usuario busca "fotos" o paisajes impactantes, prioriza "Las Coloradas" (lagunas rosadas en Aventura) o las ruinas de "Tulum" (Zonas Arqueológicas).
- Si el usuario busca "romance" o planes de pareja, prioriza el crucero nocturno "Columbus" (Actividades de Mar) o un cenote privado de "Xenotes".

CONVERSIÓN DE MONEDA (Tipo de cambio):
- Si el usuario te pregunta por precios en dólares estadounidenses (USD) o tipo de cambio, realiza la conversión asumiendo un tipo de cambio estándar de **1 USD = 18 MXN**. Por ejemplo, si un tour cuesta 1800 MXN, menciónale de forma amigable que equivale a unos 100 USD aproximadamente. Aclara que el cobro final se realiza en pesos (MXN) pero aceptan pagos en USD.

OBJETIVO DE CAPTACIÓN DE LEADS (REGLA CRÍTICA):
- Si el usuario muestra un interés real (pregunta por disponibilidad, costos, cómo reservar o detalles de un tour específico), debes guiar la conversación de manera fluida para obtener su **Nombre** y su número de **WhatsApp** de contacto.
- Pídelos de uno en uno de forma natural y respetuosa, nunca como un interrogatorio de formulario.
- Solo cuando tengas confirmados el **Nombre** y el **WhatsApp**, dale un cierre cálido, invítalo a reservar usando los botones de la página, y al final de tu mensaje, en una nueva línea limpia, DEBES escribir exactamente la siguiente etiqueta JSON:
  \`[LEAD_QUALIFIED]: {"name": "Nombre completo", "phone": "WhatsApp", "interest": "Tour de interés"}\`
  Esto es fundamental para que el frontend registre al cliente automáticamente.
`;

/**
 * POST /api/dany/chat
 * Proxy endpoint to consult Gemini API as Miatz AI.
 */
export const handleDanyChat = async (req: Request, res: Response) => {
  const { message, history, lang } = req.body;
  const userLang = (lang || 'es').toLowerCase();

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const formattedHistory: ChatMessage[] = (history || []).map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  if (!config.geminiApiKey || config.geminiApiKey === 'your_google_gemini_api_key') {
    console.warn('[Miatz AI] GEMINI_API_KEY not configured or is placeholder. Running in Mock mode.');
    
    // Localized simulated responses for Miatz AI in mock mode
    let reply = '';
    const lowercaseMsg = message.toLowerCase();

    if (userLang === 'en') {
      reply = 'Hello! I am Miatz, your concierge guide for Dany Experiences. ';
      if (lowercaseMsg.includes('family') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('park') || lowercaseMsg.includes('kid')) {
        reply += 'For families, I highly recommend our "Theme & Eco-Archaeological Parks" package featuring Xcaret Plus and Aqua Nick. What is your name to check availability?';
      } else if (lowercaseMsg.includes('whale') || lowercaseMsg.includes('shark') || lowercaseMsg.includes('sea') || lowercaseMsg.includes('mar') || lowercaseMsg.includes('columbus') || lowercaseMsg.includes('boat') || lowercaseMsg.includes('catamaran')) {
        reply += 'Discover "Aquatic & Sea Activities" with premium catamaran sails to Isla Mujeres or Columbus Dinner Cruise. Note that Whale Shark swims are only available from May to September. Please share your WhatsApp to discuss details.';
      } else if (lowercaseMsg.includes('dolphin') || lowercaseMsg.includes('delfin') || lowercaseMsg.includes('swim') || lowercaseMsg.includes('one')) {
        reply += 'Our "Swim with Dolphins" program offers private 1-on-1 dolphin encounters (The One). Would you like to check available slots? What is your name?';
      } else if (lowercaseMsg.includes('adventure') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('moto') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('selva') || lowercaseMsg.includes('jungle') || lowercaseMsg.includes('photo') || lowercaseMsg.includes('instagram') || lowercaseMsg.includes('nature')) {
        reply += 'Get ready for "Adventure & Nature" with Selvática ATVs and the stunning pink lagoons of Las Coloradas (perfect for Instagram!). Please share your WhatsApp to send you the specs.';
      } else if (lowercaseMsg.includes('archaeology') || lowercaseMsg.includes('history') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('coba') || lowercaseMsg.includes('culture')) {
        reply += 'Our "Archaeological Zones & Culture" tours provide private early access to Chichén Itzá, Tulum, and Cobá without crowds. What is your name to book a private guide?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('love') || lowercaseMsg.includes('couple') || lowercaseMsg.includes('honey')) {
        reply += 'For romance, I recommend our Columbus Dinner Cruise under the stars or a private cenote swim. What is your name to start planning?';
      } else {
        reply += 'How can I assist you? We offer: Archaeological Zones & Culture, Theme & Eco-Archaeological Parks, Aquatic & Sea Activities, Swim with Dolphins, and Adventure & Nature.';
      }
    } else if (userLang === 'fr') {
      reply = 'Bonjour! Je suis Miatz, votre concierge Dany Experiences. ';
      if (lowercaseMsg.includes('famille') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('enfant') || lowercaseMsg.includes('parc')) {
        reply += 'Pour les familles, je recommande nos "Parcs Thématiques et Éco-Archéologiques" (Xcaret, Aqua Nick). Quel est votre nom pour vérifier la disponibilité?';
      } else if (lowercaseMsg.includes('requin') || lowercaseMsg.includes('baleine') || lowercaseMsg.includes('mer') || lowercaseMsg.includes('catamaran')) {
        reply += 'Découvrez "Activités Aquatiques et de Mer" avec catamaran ou le dîner Columbus. Notez que la nage avec les Requins-Baleines est disponible uniquement de mai à septembre. Partagez votre WhatsApp pour les détails.';
      } else if (lowercaseMsg.includes('dauphin') || lowercaseMsg.includes('delfin') || lowercaseMsg.includes('nage') || lowercaseMsg.includes('one')) {
        reply += 'Notre programme "Nage avec les Dauphins" propose des rencontres privées 1-à-1 avec les dauphins (The One). Quel est votre nom?';
      } else if (lowercaseMsg.includes('aventure') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('jungle') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('photo') || lowercaseMsg.includes('nature')) {
        reply += 'Préparez-vous pour "Aventure et Nature" avec quad VTT et les lagunes roses de Las Coloradas. Partagez votre WhatsApp.';
      } else if (lowercaseMsg.includes('archeologie') || lowercaseMsg.includes('histoire') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('culture')) {
        reply += 'Notre "Zones Archéologiques et Culture" propose des visites archéologiques privées à Chichén Itzá et Tulum sans foule. Quel est votre nom?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('couple') || lowercaseMsg.includes('diner')) {
        reply += 'Pour le romance, je suggère le Columbus Dinner Cruise sous les étoiles. Quel est votre nom?';
      } else {
        reply += 'Comment puis-je vous aider? Nous offrons: Zones Archéologiques et Culture, Parcs Thématiques et Éco-Archéologiques, Activités Aquatiques et de Mer, Nage avec les Dauphins, et Aventure et Nature.';
      }
    } else if (userLang === 'it') {
      reply = 'Ciao! Sono Miatz, il tuo concierge di Dany Experiences. ';
      if (lowercaseMsg.includes('famiglia') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('bambin') || lowercaseMsg.includes('parco')) {
        reply += 'Per le famiglie, consiglio i nostri "Parchi Tematici ed Eco-Archeologici" (Xcaret, Aqua Nick). Qual è il tuo nome per verificare la disponibilità?';
      } else if (lowercaseMsg.includes('squalo') || lowercaseMsg.includes('balena') || lowercaseMsg.includes('mare') || lowercaseMsg.includes('catamarano')) {
        reply += 'Scopri "Attività Acquatiche e di Mare" in catamarano o con la cena Columbus. Ricorda che il nuoto con gli Squali Balena è disponibile solo da maggio a settembre. Lascia il tuo WhatsApp per dettagli.';
      } else if (lowercaseMsg.includes('delfino') || lowercaseMsg.includes('nuoto') || lowercaseMsg.includes('one')) {
        reply += 'Il nostro pacchetto "Nuoto con i Delfini" offre incontri privati 1-a-1 con i delfini (The One). Qual è il tuo nome per prenotare?';
      } else if (lowercaseMsg.includes('avventura') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('giungla') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('foto') || lowercaseMsg.includes('natura')) {
        reply += 'Prepara la giungla con "Avventura e Natura" con quad e le lagune rosa di Las Coloradas. Lascia il tuo WhatsApp.';
      } else if (lowercaseMsg.includes('archeologia') || lowercaseMsg.includes('storia') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('cultura')) {
        reply += 'Le "Zone Archeologiche e Cultura" offre tour archeologici privati a Chichén Itzá e Tulum senza folla. Come ti chiami?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('coppia') || lowercaseMsg.includes('cena')) {
        reply += 'Per il romance, ti consiglio la crociera con cena Columbus sotto le stelle. Come ti chiami?';
      } else {
        reply += 'Come posso aiutarti? Offriamo: Zone Archeologiche e Cultura, Parchi Tematici ed Eco-Archeologici, Attività Acquatiche e di Mare, Nuoto con i Delfini, e Avventura e Natura.';
      }
    } else if (userLang === 'pt') {
      reply = 'Olá! Sou Miatz, seu concierge da Dany Experiences. ';
      if (lowercaseMsg.includes('familia') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('filh') || lowercaseMsg.includes('parque')) {
        reply += 'Para famílias, recomendo nossos "Parques Temáticos e Eco-Arqueológicos" (Xcaret, Aqua Nick). Qual é o seu nome para verificar disponibilidade?';
      } else if (lowercaseMsg.includes('tubarao') || lowercaseMsg.includes('baleia') || lowercaseMsg.includes('mar') || lowercaseMsg.includes('catamara')) {
        reply += 'Descubra o "Atividades Aquáticas e de Mar" de catamarã ou com o jantar Columbus Cruise. Note que o nado con Tubarão-Baleia está disponível apenas de maio a setembro. Deixe seu WhatsApp para mais detalhes.';
      } else if (lowercaseMsg.includes('golfinho') || lowercaseMsg.includes('nado') || lowercaseMsg.includes('one')) {
        reply += 'Nosso programa "Nado com Golfinhos" oferece encontros privados 1-a-1 com golfinhos (The One). Qual é o seu nome para agendar?';
      } else if (lowercaseMsg.includes('aventura') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('selva') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('foto') || lowercaseMsg.includes('natureza')) {
        reply += 'Prepare-se para "Aventura e Natureza" com ATVs e as lagoas cor-de-rosa de Las Coloradas. Por favor compartilhe seu WhatsApp.';
      } else if (lowercaseMsg.includes('arqueologia') || lowercaseMsg.includes('historia') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('cultura')) {
        reply += 'Nosso "Zonas Arqueológicas e Cultura" oferece expedições arqueológicas privadas a Chichén Itzá e Tulum sem multidões. Qual é o seu nome?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('casal') || lowercaseMsg.includes('jantar')) {
        reply += 'Para romance, sugiro o jantar romântico Columbus Dinner Cruise sob as estrelas. Qual é o seu nome?';
      } else {
        reply += 'Como posso ajudar? Oferecemos: Zonas Arqueológicas e Cultura, Parques Temáticos e Eco-Arqueológicos, Atividades Aquáticas e de Mar, Nado com Golfinhos, e Aventura e Natureza.';
      }
    } else {
      // Default to Spanish (es)
      reply = 'Hola, soy Miatz, tu concierge digital de Dany Experiences. ';
      if (lowercaseMsg.includes('familia') || lowercaseMsg.includes('niño') || lowercaseMsg.includes('hijo') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('parque')) {
        reply += 'Para viajar en familia, te recomiendo "Parques Temáticos y Eco-Arqueológicos" (parques como Xcaret Plus y Aqua Nick). ¿Cuál es tu nombre para verificar disponibilidad?';
      } else if (lowercaseMsg.includes('tiburon') || lowercaseMsg.includes('ballena') || lowercaseMsg.includes('mar') || lowercaseMsg.includes('columbus') || lowercaseMsg.includes('catamaran') || lowercaseMsg.includes('yate')) {
        reply += 'Explora "Actividades Acuáticas y de Mar" en catamarán privado o la cena romántica Columbus Cruise. Ten en cuenta que el nado con Tiburón Ballena solo está disponible de mayo a septiembre. Compárteme tu WhatsApp para darte detalles.';
      } else if (lowercaseMsg.includes('delfin') || lowercaseMsg.includes('dolphin') || lowercaseMsg.includes('nado') || lowercaseMsg.includes('one')) {
        reply += 'Nuestra categoría "Nado con Delfines" ofrece programas de nado interactivo privado 1-a-1 (The One). ¿Te gustaría reservar? ¿Cómo te llamas?';
      } else if (lowercaseMsg.includes('aventura') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('moto') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('selva') || lowercaseMsg.includes('foto') || lowercaseMsg.includes('instagram') || lowercaseMsg.includes('naturaleza')) {
        reply += 'Disfruta de "Aventura y Naturaleza" con tirolesas en Selvática, ATVs y las espectaculares lagunas rosadas de Las Coloradas (¡ideales para fotos!). Déjame tu WhatsApp para enviarte la información.';
      } else if (lowercaseMsg.includes('arqueologia') || lowercaseMsg.includes('historia') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('coba') || lowercaseMsg.includes('cultura')) {
        reply += 'Nuestro "Zonas Arqueológicas y Cultura" te ofrece tours arqueológicos privados con acceso temprano exclusivo a Chichén Itzá, Tulum y Cobá sin multitudes. ¿Cuál es tu nombre para cotizar?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('pareja') || lowercaseMsg.includes('boda') || lowercaseMsg.includes('novio') || lowercaseMsg.includes('cena')) {
        reply += 'Para romance, te sugiero el Columbus Dinner Cruise bajo las estrellas o un cenote privado. ¿Cuál es tu nombre para coordinar?';
      } else {
        reply += '¿Cómo te puedo ayudar? Ofrecemos 5 categorías: Zonas Arqueológicas y Cultura, Parques Temáticos y Eco-Arqueológicos, Actividades Acuáticas y de Mar, Nado con Delfines, y Aventura y Naturaleza.';
      }
    }

    // Trigger mock lead qualified if a phone and name look present
    if (lowercaseMsg.match(/[0-9]{8,}/) || history.length >= 4) {
      reply += '\n\n[LEAD_QUALIFIED]: {"name": "Usuario Demo", "phone": "9981234567", "interest": "Chichen Itza"}';
    }

    return res.status(200).json({ response: reply });
  }

  try {
    const customSystemInstruction = `${MIATZ_SYSTEM_INSTRUCTION}\n\nCRITICAL LANGUAGE DIRECTIVE: The user UI language is currently set to: ${userLang.toUpperCase()}. Regardless of the message language, you MUST respond in this language (${userLang.toUpperCase()}), unless the user explicitly requests to speak in another language. Never mix languages.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: customSystemInstruction,
    });

    const result = await model.generateContent({
      contents: [...formattedHistory, { role: 'user', parts: [{ text: message }] }],
    });

    const responseText = result.response.text();
    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    console.error('[Miatz AI Error]', error);
    return res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
};

/**
 * POST /api/dany/leads
 * Proxy endpoint to push lead captured in chat to Google Sheets.
 */
export const handleDanyLead = async (req: Request, res: Response) => {
  const { name, phone, interest } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }

  const webhookUrl = config.danyGoogleSheetsWebhookUrl || config.googleSheetsWebhookUrl;

  if (!webhookUrl || webhookUrl === 'your_google_apps_script_url') {
    console.warn('[Dany Leads] No Google Sheets Webhook URL configured or is placeholder. Mock saving lead.');
    console.log(`[Mock Save Lead] Date: ${new Date().toISOString()}, Name: ${name}, Phone: ${phone}, Interest: ${interest}, Status: Prospecto`);
    return res.status(200).json({ status: 'success', message: 'Lead saved (Mock mode)' });
  }

  try {
    const payload = {
      date: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Cancun' }) + ' ' + new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Cancun' }),
      name,
      phone,
      interest: interest || 'General',
      status: 'Prospecto'
    };

    console.log(`[Dany Leads] Syncing lead ${name} to Google Sheets...`);
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Lead synchronized successfully',
      backendStatus: response.status
    });
  } catch (error: any) {
    console.error('[Dany Leads Error] Failed to sync to Google Sheets:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to save lead',
      details: error.message
    });
  }
};

/**
 * POST /api/dany/webhook/mercadopago
 * Webhook endpoint for Mercado Pago payment approvals.
 */
export const handleDanyWebhookMP = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('[Mercado Pago Webhook] Received webhook event:', JSON.stringify(event, null, 2));

    // Mercado Pago webhooks send payment details under resource/topic or action
    // Real implementation would look up payment status using Mercado Pago SDK.
    // For now, we log the success and acknowledge the event.
    
    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('[Mercado Pago Webhook Error]', error);
    return res.status(500).send('Internal Server Error');
  }
};
