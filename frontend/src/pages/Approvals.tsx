import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ── Types ───────────────────────────────────────────────────────────

type StepStatus = 'completed' | 'current' | 'pending';

interface ApprovalStep {
  id: number;
  label: string;
  status: StepStatus;
}

type NodeStatus = 'APPROVED' | 'PENDING';

interface ApprovalNode {
  id: string;
  name: string;
  role: string;
  status: NodeStatus;
  date: string;
}

interface QuotationSummary {
  vendorName: string;
  total: string;
  deliveryDays: string;
  rating: string;
}

// ── Mock Data ───────────────────────────────────────────────────────

const WORKFLOW_STEPS: ApprovalStep[] = [
  { id: 1, label: 'Submitted', status: 'completed' },
  { id: 2, label: 'L1 Review', status: 'completed' },
  { id: 3, label: 'L2 Approval', status: 'current' },
  { id: 4, label: 'Generate PO', status: 'pending' },
];

const APPROVAL_CHAIN: ApprovalNode[] = [
  {
    id: 'AN-001',
    name: 'Rahul Mehta',
    role: 'Procurement Head',
    status: 'APPROVED',
    date: 'May 20, 10:32 AM',
  },
  {
    id: 'AN-002',
    name: 'Priya Shah',
    role: 'Finance Manager',
    status: 'PENDING',
    date: 'Assigned May 21',
  },
];

const QUOTATION_SUMMARY: QuotationSummary = {
  vendorName: 'Infra Supplies Pvt Ltd',
  total: '₹1,85,400',
  deliveryDays: '10 days',
  rating: '4.5 / 5',
};

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

  const handleAction = async (action: 'APPROVED' | 'REJECTED'): Promise<void> => {
    setIsProcessing(action === 'APPROVED' ? 'approve' : 'reject');

    try {
      // TODO: Replace with actual API call
      const res: Response = await fetch(
        'http://localhost:5000/api/approvals/AN-002',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action, remarks }),
        }
      );

      if (!res.ok) throw new Error(`Failed to ${action.toLowerCase()} quotation`);

      // TODO: On successful approval, route to Purchase Orders view or show success toast
    } catch {
      // TODO: Show error toast
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <DashboardLayout activePage="Approvals">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8 max-w-5xl"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Approval Workflow
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            RFQ: Office Furniture Q2 — Vendor: Infra Supplies — ₹1,85,400
          </p>
        </div>

        {/* ── Stepper ─────────────────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
          <CardContent className="px-8 py-6">
            <WorkflowStepper steps={WORKFLOW_STEPS} />
          </CardContent>
        </Card>

        {/* ── Main Layout (2 Columns) ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ──── Left Column: Approval Chain + Remarks ──────────── */}
          <div className="space-y-6">
            {/* Approval Chain */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="px-6 pt-5 pb-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  Approval Chain
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sequential review & sign-off
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="relative">
                  {/* Vertical connecting line */}
                  <div className="absolute left-5 top-6 bottom-6 w-px bg-slate-200" />

                  <div className="space-y-0">
                    {APPROVAL_CHAIN.map((node, index) => (
                      <div key={node.id} className="relative flex gap-4 py-4">
                        {/* Status Icon */}
                        <div className="relative z-10 shrink-0">
                          {node.status === 'APPROVED' ? (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center ring-4 ring-white">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center ring-4 ring-white">
                              <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {node.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {node.role}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${
                                node.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  node.status === 'APPROVED'
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {node.status === 'APPROVED' ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">
                            {node.status === 'APPROVED' ? 'Approved on' : 'Awaiting —'}{' '}
                            {node.date}
                          </p>

                          {/* Show remark placeholder for approved nodes */}
                          {node.status === 'APPROVED' && (
                            <div className="mt-2 px-3 py-2 rounded-md bg-slate-50 border border-slate-100">
                              <p className="text-xs text-slate-500 italic">
                                "Pricing verified. Vendor track record is satisfactory."
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                      {QUOTATION_SUMMARY.vendorName}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Total</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700 tabular-nums">
                      {QUOTATION_SUMMARY.total}
                    </span>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Delivery</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {QUOTATION_SUMMARY.deliveryDays}
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
                      {QUOTATION_SUMMARY.rating}
                    </span>
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
                      L2 Approval Required
                    </p>
                    <p className="text-xs text-emerald-700/70 mt-1">
                      This quotation requires your sign-off as Finance Manager before a
                      Purchase Order can be generated.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
      </motion.div>
    </DashboardLayout>
  );
}
