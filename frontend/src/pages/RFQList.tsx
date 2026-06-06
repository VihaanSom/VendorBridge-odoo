import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  FileText,
  Filter,
  Loader2,
  Calendar,
  Users,
  ChevronRight,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRfqs, updateRfqStatus, type Rfq } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────

type RfqStatusFilter = 'ALL' | 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'AWARDED';

interface StatusFilterTab {
  label: string;
  value: RfqStatusFilter;
  count: number;
}

// ── Status Badge Styles ─────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  AWARDED: 'bg-indigo-100 text-indigo-700',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-slate-400',
  ACTIVE: 'bg-emerald-500',
  CLOSED: 'bg-amber-500',
  AWARDED: 'bg-indigo-500',
};

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Allowed status transitions
const NEXT_STATUS: Record<string, string | null> = {
  DRAFT: 'ACTIVE',
  ACTIVE: 'CLOSED',
  CLOSED: 'AWARDED',
  AWARDED: null,
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Activate',
  ACTIVE: 'Close',
  CLOSED: 'Award',
};

// ── Component ───────────────────────────────────────────────────────

export default function RFQList(): React.JSX.Element {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<RfqStatusFilter>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch RFQs
  useEffect(() => {
    const fetchRfqs = async (): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const data = await getRfqs();
        setRfqs(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load RFQs.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchRfqs();
  }, []);

  // ── Status transition handler ─────────────────────────────────────

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const updated = await updateRfqStatus(id, newStatus);
      setRfqs((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update status.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Computed counts ───────────────────────────────────────────────

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rfqs.length };
    for (const r of rfqs) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  }, [rfqs]);

  const filterTabs: StatusFilterTab[] = [
    { label: 'All', value: 'ALL', count: statusCounts['ALL'] ?? 0 },
    { label: 'Draft', value: 'DRAFT', count: statusCounts['DRAFT'] ?? 0 },
    { label: 'Active', value: 'ACTIVE', count: statusCounts['ACTIVE'] ?? 0 },
    { label: 'Closed', value: 'CLOSED', count: statusCounts['CLOSED'] ?? 0 },
    { label: 'Awarded', value: 'AWARDED', count: statusCounts['AWARDED'] ?? 0 },
  ];

  // ── Filtered data ─────────────────────────────────────────────────

  const filteredRfqs = useMemo(() => {
    let result = rfqs;

    if (activeFilter !== 'ALL') {
      result = result.filter((r) => r.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.creator?.email?.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query)
      );
    }

    return result;
  }, [rfqs, activeFilter, searchQuery]);

  return (
    <DashboardLayout activePage="RFQ's">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              RFQ&apos;s
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage requests for quotation
            </p>
          </div>
          <Button
            onClick={() => navigate('/rfqs/new')}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New RFQ
          </Button>
        </div>

        {/* ── Search Bar ──────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title, creator, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-lg shadow-sm transition-colors duration-200"
          />
        </div>

        {/* ── Filter Tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          /* ── Data Table ──────────────────────────────────────────── */
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 pl-5">
                      Title
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Deadline
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center">
                      Items
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center">
                      Vendors
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Created By
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center pr-5">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRfqs.length > 0 ? (
                    filteredRfqs.map((rfq, index) => {
                      const nextStatus = NEXT_STATUS[rfq.status];
                      return (
                        <motion.tr
                          key={rfq.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors duration-150"
                        >
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-slate-500" />
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {rfq.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[rfq.status] || 'bg-slate-100 text-slate-600'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[rfq.status] || 'bg-slate-400'}`}
                              />
                              {rfq.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(rfq.deadline)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {rfq.items?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {rfq.vendorInvites?.length ?? 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {rfq.creator?.email || '—'}
                          </TableCell>
                          <TableCell className="text-center pr-5">
                            <div className="flex items-center justify-center gap-2">
                              {nextStatus && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === rfq.id}
                                  onClick={() => void handleStatusUpdate(rfq.id, nextStatus)}
                                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium rounded-md cursor-pointer transition-all duration-200"
                                >
                                  {updatingId === rfq.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      {NEXT_STATUS_LABEL[rfq.status]}
                                      <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-sm text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p>No RFQs found.</p>
                          <p className="text-xs text-slate-300">
                            Create a new RFQ to get started.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── Footer Info ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <p>
            Showing {filteredRfqs.length} of {rfqs.length} RFQs
          </p>
          <p>Last synced: Just now</p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
