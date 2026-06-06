import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Printer,
  Mail,
  Building2,
  CalendarDays,
  Hash,
  Loader2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Types ───────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface InvoiceDetails {
  poNumber: string;
  poDate: string;
  invoiceDate: string;
  dueDate: string;
  billTo: string;
  vendorInfo: string;
}

type PaymentStatus = 'Pending Payment' | 'Paid' | 'Overdue';

// ── Mock Data ───────────────────────────────────────────────────────

const INVOICE_DETAILS: InvoiceDetails = {
  poNumber: 'PO-2025-0068',
  poDate: '21 May, 2025',
  invoiceDate: '22 May, 2025',
  dueDate: '21 June, 2025',
  billTo: 'Your Organization Name\n123 Business Park, Ahmedabad\nGSTIN: 25383438AFB',
  vendorInfo: 'Infra Supplies Pvt Ltd\n456, Industrial Estate, Surat\nGSTIN: 343434DB4523',
};

const INVOICE_ITEMS: InvoiceItem[] = [
  { id: 'INV-1', name: 'Ergonomic Chair', qty: 25, unitPrice: 3500, total: 87500 },
  { id: 'INV-2', name: 'Standing Desk', qty: 10, unitPrice: 8200, total: 82000 },
];

const SUBTOTAL = 169500;
const CGST_RATE = 9;
const SGST_RATE = 9;
const CGST_AMOUNT = Math.round(SUBTOTAL * (CGST_RATE / 100));
const SGST_AMOUNT = Math.round(SUBTOTAL * (SGST_RATE / 100));
const GRAND_TOTAL = SUBTOTAL + CGST_AMOUNT + SGST_AMOUNT;

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  'Pending Payment': 'bg-amber-100 text-amber-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Overdue: 'bg-rose-100 text-rose-700',
};

const STATUS_DOT: Record<PaymentStatus, string> = {
  'Pending Payment': 'bg-amber-500',
  Paid: 'bg-emerald-500',
  Overdue: 'bg-rose-500',
};

// ── Component ───────────────────────────────────────────────────────

export default function InvoiceView(): React.JSX.Element {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending Payment');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // ── Action Handlers ───────────────────────────────────────────────

  const handleDownloadPDF = async (): Promise<void> => {
    setIsProcessing('download');
    try {
      // TODO: Map to GET /api/financials/invoices/:id/pdf
      // Should trigger a file download of the generated PDF
      const res: Response = await fetch(
        `http://localhost:5000/api/financials/invoices/${INVOICE_DETAILS.poNumber}/pdf`
      );
      if (!res.ok) throw new Error('Failed to download PDF');
      // TODO: Trigger browser download from blob response
    } catch {
      // TODO: Show error toast
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleEmailInvoice = async (): Promise<void> => {
    setIsProcessing('email');
    try {
      // TODO: Map to POST /api/financials/invoices/:id/email
      // Should send the invoice PDF to the vendor's registered email
      const res: Response = await fetch(
        `http://localhost:5000/api/financials/invoices/${INVOICE_DETAILS.poNumber}/email`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error('Failed to email invoice');
      // TODO: Show success toast
    } catch {
      // TODO: Show error toast
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkAsPaid = (): void => {
    // TODO: PATCH /api/financials/invoices/:id with { status: 'PAID' }
    setPaymentStatus('Paid');
  };

  return (
    <DashboardLayout activePage="Invoices">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-5xl"
      >
        {/* ── Header + Actions ────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Purchase Order & Invoice
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              PO-2025-0068 — Auto-generated after approval
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing === 'download'}
              onClick={() => void handleDownloadPDF()}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md cursor-pointer transition-all duration-200"
            >
              {isProcessing === 'download' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md cursor-pointer transition-all duration-200"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing === 'email'}
              onClick={() => void handleEmailInvoice()}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md cursor-pointer transition-all duration-200"
            >
              {isProcessing === 'email' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5 mr-1.5" />
              )}
              Email Invoice
            </Button>
          </div>
        </div>

        {/* ── Billing & Dates Card ────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-6">
            {/* Addresses — 2-column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bill To */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Bill To
                  </span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                  {INVOICE_DETAILS.billTo}
                </p>
              </div>

              {/* Vendor */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendor
                  </span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                  {INVOICE_DETAILS.vendorInfo}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-slate-200 my-5" />

            {/* Dates & IDs — 2-column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">PO Number:</span>
                  <span className="text-sm font-semibold text-slate-900 font-mono">
                    {INVOICE_DETAILS.poNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">PO Date:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {INVOICE_DETAILS.poDate}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Invoice Date:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {INVOICE_DETAILS.invoiceDate}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Due Date:</span>
                  <span className="text-sm font-semibold text-rose-600">
                    {INVOICE_DETAILS.dueDate}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Financial Table ─────────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 pl-6">
                    Item
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center w-24">
                    Qty
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-right w-36">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-right pr-6 w-36">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Item Rows */}
                {INVOICE_ITEMS.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    <TableCell className="pl-6 text-sm font-medium text-slate-900">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 text-center tabular-nums">
                      {item.qty}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 text-right tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900 text-right pr-6 tabular-nums">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Spacer */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-1" />
                </TableRow>

                {/* Subtotal */}
                <TableRow className="hover:bg-transparent border-t border-slate-200">
                  <TableCell colSpan={3} className="pl-6 text-sm text-slate-500 text-right pr-4">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 text-right pr-6 tabular-nums">
                    {formatCurrency(SUBTOTAL)}
                  </TableCell>
                </TableRow>

                {/* CGST */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="pl-6 text-sm text-slate-500 text-right pr-4">
                    CGST ({CGST_RATE}%)
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 text-right pr-6 tabular-nums">
                    {formatCurrency(CGST_AMOUNT)}
                  </TableCell>
                </TableRow>

                {/* SGST */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="pl-6 text-sm text-slate-500 text-right pr-4">
                    SGST ({SGST_RATE}%)
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 text-right pr-6 tabular-nums">
                    {formatCurrency(SGST_AMOUNT)}
                  </TableCell>
                </TableRow>

                {/* Grand Total */}
                <TableRow className="hover:bg-transparent border-t-2 border-slate-300 bg-slate-50/60">
                  <TableCell colSpan={3} className="pl-6 text-base font-bold text-slate-900 text-right pr-4">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-lg font-bold text-emerald-700 text-right pr-6 tabular-nums">
                    {formatCurrency(GRAND_TOTAL)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Status Footer ───────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Status:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[paymentStatus]}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[paymentStatus]}`}
            />
            {paymentStatus}
          </span>

          {paymentStatus === 'Pending Payment' && (
            <button
              type="button"
              onClick={handleMarkAsPaid}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium ml-2 cursor-pointer transition-colors duration-200 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600"
            >
              Mark as Paid
            </button>
          )}

          {paymentStatus === 'Paid' && (
            <span className="text-xs text-slate-400 ml-2">
              Payment confirmed
            </span>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
