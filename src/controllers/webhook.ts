import { Request, Response } from 'express';
import { config } from '../config';
import { processChatMessage, isAlreadyQualified, markAsQualified } from '../services/gemini';
import { sendWhatsAppMessage } from '../services/meta';
import { syncContactToGHL } from '../services/ghl';
import { backupToGoogleSheets } from '../services/sheets';

/**
 * GET /webhook
 * Verifies the Webhook token requested by Meta when setting up the callback URL.
 */
export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.metaWebhookVerifyToken) {
      console.log('[Meta Webhook] Verification successful!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Meta Webhook] Verification failed: Token mismatch.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

/**
 * POST /webhook
 * Handles incoming events from Meta Cloud API (WhatsApp messages).
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Check if the event is a WhatsApp Business Account message event
    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const changeValue = body.entry[0].changes[0].value;
        const message = changeValue.messages[0];
        const contact = changeValue.contacts ? changeValue.contacts[0] : null;

        const from = message.from; // User's WhatsApp ID/Phone Number
        const senderName = contact ? contact.profile.name : 'Usuario';
        
        // Handle Text Messages
        if (message.type === 'text') {
          const messageText = message.text.body;
          console.log(`[Meta Webhook] New message from ${senderName} (${from}): "${messageText}"`);

          // Process the message with Google Gemini & Conversation Memory
          const responseText = await processChatMessage(from, senderName, messageText);

          // Check if Gemini triggered the lead qualification tag
          const match = responseText.match(/\[LEAD_QUALIFIED\]:\s*(\{.*\})/);
          
          if (match) {
            // Clean the JSON metadata block so the user doesn't see it on WhatsApp
            const cleanText = responseText.replace(/\[LEAD_QUALIFIED\]:[\s\S]*/, '').trim();
            
            try {
              const leadData = JSON.parse(match[1]);
              console.log(`[Meta Webhook] Lead qualified successfully for ${from}!`);
              console.log(`[Meta Webhook] Extracted Data:`, leadData);

              // Prevent repeating GHL / Sheets triggers if already done in this session
              if (!isAlreadyQualified(from)) {
                // Mark as qualified
                markAsQualified(from);

                // Execute GHL CRM sync and Google Sheets backup concurrently in the background
                console.log('[Meta Webhook] Triggering GHL and Google Sheets integrations concurrently in background...');
                Promise.all([
                  syncContactToGHL(leadData),
                  backupToGoogleSheets(leadData)
                ]).then(() => {
                  console.log('[Meta Webhook] Outbound integrations completed successfully.');
                }).catch((err) => {
                  console.error('[Meta Webhook Error] One or more outbound integrations failed:', err);
                });
              }
            } catch (jsonErr) {
              console.error('[Meta Webhook Error] Failed to parse lead JSON metadata:', jsonErr);
            }

            // Send the clean/friendly message back to the user
            await sendWhatsAppMessage(from, cleanText);
          } else {
            // Send the raw response back to the user
            await sendWhatsAppMessage(from, responseText);
          }
        } else {
          console.log(`[Meta Webhook] Non-text message type received: "${message.type}" from ${from}`);
        }
      }
      
      // Return 200 to let Meta know we received the event safely (preventing retries)
      return res.status(200).send('EVENT_RECEIVED');
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.error('[Meta Webhook Error]', error);
    return res.status(500).send('INTERNAL_SERVER_ERROR');
  }
};
