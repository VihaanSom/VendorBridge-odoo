import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Printer,
  Mail,
  Building2,
  CalendarDays,
  Hash,
  Loader2,
  FileText,
  Plus,
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
import { apiGet, apiPost, apiGetBlob } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface InvoiceDetails {
  invoiceId: string;
  invoiceNumber: string;
  poNumber: string;
  poDate: string;
  invoiceDate: string;
  status: string;
  vendorName: string;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
}

type PaymentStatus = 'Pending Payment' | 'Paid' | 'Overdue';

// ── API response types ──────────────────────────────────────────────

interface APIInvoice {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  taxPercentage: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    status: string;
    createdAt: string;
    quotation: {
      deliveryTimelineDays: number;
      vendor: {
        companyName: string;
        gstNumber: string | null;
      };
      items: Array<{
        unitPrice: string;
        rfqItem: {
          itemName: string;
          quantity: number;
        };
      }>;
    };
  };
}

interface APIPurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  quotation: {
    vendor: { companyName: string };
    items: Array<{
      unitPrice: string;
      rfqItem: { itemName: string; quantity: number };
    }>;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function mapStatusToPayment(status: string): PaymentStatus {
  if (status === 'PAID') return 'Paid';
  if (status === 'OVERDUE') return 'Overdue';
  return 'Pending Payment';
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
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending Payment');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availablePOs, setAvailablePOs] = useState<APIPurchaseOrder[]>([]);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // ── Fetch invoices from backend ─────────────────────────────────
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // Fetch existing invoices
        const invoices = await apiGet<APIInvoice[]>('/financials/invoices');
        if (invoices.length > 0 && invoices[0]) {
          const inv = invoices[0];
          setInvoice(mapApiInvoice(inv));
          setPaymentStatus(mapStatusToPayment(inv.status));
        }
      } catch {
        // No invoices or not authenticated
      }

      try {
        // Fetch POs for generating new invoices
        const pos = await apiGet<APIPurchaseOrder[]>('/financials/purchase-orders');
        setAvailablePOs(pos);
      } catch {
        // No POs available
      }

      setIsLoading(false);
    };
    void fetchData();
  }, []);

  function mapApiInvoice(inv: APIInvoice): InvoiceDetails {
    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      poNumber: inv.purchaseOrder.poNumber,
      poDate: formatDate(inv.purchaseOrder.createdAt),
      invoiceDate: formatDate(inv.createdAt),
      status: inv.status,
      vendorName: inv.purchaseOrder.quotation.vendor.companyName,
      subtotal: parseFloat(inv.subtotal),
      taxPercentage: parseFloat(inv.taxPercentage),
      taxAmount: parseFloat(inv.taxAmount),
      totalAmount: parseFloat(inv.totalAmount),
      items: inv.purchaseOrder.quotation.items.map((item, i) => ({
        id: `item-${i}`,
        name: item.rfqItem.itemName,
        qty: item.rfqItem.quantity,
        unitPrice: parseFloat(item.unitPrice),
        total: item.rfqItem.quantity * parseFloat(item.unitPrice),
      })),
    };
  }

  // ── Action Handlers ───────────────────────────────────────────────

  const handleGenerateInvoice = async (poId: string): Promise<void> => {
    setIsGenerating(true);
    setActionMsg('');
    try {
      const result = await apiPost<APIInvoice>('/financials/invoices', {
        poId,
        taxPercentage: 18,
      });
      setInvoice(mapApiInvoice(result));
      setPaymentStatus(mapStatusToPayment(result.status));
      setActionMsg('✓ Invoice generated successfully!');
    } catch (err) {
      setActionMsg(`✗ ${err instanceof Error ? err.message : 'Failed to generate invoice'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (): Promise<void> => {
    if (!invoice) return;
    setIsProcessing('download');
    try {
      const res = await apiGetBlob(`/financials/invoices/${invoice.invoiceId}/pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setActionMsg('✗ Failed to download PDF');
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleEmailInvoice = async (): Promise<void> => {
    if (!invoice) return;
    setIsProcessing('email');
    try {
      await apiPost(`/financials/invoices/${invoice.invoiceId}/email`);
      setActionMsg('✓ Invoice emailed to vendor successfully!');
    } catch {
      setActionMsg('✗ Failed to email invoice');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkAsPaid = (): void => {
    setPaymentStatus('Paid');
  };

  // ── Loading State ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout activePage="Invoices">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  // ── No Invoice — Show PO list to generate from ────────────────────

  if (!invoice) {
    return (
      <DashboardLayout activePage="Invoices">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 max-w-5xl"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Purchase Order &amp; Invoice
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              No invoices generated yet. Select a Purchase Order to generate an invoice.
            </p>
          </div>

          {actionMsg && (
            <p className={`text-sm font-medium ${actionMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
              {actionMsg}
            </p>
          )}

          {availablePOs.length > 0 ? (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 pl-6">PO Number</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">Vendor</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center">Status</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availablePOs.map((po) => (
                      <TableRow key={po.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="pl-6 text-sm font-medium font-mono text-slate-900">{po.poNumber}</TableCell>
                        <TableCell className="text-sm text-slate-700">{po.quotation.vendor.companyName}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                            {po.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Button
                            size="sm"
                            disabled={isGenerating}
                            onClick={() => void handleGenerateInvoice(po.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md cursor-pointer"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Generate Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardContent className="p-10 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No purchase orders available to generate invoices.</p>
                <p className="text-xs text-slate-400 mt-1">Approve a quotation first to create a PO.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </DashboardLayout>
    );
  }

  // ── Invoice Detail View ───────────────────────────────────────────

  const halfTax = invoice.taxAmount / 2;
  const halfTaxRate = invoice.taxPercentage / 2;

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
              Purchase Order &amp; Invoice
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {invoice.invoiceNumber} — Auto-generated after approval
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

        {actionMsg && (
          <p className={`text-sm font-medium ${actionMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {actionMsg}
          </p>
        )}

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
                  Your Organization Name{'\n'}123 Business Park, Ahmedabad{'\n'}GSTIN: 25383438AFB
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
                  {invoice.vendorName}
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
                    {invoice.poNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">PO Date:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {invoice.poDate}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Invoice #:</span>
                  <span className="text-sm font-semibold text-slate-900 font-mono">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Invoice Date:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {invoice.invoiceDate}
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
                {invoice.items.map((item) => (
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
                    {formatCurrency(invoice.subtotal)}
                  </TableCell>
                </TableRow>

                {/* CGST */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="pl-6 text-sm text-slate-500 text-right pr-4">
                    CGST ({halfTaxRate}%)
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 text-right pr-6 tabular-nums">
                    {formatCurrency(halfTax)}
                  </TableCell>
                </TableRow>

                {/* SGST */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="pl-6 text-sm text-slate-500 text-right pr-4">
                    SGST ({halfTaxRate}%)
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 text-right pr-6 tabular-nums">
                    {formatCurrency(halfTax)}
                  </TableCell>
                </TableRow>

                {/* Grand Total */}
                <TableRow className="hover:bg-transparent border-t-2 border-slate-300 bg-slate-50/60">
                  <TableCell colSpan={3} className="pl-6 text-base font-bold text-slate-900 text-right pr-4">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-lg font-bold text-emerald-700 text-right pr-6 tabular-nums">
                    {formatCurrency(invoice.totalAmount)}
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
