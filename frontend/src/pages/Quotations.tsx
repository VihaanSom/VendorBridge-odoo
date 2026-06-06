import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  Star,
  ArrowRightLeft,
  FileText,
  Loader2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────

interface QuotationItem {
  id: string;
  item: string;
  qty: number;
  unitPrice: number;
  deliveryDays: number;
  rfqItemId: string;
}

interface VendorQuote {
  vendorId: string;
  quotationId: string;
  vendorName: string;
  grandTotal: number;
  gstPercent: number;
  deliveryDays: number;
  rating: string;
  paymentTerms: string;
  status: string;
  isLowest?: boolean;
}

type ViewRole = 'VENDOR' | 'OFFICER';

// ── API Types ───────────────────────────────────────────────────────

interface APIRfq {
  id: string;
  title: string;
  deadline: string;
  status: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitOfMeasure: string;
  }>;
}

interface APIQuotation {
  id: string;
  vendorId: string;
  deliveryTimelineDays: number;
  totalPrice: number;
  status: string;
  vendor: {
    companyName: string;
    rating: string | null;
    user: { firstName: string | null; lastName: string | null };
  };
  items: Array<{
    unitPrice: string;
    rfqItem: { itemName: string; quantity: number };
  }>;
}

interface APIUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ═══════════════════════════════════════════════════════════════════
// VIEW 1 — Submit Quotation (Vendor)
// ═══════════════════════════════════════════════════════════════════

function SubmitQuotationView(): React.JSX.Element {
  const [rfqs, setRfqs] = useState<APIRfq[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<APIRfq | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<number>(14);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMsg, setSubmitMsg] = useState<string>('');

  // Fetch RFQs the vendor is invited to
  useEffect(() => {
    const fetchRfqs = async (): Promise<void> => {
      try {
        const data = await apiGet<APIRfq[]>('/rfqs');
        const activeRfqs = data.filter((r) => r.status === 'ACTIVE');
        setRfqs(activeRfqs);
        if (activeRfqs.length > 0 && activeRfqs[0]) {
          setSelectedRfq(activeRfqs[0]);
          setItems(
            activeRfqs[0].items.map((it) => ({
              id: it.id,
              item: it.itemName,
              qty: it.quantity,
              unitPrice: 0,
              deliveryDays: 0,
              rfqItemId: it.id,
            }))
          );
        }
      } catch {
        // No RFQs available or not authenticated — show empty form
      }
    };
    void fetchRfqs();
  }, []);

  const handleRfqSelect = (rfqId: string): void => {
    const rfq = rfqs.find((r) => r.id === rfqId);
    if (rfq) {
      setSelectedRfq(rfq);
      setItems(
        rfq.items.map((it) => ({
          id: it.id,
          item: it.itemName,
          qty: it.quantity,
          unitPrice: 0,
          deliveryDays: 0,
          rfqItemId: it.id,
        }))
      );
    }
  };

  const handleItemChange = (
    id: string,
    field: 'unitPrice' | 'deliveryDays',
    value: number
  ): void => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // ── Calculations ──────────────────────────────────────────────────

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [items]
  );

  const grandTotal = useMemo(() => subtotal, [subtotal]);

  // ── Submit ────────────────────────────────────────────────────────

  const handleSubmit = async (): Promise<void> => {
    if (!selectedRfq) return;
    setIsSubmitting(true);
    setSubmitMsg('');
    try {
      await apiPost('/quotations', {
        rfqId: selectedRfq.id,
        deliveryTimelineDays: deliveryDays,
        notes,
        items: items.map((it) => ({
          rfqItemId: it.rfqItemId,
          unitPrice: it.unitPrice,
        })),
      });
      setSubmitMsg('✓ Quotation submitted successfully!');
    } catch (err) {
      setSubmitMsg(`✗ ${err instanceof Error ? err.message : 'Failed to submit'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Submit Quotation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {selectedRfq
            ? `RFQ: ${selectedRfq.title} — Deadline ${new Date(selectedRfq.deadline).toLocaleDateString()}`
            : 'Select an RFQ to submit a quotation'}
        </p>
      </div>

      {/* RFQ Selector */}
      {rfqs.length > 0 && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
          <CardContent className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Select RFQ</p>
                <select
                  value={selectedRfq?.id ?? ''}
                  onChange={(e) => handleRfqSelect(e.target.value)}
                  className="mt-2 w-full h-9 border border-slate-200 rounded-md px-3 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {rfqs.map((rfq) => (
                    <option key={rfq.id} value={rfq.id}>
                      {rfq.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotation Table */}
      {items.length > 0 && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 px-5 py-3">Item</th>
                  <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-3 w-20">Qty</th>
                  <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-3 w-36">Unit Price (₹)</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-3 w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{item.item}</td>
                    <td className="px-3 py-3 text-sm text-slate-700 text-center tabular-nums">{item.qty}</td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min={0}
                        value={item.unitPrice || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-9 border-slate-200 bg-white text-sm text-center rounded-md focus-visible:ring-emerald-500 focus-visible:border-emerald-500 tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-900 text-right tabular-nums">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Bottom Section: Notes + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Delivery & Notes */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="deliveryDays" className="text-sm font-medium text-slate-700">
              Delivery Timeline (days)
            </Label>
            <Input
              id="deliveryDays"
              type="number"
              min={1}
              value={deliveryDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeliveryDays(parseInt(e.target.value, 10) || 1)
              }
              className="h-11 w-32 border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Notes / Terms
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Payment terms, warranty details, delivery conditions..."
              rows={4}
              className="border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md resize-none"
            />
          </div>
        </div>

        {/* Right: Order Summary */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg h-fit">
          <CardHeader className="px-6 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-slate-800">Order Summary</h2>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">Grand Total</span>
                <span className="text-xl font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {submitMsg && (
              <p className={`mt-3 text-sm font-medium ${submitMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {submitMsg}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                disabled={isSubmitting || subtotal === 0}
                onClick={() => void handleSubmit()}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Quotation
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIEW 2 — Compare Quotations (Officer)
// ═══════════════════════════════════════════════════════════════════

function CompareQuotationsView(): React.JSX.Element {
  const [rfqs, setRfqs] = useState<APIRfq[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<string>('');
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [approvers, setApprovers] = useState<APIUser[]>([]);
  const [selectedApprover, setSelectedApprover] = useState<string>('');
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  // Fetch RFQs
  useEffect(() => {
    const fetchRfqs = async (): Promise<void> => {
      try {
        const data = await apiGet<APIRfq[]>('/rfqs');
        const activeRfqs = data.filter((r) => r.status === 'ACTIVE' || r.status === 'CLOSED');
        setRfqs(activeRfqs);
        if (activeRfqs.length > 0 && activeRfqs[0]) {
          setSelectedRfqId(activeRfqs[0].id);
        }
      } catch { /* fallback */ }
    };
    void fetchRfqs();
  }, []);

  // Fetch approvers (users with APPROVER role)
  useEffect(() => {
    const fetchApprovers = async (): Promise<void> => {
      try {
        const users = await apiGet<APIUser[]>('/directory/users?role=APPROVER');
        setApprovers(users);
        if (users.length > 0 && users[0]) {
          setSelectedApprover(users[0].id);
        }
      } catch { /* fallback */ }
    };
    void fetchApprovers();
  }, []);

  // Fetch quotations when RFQ changes
  useEffect(() => {
    if (!selectedRfqId) return;
    const fetchQuotes = async (): Promise<void> => {
      try {
        const data = await apiGet<APIQuotation[]>(`/quotations/rfq/${selectedRfqId}`);
        const lowest = Math.min(...data.map((q) => q.totalPrice));
        const mapped: VendorQuote[] = data.map((q) => ({
          vendorId: q.vendorId,
          quotationId: q.id,
          vendorName: q.vendor.companyName,
          grandTotal: q.totalPrice,
          gstPercent: 18,
          deliveryDays: q.deliveryTimelineDays,
          rating: q.vendor.rating ? `${q.vendor.rating} / 5` : 'N/A',
          paymentTerms: 'Net 30',
          status: q.status,
          isLowest: q.totalPrice === lowest,
        }));
        setQuotes(mapped);
      } catch { /* fallback */ }
    };
    void fetchQuotes();
  }, [selectedRfqId]);

  const handleSelectApprove = async (quotationId: string): Promise<void> => {
    if (!selectedApprover) {
      setActionMsg('Please select an approver first.');
      return;
    }
    setIsApproving(quotationId);
    setActionMsg('');
    try {
      await apiPatch(`/quotations/${quotationId}/status`, {
        approverId: selectedApprover,
      });
      setActionMsg('✓ Quotation sent for approval!');
    } catch (err) {
      setActionMsg(`✗ ${err instanceof Error ? err.message : 'Failed to send for approval'}`);
    } finally {
      setIsApproving(null);
    }
  };

  const criteriaRows: { label: string; key: keyof VendorQuote | 'action' }[] = [
    { label: 'Grand Total', key: 'grandTotal' },
    { label: 'GST %', key: 'gstPercent' },
    { label: 'Delivery (days)', key: 'deliveryDays' },
    { label: 'Vendor Rating', key: 'rating' },
    { label: 'Payment Terms', key: 'paymentTerms' },
    { label: '', key: 'action' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quotation Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {quotes.length} quotation(s) received
          </p>
        </div>
      </div>

      {/* RFQ Selector + Approver Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        {rfqs.length > 0 && (
          <div>
            <Label className="text-xs font-medium text-slate-500 mb-1 block">Select RFQ</Label>
            <select
              value={selectedRfqId}
              onChange={(e) => setSelectedRfqId(e.target.value)}
              className="h-9 border border-slate-200 rounded-md px-3 text-sm bg-white focus:ring-emerald-500"
            >
              {rfqs.map((rfq) => (
                <option key={rfq.id} value={rfq.id}>{rfq.title}</option>
              ))}
            </select>
          </div>
        )}
        {approvers.length > 0 && (
          <div>
            <Label className="text-xs font-medium text-slate-500 mb-1 block">Send to Approver</Label>
            <select
              value={selectedApprover}
              onChange={(e) => setSelectedApprover(e.target.value)}
              className="h-9 border border-slate-200 rounded-md px-3 text-sm bg-white focus:ring-emerald-500"
            >
              {approvers.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {actionMsg && (
        <p className={`text-sm font-medium ${actionMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
          {actionMsg}
        </p>
      )}

      {/* Comparison Matrix */}
      {quotes.length > 0 ? (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 px-5 py-4 w-44 min-w-44">
                      Criteria
                    </th>
                    {quotes.map((vendor) => (
                      <th
                        key={vendor.quotationId}
                        className={`text-center px-5 py-4 min-w-48 ${
                          vendor.isLowest
                            ? 'bg-emerald-50 border-x-2 border-t-2 border-emerald-500'
                            : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-sm font-semibold ${
                              vendor.isLowest ? 'text-emerald-800' : 'text-slate-800'
                            }`}
                          >
                            {vendor.vendorName}
                          </span>
                          {vendor.isLowest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Lowest
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criteriaRows.map((row) => (
                    <tr key={row.label || 'action'}>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700 bg-slate-50/40">
                        {row.key !== 'action' && row.label}
                      </td>
                      {quotes.map((vendor) => {
                        const isWinner = vendor.isLowest;
                        const cellBg = isWinner ? 'bg-emerald-50 border-x-2 border-emerald-500' : '';
                        const lastRowBorder = row.key === 'action' && isWinner ? 'border-b-2 border-emerald-500' : '';

                        if (row.key === 'action') {
                          const canApprove = vendor.status === 'SUBMITTED';
                          return (
                            <td key={vendor.quotationId} className={`px-5 py-4 text-center ${cellBg} ${lastRowBorder}`}>
                              <Button
                                type="button"
                                disabled={isApproving === vendor.quotationId || !canApprove}
                                onClick={() => void handleSelectApprove(vendor.quotationId)}
                                className={
                                  isWinner && canApprove
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
                                }
                                variant={isWinner && canApprove ? 'default' : 'outline'}
                              >
                                {isApproving === vendor.quotationId ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                ) : isWinner && canApprove ? (
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                ) : null}
                                {!canApprove ? vendor.status.replace('_', ' ') : isWinner ? 'Select & Approve' : 'Select'}
                              </Button>
                            </td>
                          );
                        }

                        let displayValue: string;
                        if (row.key === 'grandTotal') {
                          displayValue = formatCurrency(vendor[row.key] as number);
                        } else if (row.key === 'gstPercent') {
                          displayValue = `${vendor[row.key]}%`;
                        } else if (row.key === 'deliveryDays') {
                          displayValue = `${vendor[row.key]} days`;
                        } else {
                          displayValue = String(vendor[row.key]);
                        }

                        return (
                          <td key={vendor.quotationId} className={`px-5 py-4 text-center ${cellBg}`}>
                            <span
                              className={`text-sm tabular-nums ${
                                row.key === 'grandTotal'
                                  ? `text-base font-bold ${isWinner ? 'text-emerald-700' : 'text-slate-900'}`
                                  : row.key === 'rating'
                                    ? 'font-medium text-amber-600'
                                    : isWinner
                                      ? 'font-medium text-emerald-800'
                                      : 'font-medium text-slate-700'
                              }`}
                            >
                              {row.key === 'rating' && (
                                <Star className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
                              )}
                              {displayValue}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-10 text-center">
            <p className="text-sm text-slate-500">No quotations found for this RFQ.</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Info */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-500" />
          <span>Recommended (Lowest bid)</span>
        </div>
        <span>·</span>
        <span>Last updated: Just now</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PARENT — Quotations Page
// ═══════════════════════════════════════════════════════════════════

export default function Quotations(): React.JSX.Element {
  const [viewRole, setViewRole] = useState<ViewRole>('VENDOR');

  return (
    <DashboardLayout activePage="Quotations">
      {/* Role Toggle (Demo) */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewRole('VENDOR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
              viewRole === 'VENDOR'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Send className="w-3 h-3" />
            Vendor View
          </button>
          <button
            type="button"
            onClick={() => setViewRole('OFFICER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
              viewRole === 'OFFICER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            Officer View
          </button>
        </div>
      </div>

      {/* Conditional View */}
      {viewRole === 'VENDOR' ? (
        <SubmitQuotationView />
      ) : (
        <CompareQuotationsView />
      )}
    </DashboardLayout>
  );
}
