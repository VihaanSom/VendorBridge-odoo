import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  FileText,
  Users,
  Activity,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ── Types ───────────────────────────────────────────────────────────

type LogType = 'ALL' | 'RFQ' | 'APPROVALS' | 'INVOICES' | 'VENDORS';

interface LogEntry {
  id: string;
  type: Exclude<LogType, 'ALL'>;
  message: string;
  timestamp: string;
}

// ── Icon & Color Mapping ────────────────────────────────────────────

interface LogIconConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
}

/**
 * Determine the icon, text colour, and soft-background colour for a given
 * log entry based on keyword heuristics in the message text.
 */
function getLogIconConfig(entry: LogEntry): LogIconConfig {
  const msg = entry.message.toLowerCase();

  if (msg.startsWith('quotation selected') || msg.includes('selected')) {
    return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' };
  }
  if (msg.startsWith('approval pending') || msg.includes('awaiting')) {
    return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' };
  }
  if (msg.startsWith('rfq published') || msg.includes('rfq')) {
    return { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' };
  }
  if (msg.startsWith('vendor added') || entry.type === 'VENDORS') {
    return { icon: Users, color: 'text-slate-500', bg: 'bg-slate-100' };
  }

  // Fallback per type
  const fallback: Record<string, LogIconConfig> = {
    APPROVALS: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    RFQ:       { icon: FileText,    color: 'text-indigo-500',  bg: 'bg-indigo-50' },
    INVOICES:  { icon: FileText,    color: 'text-indigo-500',  bg: 'bg-indigo-50' },
    VENDORS:   { icon: Users,       color: 'text-slate-500',   bg: 'bg-slate-100' },
  };

  return fallback[entry.type] ?? { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-50' };
}

// ── Filter Tabs Config ──────────────────────────────────────────────

interface FilterTab {
  label: string;
  value: LogType;
}

const FILTER_TABS: FilterTab[] = [
  { label: 'All',       value: 'ALL' },
  { label: 'RFQ',       value: 'RFQ' },
  { label: 'Approvals', value: 'APPROVALS' },
  { label: 'Invoices',  value: 'INVOICES' },
  { label: 'Vendors',   value: 'VENDORS' },
];

// ── Mock Data ───────────────────────────────────────────────────────

const MOCK_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    type: 'APPROVALS',
    message:
      'Quotation selected — Infra Supplies Pvt Ltd selected for office furniture Q2',
    timestamp: '23 May 2025, 9:15 PM',
  },
  {
    id: 'log-002',
    type: 'APPROVALS',
    message:
      'Approval pending — PO-2024 awaiting L2 approval by Priya Shah',
    timestamp: '22 May 2025, 09:15 AM',
  },
  {
    id: 'log-003',
    type: 'RFQ',
    message:
      'RFQ published — Office furniture Q2 sent to 3 vendors',
    timestamp: '19 May 2025',
  },
  {
    id: 'log-004',
    type: 'VENDORS',
    message:
      'Vendor added — FastLog Transport registered and pending verification',
    timestamp: '18 May 2025, 3:20 PM',
  },
];

// ── Component ───────────────────────────────────────────────────────

export default function ActivityLogs(): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<LogType>('ALL');
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);

  // ── Backend integration prep ────────────────────────────────────
  // TODO: Swap mock data with live API once backend is running
  useEffect(() => {
    const fetchActivityLogs = async (): Promise<void> => {
      try {
        const res: Response = await fetch(
          'http://localhost:5000/api/analytics/activity-logs'
        );
        if (res.ok) {
          const data = (await res.json()) as LogEntry[];
          setLogs(data);
        }
      } catch {
        // Silently fall back to mock data
      }
    };

    void fetchActivityLogs();
  }, []);

  // ── Client-side filtering ───────────────────────────────────────

  const filteredLogs: LogEntry[] =
    activeFilter === 'ALL'
      ? logs
      : logs.filter((entry) => entry.type === activeFilter);

  return (
    <DashboardLayout activePage="Activity">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* ── Header & Filter Tabs ─────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          {/* Title block */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Activity &amp; Logs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Procurement audit trail
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.value;
              return (
                <Button
                  key={tab.value}
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className={`rounded-full text-xs font-medium px-4 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-white hover:bg-slate-900 border-slate-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  onClick={() => setActiveFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* ── Audit Trail List ─────────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  No activity found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  There are no logs matching the selected filter.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredLogs.map((entry, index) => {
                  const { icon: Icon, color, bg } = getLogIconConfig(entry);

                  return (
                    <motion.li
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className="flex items-start gap-4 px-5 py-4"
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${color}`} />
                      </div>

                      {/* Message + Timestamp */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          {entry.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {entry.timestamp}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
