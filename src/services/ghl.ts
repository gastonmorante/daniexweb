import axios from 'axios';
import { config } from '../config';

export interface GHLContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  needs: string;
}

/**
 * Connects to GoHighLevel API v2 to create or update a contact,
 * and appends their needs as a CRM note.
 */
export const syncContactToGHL = async (data: GHLContactPayload): Promise<void> => {
  if (!config.ghlAccessToken) {
    console.warn('[GHL Service] GHL_ACCESS_TOKEN is not configured. CRM sync skipped (Mock Mode active).');
    return;
  }

  const contactUrl = 'https://services.leadconnectorhq.com/contacts/';

  const payload = {
    firstName: data.firstName,
    lastName: data.lastName || '',
    email: data.email,
    phone: data.phone,
    tags: ['NegocioUp-Cerebro', 'WhatsApp-Lead']
  };

  try {
    console.log(`[GHL Service] Syncing contact: ${data.firstName} ${data.lastName} (${data.email})...`);

    // 1. Create or Update the Contact
    const response = await axios.post(contactUrl, payload, {
      headers: {
        Authorization: `Bearer ${config.ghlAccessToken}`,
        Version: '2021-04-15',
        'Content-Type': 'application/json'
      }
    });

    const contactId = response.data?.contact?.id;
    console.log(`[GHL Service] Contact synced successfully in GHL. ID: ${contactId}`);

    // 2. Add detailed needs as a CRM Note
    if (contactId && data.needs) {
      const noteUrl = `https://services.leadconnectorhq.com/contacts/${contactId}/notes`;
      
      await axios.post(noteUrl, {
        body: `Necesidades de automatización/IA identificadas por Gemini: ${data.needs}`
      }, {
        headers: {
          Authorization: `Bearer ${config.ghlAccessToken}`,
          Version: '2021-04-15',
          'Content-Type': 'application/json'
        }
      });
      console.log(`[GHL Service] Needs note added successfully to contact ID ${contactId}`);
    }
  } catch (error: any) {
    console.error('[GHL Service Error] Failed to sync contact:', error.response?.data || error.message);
  }
};
