import { WebhookInbox } from '@arc-nano-kit/sdk/receipts';

export const DEMO_WEBHOOK_SECRET = 'arc_receipts_demo_secret';
export const DEMO_WEBHOOK_TARGET = 'https://seller.app/webhooks/arc';

const globalWebhookInbox = globalThis as typeof globalThis & {
  __arcNanoKitWebhookInbox?: WebhookInbox;
};

export const webhookInbox = globalWebhookInbox.__arcNanoKitWebhookInbox ??= new WebhookInbox();
