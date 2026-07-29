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

BASE DE CONOCIMIENTO (Debes dominar y enfatizar estos datos y las 5 nuevas verticales de negocio):
1. Mundos Extraordinarios (Eco-Parks):
   - Ofrece acceso de primer nivel y prioritario a los parques ecológicos y temáticos más icónicos de México: Xcaret Plus (magia cultural e historia), Xplor (tirolesas y aventura extrema), Xenses (mundo sensorial e ilusiones) y Aqua Nick (parque acuático familiar de Nickelodeon).
   - Perfil: Ideal para viajes en familia, niños y de todas las edades.

2. Legado Ancestral (Arqueología):
   - Expediciones privadas de primer nivel a las zonas arqueológicas mayas más emblemáticas: Chichén Itzá Deluxe (acceso temprano exclusivo para evitar multitudes y calor, pirámide de Kukulkán, arqueoastronomía), Tulum (ciudad amurallada sobre el acantilado del mar Caribe, Zamá/Amanecer) y Cobá (subir a la pirámide Nohoch Mul rodeada de selva alta, templos de Ek Balam).
   - Perfil: Viajeros interesados en historia, exclusividad, privacidad y evitar aglomeraciones.

3. Horizonte Caribe (Experiencias de Mar):
   - Actividades marítimas de alta gama: navegación premium en catamarán privado a Isla Mujeres, nado con snorkel en el Museo Subacuático de Arte (MUSA), el emocionante Jungle Tour conduciendo tu propia lancha rápida por los manglares, pesca deportiva de altura, y el crucero romántico Columbus Dinner Cruise (cena de gala con saxofón bajo las estrellas).
   - Restricción de Temporada Crítica: El nado con Tiburón Ballena solo está disponible estrictamente de mayo a septiembre. ¡Menciónalo siempre si preguntan por esta actividad!
   - Perfil: Amantes del mar, parejas (romance) y entusiastas del snorkel.

4. Conexión Vital (Nado con Delfines):
   - Encuentros cercanos, educativos y respetuosos con delfines en hábitats exclusivos. Programas destacados: Dolphin Interax, Primax y el exclusivo programa privado 1-a-1 "The One".
   - Perfil: Viajeros buscando exclusividad, privacidad extrema, o experiencias sumamente íntimas y educativas.

5. Selva Viva & Adrenalina (Aventura):
   - Aventura en la jungla profunda: tirolesas en Selvática, paseos todoterreno en cuatrimotos (ATVs), nado en el circuito místico de Xenotes (cuatro tipos de cenotes con rapel y tirolesas), y el paisaje surrealista de las lagunas rosadas de Las Coloradas.
   - Perfil: Amantes de la aventura, entusiastas de la fotografía y buscadores de paisajes espectaculares para redes sociales (Instagram).

LÓGICA DE RECOMENDACIÓN INTELIGENTE:
- Si el usuario busca actividades en "familia", prioriza "Mundos Extraordinarios" (Xcaret, Aqua Nick).
- Si el usuario busca "exclusividad" o "privacidad", prioriza "Legado Ancestral" (tours arqueológicos privados) o "Conexión Vital" (el programa nado privado "The One").
- Si el usuario busca "fotos", "Instagram" o paisajes impactantes, prioriza "Las Coloradas" (lagunas rosadas en Selva Viva) o las ruinas frente al mar de "Tulum" (Legado Ancestral).
- Si el usuario busca "romance" o planes de pareja, prioriza el crucero nocturno "Columbus Dinner Cruise" (Horizonte Caribe) o un cenote privado/cueva de "Xenotes" o "Casa Tortuga".

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
      if (lowercaseMsg.includes('family') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('extraordinary') || lowercaseMsg.includes('kid')) {
        reply += 'For families, I highly recommend our "Extraordinary Worlds" package featuring Xcaret Plus and Aqua Nick. What is your name to check availability?';
      } else if (lowercaseMsg.includes('whale') || lowercaseMsg.includes('shark') || lowercaseMsg.includes('sea') || lowercaseMsg.includes('mar') || lowercaseMsg.includes('columbus') || lowercaseMsg.includes('boat') || lowercaseMsg.includes('catamaran')) {
        reply += 'Discover "Caribbean Horizon" with premium catamaran sails to Isla Mujeres or Columbus Dinner Cruise. Note that Whale Shark swims are only available from May to September. Please share your WhatsApp to discuss details.';
      } else if (lowercaseMsg.includes('dolphin') || lowercaseMsg.includes('delfin') || lowercaseMsg.includes('vital') || lowercaseMsg.includes('one')) {
        reply += 'Our "Vital Connection" package offers private 1-on-1 dolphin encounters (The One). Would you like to check available slots? What is your name?';
      } else if (lowercaseMsg.includes('adventure') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('moto') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('selva') || lowercaseMsg.includes('jungle') || lowercaseMsg.includes('photo') || lowercaseMsg.includes('instagram')) {
        reply += 'Get ready for "Living Jungle & Adrenaline" with Selvática ATVs and the stunning pink lagoons of Las Coloradas (perfect for Instagram!). Please share your WhatsApp to send you the specs.';
      } else if (lowercaseMsg.includes('archaeology') || lowercaseMsg.includes('history') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('coba') || lowercaseMsg.includes('ancestral')) {
        reply += 'Our "Ancestral Legacy" provides private early access to Chichén Itzá, Tulum, and Cobá without crowds. What is your name to book a private guide?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('love') || lowercaseMsg.includes('couple') || lowercaseMsg.includes('honey')) {
        reply += 'For romance, I recommend our Columbus Dinner Cruise under the stars or a private cenote swim. What is your name to start planning?';
      } else {
        reply += 'How can I assist you? We offer: Ancestral Legacy (Archaeology), Extraordinary Worlds (Eco-Parks), Caribbean Horizon (Sea), Vital Connection (Dolphins), and Living Jungle (Adventure).';
      }
    } else if (userLang === 'fr') {
      reply = 'Bonjour! Je suis Miatz, votre concierge Dany Experiences. ';
      if (lowercaseMsg.includes('famille') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('enfant')) {
        reply += 'Pour les familles, je recommande nos "Mondes Extraordinaires" (Xcaret, Aqua Nick). Quel est votre nom pour vérifier la disponibilité?';
      } else if (lowercaseMsg.includes('requin') || lowercaseMsg.includes('baleine') || lowercaseMsg.includes('mer') || lowercaseMsg.includes('catamaran')) {
        reply += 'Découvrez "Horizon Caraïbe" avec catamaran ou le dîner Columbus. Notez que la nage avec les Requins-Baleines est disponible uniquement de mai à septembre. Partagez votre WhatsApp pour les détails.';
      } else if (lowercaseMsg.includes('dauphin') || lowercaseMsg.includes('delfin') || lowercaseMsg.includes('vital') || lowercaseMsg.includes('one')) {
        reply += 'Notre programme "Connexion Vitale" propose des rencontres privées 1-à-1 avec les dauphins (The One). Quel est votre nom?';
      } else if (lowercaseMsg.includes('aventure') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('jungle') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('photo')) {
        reply += 'Préparez-vous pour "Jungle Vivante & Adrénaline" avec quad VTT et les lagunes roses de Las Coloradas. Partagez votre WhatsApp.';
      } else if (lowercaseMsg.includes('archeologie') || lowercaseMsg.includes('histoire') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum')) {
        reply += 'Notre "Héritage Ancestral" propose des visites archéologiques privées à Chichén Itzá et Tulum sans foule. Quel est votre nom?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('couple') || lowercaseMsg.includes('diner')) {
        reply += 'Pour le romance, je suggère le Columbus Dinner Cruise sous les étoiles. Quel est votre nom?';
      } else {
        reply += 'Comment puis-je vous aider? Nous offrons: Héritage Ancestral (Archéologie), Mondes Extraordinaires (Parques), Horizon Caraïbe (Mer), Connexion Vitale (Dauphins) et Jungle Vivante (Aventure).';
      }
    } else if (userLang === 'it') {
      reply = 'Ciao! Sono Miatz, il tuo concierge di Dany Experiences. ';
      if (lowercaseMsg.includes('famiglia') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('bambin')) {
        reply += 'Per le famiglie, consiglio i nostri "Mondi Straordinari" (Xcaret, Aqua Nick). Qual è il tuo nome per verificare la disponibilità?';
      } else if (lowercaseMsg.includes('squalo') || lowercaseMsg.includes('balena') || lowercaseMsg.includes('mare') || lowercaseMsg.includes('catamarano')) {
        reply += 'Scopri "Orizzonte Caraibico" in catamarano o con la cena Columbus. Ricorda che il nuoto con gli Squali Balena è disponibile solo da maggio a settembre. Lascia il tuo WhatsApp per dettagli.';
      } else if (lowercaseMsg.includes('delfino') || lowercaseMsg.includes('vital') || lowercaseMsg.includes('one')) {
        reply += 'Il nostro pacchetto "Connessione Vitale" offre incontri privati 1-a-1 con i delfini (The One). Qual è il tuo nome per prenotare?';
      } else if (lowercaseMsg.includes('avventura') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('giungla') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('foto')) {
        reply += 'Prepara la giungla con "Giungla Viva & Adrenalina" con quad e le lagune rosa di Las Coloradas. Lascia il tuo WhatsApp.';
      } else if (lowercaseMsg.includes('archeologia') || lowercaseMsg.includes('storia') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum')) {
        reply += 'L\' "Eredità Ancestrale" offre tour archeologici privati a Chichén Itzá e Tulum senza folla. Come ti chiami?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('coppia') || lowercaseMsg.includes('cena')) {
        reply += 'Per il romance, ti consiglio la crociera con cena Columbus sotto le stelle. Come ti chiami?';
      } else {
        reply += 'Come posso aiutarti? Offriamo: Eredità Ancestrale (Archeologia), Mondi Straordinari (Parchi), Orizzonte Caraibico (Mare), Connessione Vitale (Delfini) e Giungla Viva (Avventura).';
      }
    } else if (userLang === 'pt') {
      reply = 'Olá! Sou Miatz, seu concierge da Dany Experiences. ';
      if (lowercaseMsg.includes('familia') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('filh')) {
        reply += 'Para famílias, recomendo nossos "Mundos Extraordinários" (Xcaret, Aqua Nick). Qual é o seu nome para verificar disponibilidade?';
      } else if (lowercaseMsg.includes('tubarao') || lowercaseMsg.includes('baleia') || lowercaseMsg.includes('mar') || lowercaseMsg.includes('catamara')) {
        reply += 'Descubra o "Horizonte Caribe" de catamarã ou com o jantar Columbus Cruise. Note que o nado con Tubarão-Baleia está disponível apenas de maio a setembro. Deixe seu WhatsApp para mais detalhes.';
      } else if (lowercaseMsg.includes('golfinho') || lowercaseMsg.includes('vital') || lowercaseMsg.includes('one')) {
        reply += 'Nosso programa "Conexão Vital" oferece encontros privados 1-a-1 com golfinhos (The One). Qual é o seu nome para agendar?';
      } else if (lowercaseMsg.includes('aventura') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('selva') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('foto')) {
        reply += 'Prepare-se para "Selva Viva & Adrenalina" com ATVs e as lagoas cor-de-rosa de Las Coloradas. Por favor compartilhe seu WhatsApp.';
      } else if (lowercaseMsg.includes('arqueologia') || lowercaseMsg.includes('historia') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum')) {
        reply += 'Nosso "Legado Ancestral" oferece expedições arqueológicas privadas a Chichén Itzá e Tulum sem multidões. Qual é o seu nome?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('casal') || lowercaseMsg.includes('jantar')) {
        reply += 'Para romance, sugiro o jantar romântico Columbus Dinner Cruise sob as estrelas. Qual é o seu nome?';
      } else {
        reply += 'Como posso ajudar? Oferecemos: Legado Ancestral (Arqueologia), Mundos Extraordinários (Parques), Horizonte Caribe (Mar), Conexão Vital (Golfinhos) e Selva Viva (Aventura).';
      }
    } else {
      // Default to Spanish (es)
      reply = 'Hola, soy Miatz, tu concierge digital de Dany Experiences. ';
      if (lowercaseMsg.includes('familia') || lowercaseMsg.includes('niño') || lowercaseMsg.includes('hijo') || lowercaseMsg.includes('xcaret') || lowercaseMsg.includes('extraordinario')) {
        reply += 'Para viajar en familia, te recomiendo "Mundos Extraordinarios" (parques como Xcaret Plus y Aqua Nick). ¿Cuál es tu nombre para verificar disponibilidad?';
      } else if (lowercaseMsg.includes('tiburon') || lowercaseMsg.includes('ballena') || lowercaseMsg.includes('mar') || lowercaseMsg.includes('columbus') || lowercaseMsg.includes('catamaran') || lowercaseMsg.includes('yate')) {
        reply += 'Explora el "Horizonte Caribe" en catamarán privado o la cena romántica Columbus Cruise. Ten en cuenta que el nado con Tiburón Ballena solo está disponible de mayo a septiembre. Compárteme tu WhatsApp para darte detalles.';
      } else if (lowercaseMsg.includes('delfin') || lowercaseMsg.includes('dolphin') || lowercaseMsg.includes('vital') || lowercaseMsg.includes('one')) {
        reply += 'Nuestra categoría "Conexión Vital" ofrece programas de nado interactivo privado 1-a-1 (The One). ¿Te gustaría reservar? ¿Cómo te llamas?';
      } else if (lowercaseMsg.includes('aventura') || lowercaseMsg.includes('atv') || lowercaseMsg.includes('moto') || lowercaseMsg.includes('coloradas') || lowercaseMsg.includes('selva') || lowercaseMsg.includes('foto') || lowercaseMsg.includes('instagram')) {
        reply += 'Disfruta de "Selva Viva & Adrenalina" con tirolesas en Selvática, ATVs y las espectaculares lagunas rosadas de Las Coloradas (¡ideales para fotos!). Déjame tu WhatsApp para enviarte la información.';
      } else if (lowercaseMsg.includes('arqueologia') || lowercaseMsg.includes('historia') || lowercaseMsg.includes('chichen') || lowercaseMsg.includes('tulum') || lowercaseMsg.includes('coba') || lowercaseMsg.includes('ancestral')) {
        reply += 'Nuestro "Legado Ancestral" te ofrece tours arqueológicos privados con acceso temprano exclusivo a Chichén Itzá, Tulum y Cobá sin multitudes. ¿Cuál es tu nombre para cotizar?';
      } else if (lowercaseMsg.includes('romance') || lowercaseMsg.includes('pareja') || lowercaseMsg.includes('boda') || lowercaseMsg.includes('novio') || lowercaseMsg.includes('cena')) {
        reply += 'Para romance, te sugiero el Columbus Dinner Cruise bajo las estrellas o un cenote privado. ¿Cuál es tu nombre para coordinar?';
      } else {
        reply += '¿Cómo te puedo ayudar? Ofrecemos 5 verticales: Legado Ancestral (Arqueología), Mundos Extraordinarios (Parques), Horizonte Caribe (Mar), Conexión Vital (Delfines) y Selva Viva (Aventura).';
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
