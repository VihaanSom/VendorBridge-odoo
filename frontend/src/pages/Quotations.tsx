import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Save,
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

// ── Types ───────────────────────────────────────────────────────────

interface QuotationItem {
  id: string;
  item: string;
  qty: number;
  unitPrice: number;
  deliveryDays: number;
}

interface VendorQuote {
  vendorId: string;
  vendorName: string;
  grandTotal: number;
  gstPercent: number;
  deliveryDays: number;
  rating: string;
  paymentTerms: string;
  isLowest?: boolean;
}

type ViewRole = 'VENDOR' | 'OFFICER';

// ── Mock Data ───────────────────────────────────────────────────────

const INITIAL_ITEMS: QuotationItem[] = [
  { id: 'qi-1', item: 'Ergonomic Chair', qty: 25, unitPrice: 0, deliveryDays: 0 },
  { id: 'qi-2', item: 'Standing Desk', qty: 10, unitPrice: 0, deliveryDays: 0 },
];

const MOCK_VENDOR_QUOTES: VendorQuote[] = [
  {
    vendorId: 'V-001',
    vendorName: 'Infra Supplies Pvt Ltd',
    grandTotal: 236800,
    gstPercent: 18,
    deliveryDays: 12,
    rating: '4.5 / 5',
    paymentTerms: 'Net 30',
    isLowest: true,
  },
  {
    vendorId: 'V-002',
    vendorName: 'TechCore LTD',
    grandTotal: 289450,
    gstPercent: 18,
    deliveryDays: 18,
    rating: '4.2 / 5',
    paymentTerms: 'Net 45',
  },
  {
    vendorId: 'V-003',
    vendorName: 'OfficeNeed Co.',
    grandTotal: 312000,
    gstPercent: 18,
    deliveryDays: 10,
    rating: '3.8 / 5',
    paymentTerms: 'Net 15',
  },
];

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
  const [items, setItems] = useState<QuotationItem[]>(INITIAL_ITEMS);
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const gstAmount = useMemo(
    () => Math.round(subtotal * (gstPercent / 100)),
    [subtotal, gstPercent]
  );

  const grandTotal = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);

  // ── Submit ────────────────────────────────────────────────────────

  const handleSubmit = async (isDraft: boolean): Promise<void> => {
    setIsSubmitting(true);
    try {
      const payload = {
        rfqId: 'RFQ-001',
        items: items.map(({ item, qty, unitPrice, deliveryDays }) => ({
          item,
          qty,
          unitPrice,
          total: qty * unitPrice,
          deliveryDays,
        })),
        gstPercent,
        subtotal,
        gstAmount,
        grandTotal,
        notes,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
      };

      // TODO: Replace with actual API call
      const res: Response = await fetch('http://localhost:5000/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to submit quotation');
      // TODO: navigate to quotation list or show success toast
    } catch {
      // TODO: Show error toast
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
          RFQ: Office Furniture Procurement Q2 — Deadline 15 June 2025
        </p>
      </div>

      {/* RFQ Summary */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
        <CardContent className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">RFQ Summary</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Ergonomic Chair × 25, Standing Desk × 10 — Category: Furniture
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Table */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 px-5 py-3">
                  Item
                </th>
                <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-3 w-20">
                  Qty
                </th>
                <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-3 w-36">
                  Unit Price (₹)
                </th>
                <th className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-3 w-32">
                  Total
                </th>
                <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-5 py-3 w-32">
                  Delivery (days)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">
                    {item.item}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700 text-center tabular-nums">
                    {item.qty}
                  </td>
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
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={item.deliveryDays || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleItemChange(item.id, 'deliveryDays', parseInt(e.target.value, 10) || 0)
                      }
                      placeholder="0"
                      className="h-9 border-slate-200 bg-white text-sm text-center rounded-md focus-visible:ring-emerald-500 focus-visible:border-emerald-500 tabular-nums"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bottom Section: Tax/Notes + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tax & Notes */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="gstPercent" className="text-sm font-medium text-slate-700">
              Tax / GST %
            </Label>
            <Input
              id="gstPercent"
              type="number"
              min={0}
              max={100}
              value={gstPercent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGstPercent(parseFloat(e.target.value) || 0)
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">GST ({gstPercent}%)</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {formatCurrency(gstAmount)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">Grand Total</span>
                <span className="text-xl font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                disabled={isSubmitting || subtotal === 0}
                onClick={() => void handleSubmit(false)}
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
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void handleSubmit(true)}
                className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-md cursor-pointer transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
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
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const handleSelectApprove = async (vendorId: string): Promise<void> => {
    setIsApproving(vendorId);
    try {
      // TODO: Replace with actual API call
      const res: Response = await fetch(
        `http://localhost:5000/api/quotations/${vendorId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'UNDER_REVIEW' }),
        }
      );
      if (!res.ok) throw new Error('Failed to update status');
      // TODO: Show success toast and navigate
    } catch {
      // TODO: Show error toast
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Quotation Comparison
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          RFQ: Office Furniture Procurement Q2 — 3 quotations received
        </p>
      </div>

      {/* Comparison Matrix */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 px-5 py-4 w-44 min-w-44">
                    Criteria
                  </th>
                  {MOCK_VENDOR_QUOTES.map((vendor) => (
                    <th
                      key={vendor.vendorId}
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
                    {/* Criteria Label */}
                    <td className="px-5 py-4 text-sm font-medium text-slate-700 bg-slate-50/40">
                      {row.key !== 'action' && row.label}
                    </td>

                    {/* Vendor Values */}
                    {MOCK_VENDOR_QUOTES.map((vendor) => {
                      const isWinner = vendor.isLowest;
                      const cellBg = isWinner
                        ? 'bg-emerald-50 border-x-2 border-emerald-500'
                        : '';
                      const lastRowBorder =
                        row.key === 'action' && isWinner
                          ? 'border-b-2 border-emerald-500'
                          : '';

                      if (row.key === 'action') {
                        return (
                          <td
                            key={vendor.vendorId}
                            className={`px-5 py-4 text-center ${cellBg} ${lastRowBorder}`}
                          >
                            {isWinner ? (
                              <Button
                                type="button"
                                disabled={isApproving === vendor.vendorId}
                                onClick={() => void handleSelectApprove(vendor.vendorId)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60"
                              >
                                {isApproving === vendor.vendorId ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                )}
                                Select & Approve
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isApproving === vendor.vendorId}
                                onClick={() => void handleSelectApprove(vendor.vendorId)}
                                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-md cursor-pointer transition-all duration-200"
                              >
                                Select
                              </Button>
                            )}
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
                        <td
                          key={vendor.vendorId}
                          className={`px-5 py-4 text-center ${cellBg}`}
                        >
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
