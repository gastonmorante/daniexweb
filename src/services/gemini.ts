import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(config.geminiApiKey || 'mock_key_for_compilation');

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// In-memory memory adapters (for a stateless microservice on Render)
const memoryStore = new Map<string, ChatMessage[]>();
const qualifiedStore = new Set<string>();

/**
 * Retrieves the chat history for a specific phone number.
 */
export const getHistory = (phone: string): ChatMessage[] => {
  return memoryStore.get(phone) || [];
};

/**
 * Saves a new message to the conversation history.
 */
export const saveMessage = (phone: string, role: 'user' | 'model', text: string): void => {
  const history = getHistory(phone);
  history.push({ role, parts: [{ text }] });

  // Limit memory length to the last 20 messages to prevent token bloat
  if (history.length > 20) {
    history.shift();
  }

  memoryStore.set(phone, history);
};

/**
 * Clears history and qualified status for testing or resetting.
 */
export const clearHistory = (phone: string): void => {
  memoryStore.delete(phone);
  qualifiedStore.delete(phone);
};

/**
 * Checks if a lead has already been qualified.
 */
export const isAlreadyQualified = (phone: string): boolean => {
  return qualifiedStore.has(phone);
};

/**
 * Marks a phone number as qualified to prevent duplicate API triggers.
 */
export const markAsQualified = (phone: string): void => {
  qualifiedStore.add(phone);
};

// System prompt instructing Gemini how to behave and qualify the lead
const SYSTEM_INSTRUCTION = `
Eres el Agente Comercial Inteligente de NegocioUp, una agencia especializada en automatización de procesos con IA y CRMs para Pymes.
Tu misión principal en este chat de WhatsApp es calificar de manera amigable al prospecto (lead).

Debes recopilar obligatoriamente estos 4 datos del cliente:
1. Nombre completo (separa nombre y apellidos en tu mente de forma lógica).
2. Correo electrónico válido.
3. Teléfono de contacto (confirma si es el mismo de WhatsApp o si prefiere otro).
4. Su necesidad de automatización o IA (qué problemas tiene en su negocio, qué quiere optimizar).

Pautas de comportamiento:
- Sé sumamente empático, educado, persuasivo y profesional.
- Escribe respuestas cortas y conversacionales, óptimas para WhatsApp (máximo 2 a 3 oraciones por mensaje). No envíes testamentos de texto.
- Pide los datos de uno en uno de forma fluida y natural. No hagas un interrogatorio directo ni pidas todos los datos juntos al inicio.
- Si el usuario te hace preguntas sobre NegocioUp, respóndelas brevemente y reorienta la conversación hacia la obtención del siguiente dato faltante.

REGLA CRÍTICA DE ESTRUCTURACIÓN DE DATOS (MAPPING TRIGGER):
Solo cuando hayas recopilado y confirmado los 4 datos requeridos (Nombre, Correo, Teléfono y Necesidad), debes despedirte amigablemente (o indicar que un especialista se pondrá en contacto pronto) y, al final de tu mensaje, en una nueva línea limpia, DEBES escribir exactamente la siguiente etiqueta con la estructura JSON de los datos del prospecto:

[LEAD_QUALIFIED]: {"firstName": "Primer Nombre", "lastName": "Apellidos", "email": "correo@valido.com", "phone": "10 digitos", "needs": "Resumen corto de lo que necesita"}

Asegúrate de rellenar los valores correctos en el JSON basándote en lo conversado. Si no tienes la seguridad de contar con los 4 datos completos, NO agregues la etiqueta [LEAD_QUALIFIED] bajo ninguna circunstancia.
`;

/**
 * Processes a chat message, appends it to history, asks Gemini for a response,
 * saves the response to history, and returns it.
 */
export const processChatMessage = async (
  phone: string,
  senderName: string,
  text: string
): Promise<string> => {
  if (!config.geminiApiKey) {
    console.warn('[Gemini Service] GEMINI_API_KEY is not configured. Running in Mock Mode.');
    // Simulated mock qualification flow for testing
    saveMessage(phone, 'user', text);
    const history = getHistory(phone);
    let mockResponse = `Hola ${senderName}, soy el Agente IA de NegocioUp en modo de prueba. `;
    
    if (history.length === 2) {
      mockResponse += 'Para ayudarte a automatizar tu negocio, ¿podrías darme tu nombre completo y correo electrónico?';
    } else if (history.length === 4) {
      mockResponse += '¡Perfecto! ¿Cuál es el principal proceso de tu negocio que te gustaría automatizar con Inteligencia Artificial?';
    } else if (history.length >= 6) {
      mockResponse += 'Muchas gracias. Un asesor te contactará muy pronto.\n\n[LEAD_QUALIFIED]: {"firstName": "' + senderName + '", "lastName": "Prueba", "email": "test@negocioup.com", "phone": "' + phone + '", "needs": "Automatizar atención al cliente"}';
    } else {
      mockResponse += '¿Qué más te gustaría optimizar?';
    }
    saveMessage(phone, 'model', mockResponse);
    return mockResponse;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Save user message to memory
    saveMessage(phone, 'user', text);

    const history = getHistory(phone);

    // Call Gemini API with the conversation history
    const result = await model.generateContent({
      contents: history,
    });

    const responseText = result.response.text();

    // Save model's response to memory
    saveMessage(phone, 'model', responseText);

    return responseText;
  } catch (error) {
    console.error('[Gemini Service Error]', error);
    return 'Lo siento, he tenido un inconveniente temporal para procesar tu consulta. ¿Me lo podrías repetir por favor?';
  }
};
