'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { HelpingHand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/dashboard-badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCustomer } from '@/hooks/customer/useCustomer';
import { fetchOrders } from '@/lib/client/orders';
import type { RawServiceTicket, ServiceTicketSubject } from '@/lib/client/servicetickets';
import { createServiceTicket, fetchServiceTicketSubjects } from '@/lib/client/servicetickets';
import type { SearchResult } from '@/platform/services/model/common';
import type { Order } from '@/platform/services/model/order/order';
import type { Product } from '@/platform/services/model/product';

export interface SupportTicketData {
  ticketId?: string;
  ticketName?: string;
  status?: string;
  orderId?: string | null;
  ownerId?: string | null;
  productId?: string | null;
  subjectId?: string | null;
  customerId?: string | null;
  descriptionEn?: string;
}

export interface SupportTicketDialogProps {
  ticket?: RawServiceTicket | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: SupportTicketData) => void;
  showTriggerButton?: boolean;
}

export function SupportTicketDialog({
  ticket,
  open,
  onOpenChange,
  onSubmit,
  showTriggerButton = true,
}: SupportTicketDialogProps) {
  const t = useTranslations('account');
  const { customer } = useCustomer();
  const [ticketId, setTicketId] = useState<string>('');
  const [ticketName, setTicketName] = useState<string>('');
  const [status, setStatus] = useState<string>('open');
  const [orderId, setOrderId] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [descriptionEn, setDescriptionEn] = useState<string>('');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [subjects, setSubjects] = useState<ServiceTicketSubject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const isViewMode = !!ticket; // read-only when viewing an existing ticket

  useEffect(() => {
    if (ticket) {
      setTicketId(ticket.TicketID || '');
      setTicketName(ticket.Ticketame?.en || '');
      setStatus((ticket.Status || 'open').toLowerCase());
      setOrderId(ticket.OrderID || '');
      setOwnerId(ticket.OwnerID || '');
      setProductId(ticket.ProductID || '');
      setSubjectId(ticket.SubjectID || '');
      setCustomerId(ticket.CustomerID || '');
      setDescriptionEn(ticket.Description?.en || '');
    } else {
      // reset for new ticket
      setTicketId('');
      setTicketName('');
      setStatus('open');
      setOrderId('');
      setOwnerId('');
      setProductId('');
      setSubjectId('');
      setCustomerId('');
      setDescriptionEn('');
    }
  }, [ticket]);

  // Ensure customerId always reflects the currently logged-in customer for new tickets
  useEffect(() => {
    if (!isViewMode) {
      setCustomerId(customer?.id || '');
    }
  }, [customer, isViewMode]);

  // Load recent orders and products for dropdowns when creating a new ticket
  useEffect(() => {
    if (isViewMode) return;
    let cancelled = false;
    (async () => {
      try {
        const [ordersResp, productsResp, subjectsResp] = await Promise.all([
          fetchOrders(10, 0),
          // Use search API to get first 10 products
          fetch('/api/search?size=10', { cache: 'no-store' }).then(
            async (r) => (await r.json()) as SearchResult<Product>,
          ),
          fetchServiceTicketSubjects(),
        ]);
        if (cancelled) return;
        setRecentOrders(Array.isArray(ordersResp) ? ordersResp : []);
        const productItems = Array.isArray(productsResp?.items) ? productsResp.items : [];
        setRecentProducts(productItems);
        setSubjects(Array.isArray(subjectsResp) ? subjectsResp : []);
      } catch (_e) {
        if (cancelled) return;
        setRecentOrders([]);
        setRecentProducts([]);
        setSubjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isViewMode]);

  const statusBadge = useMemo(() => {
    const normalized = (status || 'open').toLowerCase();
    switch (normalized) {
      case 'pending':
      case 'in progress':
        return { variant: 'warning' as const, label: 'pending' };
      case 'closed':
      case 'resolved':
        return { variant: 'success' as const, label: 'closed' };
      default:
        return { variant: 'default' as const, label: 'open' };
    }
  }, [status]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!subjectId) {
      setError(t('serviceTicketDialog.validation.subjectRequired'));
      return;
    }

    if (!descriptionEn.trim()) {
      setError(t('serviceTicketDialog.validation.descriptionRequired'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const ticketData = {
        subjectId,
        descriptionEn: descriptionEn.trim(),
        orderId: orderId || null,
        productId: productId || null,
        customerId: customerId || null,
      };

      // Submit the ticket
      await createServiceTicket(ticketData);

      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit({
          ticketId,
          ticketName,
          status,
          orderId: orderId || null,
          ownerId: ownerId || null,
          productId: productId || null,
          subjectId: subjectId || null,
          customerId: customerId || null,
          descriptionEn,
        });
      }

      // Reset form fields
      setTicketId('');
      setTicketName('');
      setStatus('open');
      setOrderId('');
      setOwnerId('');
      setProductId('');
      setSubjectId('');
      setCustomerId('');
      setDescriptionEn('');

      // Close the dialog
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('serviceTicketDialog.errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTriggerButton && (
        <DialogTrigger asChild>
          <Button>
            {t('newServiceTicket')}
            <HelpingHand className="ml-2" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ticket
              ? t('serviceTicketDialog.titleView') || t('serviceTicketDialog.title')
              : t('serviceTicketDialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Error message */}
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

          {/* Ticket ID: label for existing tickets, hidden for new */}
          {isViewMode && (
            <div className="grid gap-2">
              <label>Ticket ID</label>
              <div className="text-base font-medium">{ticketId || '—'}</div>
            </div>
          )}

          {/* Status: always read-only badge, default to open */}
          <div className="grid gap-2">
            <label>Status</label>
            <div>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Order ID: dropdown when creating new; label in view mode */}
            <div className="grid gap-2">
              <label htmlFor="orderId">Order</label>
              {isViewMode ? (
                <div className="text-base font-medium">{orderId || '—'}</div>
              ) : (
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger id="orderId">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentOrders.slice(0, 10).map((o) => (
                      <SelectItem key={o.id} value={o.id} className="mx-1">
                        {o.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Product ID: dropdown when creating new; label in view mode */}
            <div className="grid gap-2">
              <label htmlFor="productId">Product</label>
              {isViewMode ? (
                <div className="text-base font-medium">{productId || '—'}</div>
              ) : (
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger id="productId">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentProducts.slice(0, 10).map((p) => (
                      <SelectItem key={p.id} value={p.id} className="mx-1">
                        {typeof p.name === 'string' ? p.name : p.name?.en || p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Subject ID: dropdown when creating new; label in view mode */}
            <div className="grid gap-2">
              <label htmlFor="subjectId">Subject *</label>
              {isViewMode ? (
                <div className="text-base font-medium">{subjectId || '—'}</div>
              ) : (
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger id="subjectId">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id} className="mx-1">
                        {typeof subject.name === 'string'
                          ? subject.name
                          : subject.name?.en || subject.name?.de || subject.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Customer ID: always read-only and derived from logged-in customer */}
            <div className="grid gap-2">
              <label htmlFor="customerId">Customer ID</label>
              <div className="text-base font-medium">{customerId || '—'}</div>
            </div>
          </div>

          {/* Description EN only */}
          <div className="grid gap-2">
            <label htmlFor="descriptionEn">Description (EN) *</label>
            <Textarea
              id="descriptionEn"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              maxLength={2000}
              disabled={isViewMode}
              placeholder="Please describe your issue..."
            />
          </div>
        </div>

        <DialogFooter>
          {!isViewMode && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t('serviceTicketDialog.sending') : t('serviceTicketDialog.send')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
