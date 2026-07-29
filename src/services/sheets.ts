import axios from 'axios';
import { config } from '../config';

export interface SheetsPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  needs: string;
}

/**
 * Sends a POST request to Google Apps Script Webhook
 * to save lead details to Google Sheets.
 */
export const backupToGoogleSheets = async (data: SheetsPayload): Promise<void> => {
  if (!config.googleSheetsWebhookUrl) {
    console.warn('[Sheets Service] GOOGLE_SHEETS_WEBHOOK_URL is not configured. Sheets backup skipped (Mock Mode active).');
    return;
  }

  const payload = {
    ...data,
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`[Sheets Service] Backing up lead data for ${data.firstName} to Google Sheets...`);
    
    const response = await axios.post(config.googleSheetsWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[Sheets Service] Backup completed. Response status: ${response.status}`);
  } catch (error: any) {
    console.error('[Sheets Service Error] Failed to backup to Google Sheets:', error.response?.data || error.message);
  }
};
