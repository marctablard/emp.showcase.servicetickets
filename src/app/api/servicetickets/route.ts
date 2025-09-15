import { NextRequest, NextResponse } from 'next/server';
import type { CustomerService } from '@/platform/services/customer/CustomerService';

const SERVICE_TICKETS_ENDPOINT = 'https://hook.emporix-cop.integromat.celonis.com/5k2if5sqjcj78cpii352vk1ktlqc1t60';

const CREATE_SERVICE_TICKET_ENDPOINT =
  'https://hook.emporix-cop.integromat.celonis.com/eo3zshxuv7jj7n94ufa2efr1b9qg4wgb';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const customerService = globalThis.EMP.platform.server.get<CustomerService>('CustomerService');
    const currentCustomer = await customerService.getCustomer();

    if (!currentCustomer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const res = await fetch(SERVICE_TICKETS_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerID: currentCustomer.id }),
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch service tickets:', e);
    return NextResponse.json({ error: 'Failed to fetch service tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.subjectId || !body.descriptionEn) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    const res = await fetch(CREATE_SERVICE_TICKET_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to create service ticket:', e);
    return NextResponse.json({ error: 'Failed to create service ticket' }, { status: 500 });
  }
}
