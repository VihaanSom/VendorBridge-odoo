import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Star,
  Truck,
  IndianRupee,
  Users,
  Loader2,
  FileText,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPatch } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────

type StepStatus = 'completed' | 'current' | 'pending';

interface ApprovalStep {
  id: number;
  label: string;
  status: StepStatus;
}

// ── API response type ───────────────────────────────────────────────

interface APIApproval {
  id: string;
  status: string;
  previousStatus: string;
  remarks: string | null;
  actedAt: string | null;
  createdAt: string;
  approver: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  quotation: {
    id: string;
    deliveryTimelineDays: number;
    status: string;
    vendor: {
      companyName: string;
      rating: string | null;
    };
    items: Array<{
      unitPrice: string;
      rfqItem: { itemName: string; quantity: number };
    }>;
    rfq: {
      title: string;
    };
  };
}

interface ApprovalResult {
  approval: APIApproval;
  poId?: string;
  poNumber?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Stepper Sub-Component ───────────────────────────────────────────

function WorkflowStepper({
  steps,
}: {
  steps: ApprovalStep[];
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step Circle + Label */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : step.status === 'current'
                    ? 'bg-white border-emerald-600 text-emerald-700 ring-4 ring-emerald-100'
                    : 'bg-white border-slate-300 text-slate-400'
              }`}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                step.status === 'completed'
                  ? 'text-emerald-700'
                  : step.status === 'current'
                    ? 'text-emerald-700 font-semibold'
                    : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] rounded-full ${
                step.status === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────

export default function Approvals(): React.JSX.Element {
  const [remarks, setRemarks] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<'approve' | 'reject' | null>(null);
  const [approvals, setApprovals] = useState<APIApproval[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Fetch pending approvals from backend ─────────────────────────
  useEffect(() => {
    const fetchApprovals = async (): Promise<void> => {
      try {
        const data = await apiGet<APIApproval[]>('/approvals');
        setApprovals(data);
      } catch {
        // No approvals or not authenticated
      } finally {
        setIsLoading(false);
      }
    };
    void fetchApprovals();
  }, []);

  const current = approvals[currentIndex] ?? null;

  // Compute totals from current approval's quotation
  const totalAmount = current
    ? current.quotation.items.reduce((sum, item) => {
        return sum + item.rfqItem.quantity * parseFloat(item.unitPrice);
      }, 0)
    : 0;

  // Build dynamic workflow steps
  const workflowSteps: ApprovalStep[] = current
    ? [
        { id: 1, label: 'Submitted', status: 'completed' },
        { id: 2, label: 'Under Review', status: 'completed' },
        { id: 3, label: 'Approval', status: current.status === 'PENDING' ? 'current' : 'completed' },
        { id: 4, label: 'Generate PO', status: current.status === 'APPROVED' ? 'completed' : 'pending' },
      ]
    : [
        { id: 1, label: 'Submitted', status: 'pending' },
        { id: 2, label: 'Under Review', status: 'pending' },
        { id: 3, label: 'Approval', status: 'pending' },
        { id: 4, label: 'Generate PO', status: 'pending' },
      ];

  const handleAction = async (action: 'APPROVED' | 'REJECTED'): Promise<void> => {
    if (!current) return;
    setIsProcessing(action === 'APPROVED' ? 'approve' : 'reject');
    setActionMsg('');

    try {
      const result = await apiPatch<ApprovalResult>(`/approvals/${current.id}`, {
        status: action,
        remarks,
      });

      if (action === 'APPROVED' && result.poNumber) {
        setPoNumber(result.poNumber);
        setActionMsg(`✓ Approved! Purchase Order ${result.poNumber} generated.`);
      } else if (action === 'REJECTED') {
        setActionMsg('✓ Quotation rejected.');
      } else {
        setActionMsg(`✓ ${action.toLowerCase()} successfully.`);
      }

      // Remove from list
      setApprovals((prev) => prev.filter((_, i) => i !== currentIndex));
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      setRemarks('');
    } catch (err) {
      setActionMsg(`✗ ${err instanceof Error ? err.message : 'Action failed'}`);
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout activePage="Approvals">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="Approvals">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8 max-w-5xl"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Approval Workflow
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {current
                ? `RFQ: ${current.quotation.rfq.title} — Vendor: ${current.quotation.vendor.companyName} — ${formatCurrency(totalAmount)}`
                : 'No pending approvals'}
            </p>
          </div>
          {approvals.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => p - 1)}
                className="text-xs cursor-pointer"
              >
                ← Prev
              </Button>
              <span className="text-xs text-slate-500">{currentIndex + 1} / {approvals.length}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === approvals.length - 1}
                onClick={() => setCurrentIndex((p) => p + 1)}
                className="text-xs cursor-pointer"
              >
                Next →
              </Button>
            </div>
          )}
        </div>

        {actionMsg && (
          <p className={`text-sm font-medium ${actionMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {actionMsg}
          </p>
        )}

        {!current && !actionMsg ? (
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardContent className="p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-semibold text-slate-700">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No pending approvals at this time.</p>
            </CardContent>
          </Card>
        ) : current ? (
          <>
            {/* ── Stepper ─────────────────────────────────────────────── */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardContent className="px-8 py-6">
                <WorkflowStepper steps={workflowSteps} />
              </CardContent>
            </Card>

            {/* ── Main Layout (2 Columns) ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ──── Left Column: Approval Info + Remarks ──────────── */}
              <div className="space-y-6">
                {/* Approval Info */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
                  <CardHeader className="px-6 pt-5 pb-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Approval Details
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review &amp; sign-off
                    </p>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="relative">
                      <div className="absolute left-5 top-6 bottom-6 w-px bg-slate-200" />
                      <div className="space-y-0">
                        {/* Current approver node */}
                        <div className="relative flex gap-4 py-4">
                          <div className="relative z-10 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center ring-4 ring-white">
                              <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {current.approver.firstName} {current.approver.lastName}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {current.approver.role}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 bg-amber-100 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Pending
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                              Assigned {new Date(current.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Remarks */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
                  <CardHeader className="px-6 pt-5 pb-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Approval Remarks
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add your comments or conditions
                    </p>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    <Textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setRemarks(e.target.value)
                      }
                      placeholder="Add your comments or conditions..."
                      rows={4}
                      className="border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md resize-none"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* ──── Right Column: Summary + Actions ────────────────── */}
              <div className="space-y-6">
                {/* Quotation Summary */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
                  <CardHeader className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                          Quotation Summary
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Selected vendor details
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <FileText className="w-4.5 h-4.5 text-indigo-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="space-y-4">
                      {/* Vendor */}
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">Vendor</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {current.quotation.vendor.companyName}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <IndianRupee className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">Total</span>
                        </div>
                        <span className="text-lg font-bold text-emerald-700 tabular-nums">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>

                      {/* Delivery */}
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Truck className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">Delivery</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {current.quotation.deliveryTimelineDays} days
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5">
                          <Star className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">Rating</span>
                        </div>
                        <span className="text-sm font-medium text-amber-600">
                          <Star className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
                          {current.quotation.vendor.rating ?? 'N/A'} / 5
                        </span>
                      </div>

                      {/* Items */}
                      <div className="pt-2 space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Line Items</p>
                        {current.quotation.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{item.rfqItem.itemName} × {item.rfqItem.quantity}</span>
                            <span className="font-medium text-slate-900 tabular-nums">
                              {formatCurrency(item.rfqItem.quantity * parseFloat(item.unitPrice))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Step Info */}
                <Card className="border-2 border-emerald-200 shadow-sm bg-emerald-50/50 rounded-lg">
                  <CardContent className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Approval Required
                        </p>
                        <p className="text-xs text-emerald-700/70 mt-1">
                          This quotation requires your sign-off before a
                          Purchase Order can be generated.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {poNumber && (
                  <Card className="border-2 border-indigo-200 shadow-sm bg-indigo-50/50 rounded-lg">
                    <CardContent className="px-6 py-5">
                      <p className="text-sm font-semibold text-indigo-900">
                        🎉 PO Generated: <span className="font-mono">{poNumber}</span>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing !== null}
                    onClick={() => void handleAction('REJECTED')}
                    className="flex-1 h-12 border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProcessing === 'reject' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button
                    type="button"
                    disabled={isProcessing !== null}
                    onClick={() => void handleAction('APPROVED')}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProcessing === 'approve' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </DashboardLayout>
  );
}
