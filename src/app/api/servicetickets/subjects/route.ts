import { NextRequest, NextResponse } from 'next/server';

const SERVICE_TICKET_SUBJECTS_ENDPOINT =
  'https://hook.emporix-cop.integromat.celonis.com/4v3rxbsczh6zhostyfhcck5tfgb3yoqa';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const res = await fetch(SERVICE_TICKET_SUBJECTS_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch service ticket subjects:', e);
    return NextResponse.json({ error: 'Failed to fetch service ticket subjects' }, { status: 500 });
  }
}
