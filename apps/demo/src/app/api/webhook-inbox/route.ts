import { DEMO_WEBHOOK_SECRET, DEMO_WEBHOOK_TARGET, webhookInbox } from './store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const payload = await request.text();
  const header = request.headers.get('x-arc-signature');

  if (!header) {
    return Response.json(
      { error: 'Missing x-arc-signature header' },
      { status: 400 },
    );
  }

  const delivery = webhookInbox.receive({
    payload,
    header,
    secret: DEMO_WEBHOOK_SECRET,
    target: DEMO_WEBHOOK_TARGET,
  });

  return Response.json({ delivery });
}
