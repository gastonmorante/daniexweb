import axios from 'axios';
import { config } from '../config';

/**
 * Sends a text message to a user via the WhatsApp Cloud API.
 * @param to The recipient's phone number with country code.
 * @param text The message text to send.
 */
export const sendWhatsAppMessage = async (to: string, text: string): Promise<void> => {
  if (!config.metaAccessToken || !config.metaPhoneNumberId) {
    console.warn('[Meta Service] Meta Access Token or Phone Number ID not configured. Message logged instead:');
    console.log(`[Mock Send to ${to}]: "${text}"`);
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${config.metaPhoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`[Meta Service] Message sent successfully to ${to}. Message ID: ${response.data.messages[0].id}`);
  } catch (error: any) {
    console.error('[Meta Service Error] Failed to send message:', error.response?.data || error.message);
  }
};
