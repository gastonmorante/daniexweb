import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'negocioup_verify_token',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  ghlAccessToken: process.env.GHL_ACCESS_TOKEN || '',
  googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  danyGoogleSheetsWebhookUrl: process.env.DANY_GOOGLE_SHEETS_WEBHOOK_URL || '',
};
