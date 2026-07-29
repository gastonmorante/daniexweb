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

BASE DE CONOCIMIENTO (Debes dominar y enfatizar estos datos):
1. Chichén Itzá:
   - Enfatiza los beneficios del acceso temprano (early access) para evitar las grandes multitudes y el sofocante calor del mediodía.
   - Enfatiza el conocimiento arqueastronómico maya, como el descenso de la serpiente emplumada Kukulkán en los equinoccios y la precisión del calendario solar.
   - Atractivos principales: Zona Arqueológica, Pirámide de Kukulkán (El Castillo), Templo de los Guerreros, el Gran Juego de Pelota, el Cenote Sagrado y una visita posterior para nadar y recorrer la hermosa ciudad colonial de Valladolid.
   - Perfil: Ideal para familias, parejas, grupos de amigos y apasionados de la historia.

2. Casa Tortuga:
   - Parque ecológico con 5 cenotes: 3 abiertos (tipo albercas naturales rodeadas de densa vegetación) y 2 tipo caverna (con formaciones de estalactitas y estalagmitas bajo el inframundo).
   - Horario: Abierto de 9:00 AM a 5:00 PM.
   - Incluye: Guía acuático certificado, chaleco salvavidas obligatorio (normativa de seguridad regional), recorrido guiado por los 5 cenotes y posterior tiempo libre en el parque para relajación.
   - Instalaciones: Caminata descalzo en senderos, baños, regaderas y restaurante.
   - Actividades extra (costo adicional, reserva previa): Tirolesas y cuatrimotos (ATVs).
   - Políticas estrictas: Presentarse 15 minutos antes. Uso obligatorio de chaleco salvavidas. **Está estrictamente prohibido usar protectores solares o repelentes no biodegradables** para proteger las aguas vírgenes. No se permite ingresar bebidas alcohólicas.
   - Valor cultural: Explica que para los mayas los cenotes eran entradas al Xibalbá (el inframundo), portales sagrados de vida y ceremonias.

3. Tulum:
   - Única ciudad amurallada maya construida frente al mar Caribe (antiguo puerto comercial del Posclásico llamado Zamá, que significa "Amanecer").
   - Atractivos: Zona Arqueológica, El Castillo (sobre el acantilado), Templo del Dios Descendente, Templo de los Frescos, la Muralla Maya y miradores panorámicos espectaculares con acceso a la playa.
   - Qué llevar: Ropa fresca/cómoda, calzado antiderrapante, sombrero/gorra, protector solar biodegradable, repelente de insectos, traje de baño, toalla, cámara y efectivo.
   - Políticas: Cancelación gratis 24h antes. Cambios sujetos a disponibilidad. No hay reembolso por No Show. Modificable por condiciones climáticas o del INAH.

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
      reply = 'Hello! I am Miatz, jungle guide in test mode. ';
      if (lowercaseMsg.includes('chichen') || lowercaseMsg.includes('itza')) {
        reply += 'Chichén Itzá is the maya archaeoastronomical heart. What is your name to give you first-class early access?';
      } else if (lowercaseMsg.includes('tortuga') || lowercaseMsg.includes('cenote')) {
        reply += 'In Casa Tortuga you will swim in sacred portals of Xibalba. Please share your WhatsApp to send you the biodegradable sunscreen policies.';
      } else if (lowercaseMsg.includes('tulum')) {
        reply += 'Tulum, the majestic Zama, looks at the Caribbean. Would you like to plan this adventure? What is your name?';
      } else {
        reply += 'Do you prefer to explore the Mayan jungle with its sacred cenotes or the walled coast of Tulum?';
      }
    } else if (userLang === 'fr') {
      reply = 'Bonjour! Je suis Miatz, guide de la jungle en mode test. ';
      if (lowercaseMsg.includes('chichen') || lowercaseMsg.includes('itza')) {
        reply += 'Chichén Itzá est le cœur archéoastronomique maya. Quel est votre nom pour vous donner un accès anticipé de première classe?';
      } else if (lowercaseMsg.includes('tortuga') || lowercaseMsg.includes('cenote')) {
        reply += 'À Casa Tortuga, vous nagerez dans des portails sacrés du Xibalba. Veuillez partager votre WhatsApp pour vous envoyer les politiques de crème solaire biodégradable.';
      } else if (lowercaseMsg.includes('tulum')) {
        reply += 'Tulum, la majestueuse Zama, regarde les Caraïbes. Souhaitez-vous planifier cette aventure? Quel est votre nom?';
      } else {
        reply += 'Préférez-vous explorer la jungle maya avec ses cénotes sacrés ou la côte fortifiée de Tulum?';
      }
    } else if (userLang === 'it') {
      reply = 'Ciao! Sono Miatz, guida della giungla in modalità test. ';
      if (lowercaseMsg.includes('chichen') || lowercaseMsg.includes('itza')) {
        reply += 'Chichén Itzá è il cuore archeoastronômico maya. Qual è il tuo nome per darti un accesso prioritario di prima classe?';
      } else if (lowercaseMsg.includes('tortuga') || lowercaseMsg.includes('cenote')) {
        reply += 'A Casa Tortuga nuoterai nei portali sacri di Xibalba. Condividi il tuo WhatsApp per inviarti le politiche sulla protezione solare biodegradabile.';
      } else if (lowercaseMsg.includes('tulum')) {
        reply += 'Tulum, la maestosa Zama, guarda i Caraibi. Vorresti pianificare questa avventura? Come ti chiami?';
      } else {
        reply += 'Preferisci esplorare la giungla maya con i suoi cenote sacri o la costa murata di Tulum?';
      }
    } else if (userLang === 'pt') {
      reply = 'Olá! Sou Miatz, guia da selva em modo de teste. ';
      if (lowercaseMsg.includes('chichen') || lowercaseMsg.includes('itza')) {
        reply += 'Chichén Itzá é o coração arqueoastronômico maia. Qual é o seu nome para lhe dar acesso antecipado de primeira classe?';
      } else if (lowercaseMsg.includes('tortuga') || lowercaseMsg.includes('cenote')) {
        reply += 'Em Casa Tortuga você nadará em portais sagrados de Xibalba. Por favor compartilhe seu WhatsApp para lhe enviar as políticas de protetor solar biodegradável.';
      } else if (lowercaseMsg.includes('tulum')) {
        reply += 'Tulum, a majestosa Zama, olha para o Caribe. Gostaria de planejar esta aventura? Qual é o seu nome?';
      } else {
        reply += 'Você prefere explorar a selva maia com seus cenotes sagrados o a costa murada de Tulum?';
      }
    } else {
      // Default to Spanish (es)
      reply = 'Hola, soy Miatz, guía de la selva en modo de pruebas. ';
      if (lowercaseMsg.includes('chichen') || lowercaseMsg.includes('itza')) {
        reply += 'Chichén Itzá es el corazón arqueoastronómico maya. ¿Cuál es tu nombre para darte acceso temprano de primera clase?';
      } else if (lowercaseMsg.includes('tortuga') || lowercaseMsg.includes('cenote')) {
        reply += 'En Casa Tortuga nadarás en portales sagrados del Xibalbá. Por favor compárteme tu WhatsApp para enviarte las políticas de protector solar biodegradable.';
      } else if (lowercaseMsg.includes('tulum')) {
        reply += 'Tulum, la majestuosa Zamá, mira al Caribe. ¿Te gustaría planear esta aventura? ¿Cómo te llamas?';
      } else {
        reply += '¿Prefieres explorar la selva maya con sus cenotes sagrados o la costa amurallada de Tulum?';
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
