import AccountLayout from '@/components/account/account-layout';
import { TicketCard } from '@/components/account/dashboard/cards/ticket-card';

export default function AccountTicketsPage() {
  const breadcrumbs = [
    { label: 'Account', href: '/account' },
    { label: 'Support Tickets', href: '/account/tickets' },
  ];

  return (
    <AccountLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-6xl mx-auto px-4 lg:px-9 py-6">
        <TicketCard title="Support Tickets" className="pb-6" />
      </div>
    </AccountLayout>
  );
}
