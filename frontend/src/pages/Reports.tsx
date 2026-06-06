import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, CalendarDays } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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

interface CategorySpend {
  category: string;
  amountStr: string;
  amountValue: number;
  colorClass: string;
  /** Tailwind bg- color for the bar fill */
  barColor: string;
}

interface TopVendor {
  name: string;
  spend: string;
  pos: number;
}

interface MonthlyTrend {
  month: string;
  value: number;
  isCurrent: boolean;
}

interface MetricCard {
  value: string;
  label: string;
  colorClass: string;
}

// ── Mock Data ───────────────────────────────────────────────────────

const MOCK_METRICS: MetricCard[] = [
  { value: '12.4 L', label: 'Total Spend',       colorClass: 'text-blue-600' },
  { value: '28',     label: 'Active Vendors',     colorClass: 'text-emerald-600' },
  { value: '94%',    label: 'PO Fulfillment',     colorClass: 'text-amber-500' },
  { value: '3',      label: 'Overdue Invoices',   colorClass: 'text-rose-600' },
];

const MOCK_CATEGORY_SPEND: CategorySpend[] = [
  { category: 'IT Hardware', amountStr: '₹4.8L', amountValue: 480000, colorClass: 'text-blue-600',    barColor: 'bg-blue-600' },
  { category: 'Furniture',   amountStr: '₹3.2L', amountValue: 320000, colorClass: 'text-emerald-500', barColor: 'bg-emerald-500' },
  { category: 'Logistics',   amountStr: '₹2.3L', amountValue: 230000, colorClass: 'text-rose-500',    barColor: 'bg-rose-500' },
  { category: 'Stationery',  amountStr: '₹2.1L', amountValue: 210000, colorClass: 'text-amber-500',   barColor: 'bg-amber-500' },
];

const MOCK_TOP_VENDORS: TopVendor[] = [
  { name: 'TechCore Ltd',    spend: '4,20,000', pos: 6 },
  { name: 'Infra Supplies',  spend: '3,10,000', pos: 4 },
  { name: 'FastLog',         spend: '1,90,000', pos: 3 },
];

const MOCK_MONTHLY_TREND: MonthlyTrend[] = [
  { month: 'Dec', value: 180000, isCurrent: false },
  { month: 'Jan', value: 240000, isCurrent: false },
  { month: 'Feb', value: 210000, isCurrent: false },
  { month: 'Mar', value: 310000, isCurrent: false },
  { month: 'Apr', value: 270000, isCurrent: false },
  { month: 'May', value: 350000, isCurrent: true },
];

// Recharts bar colours
const BAR_DEFAULT = '#BFDBFE'; // blue-200
const BAR_CURRENT = '#1D4ED8'; // blue-700

// ── Component ───────────────────────────────────────────────────────

export default function Reports(): React.JSX.Element {
  const [metrics]       = useState<MetricCard[]>(MOCK_METRICS);
  const [categories]    = useState<CategorySpend[]>(MOCK_CATEGORY_SPEND);
  const [vendors]       = useState<TopVendor[]>(MOCK_TOP_VENDORS);
  const [monthlyTrend]  = useState<MonthlyTrend[]>(MOCK_MONTHLY_TREND);

  // ── Backend integration prep ────────────────────────────────────
  // TODO: Swap mock data with live API once backend is running
  useEffect(() => {
    const fetchReports = async (): Promise<void> => {
      try {
        const res: Response = await fetch(
          'http://localhost:5000/api/analytics/reports?month=2025-05'
        );
        if (res.ok) {
          // const data = await res.json();
          // setMetrics(data.metrics);
          // setCategories(data.categories);
          // setVendors(data.vendors);
          // setMonthlyTrend(data.monthlyTrend);
        }
      } catch {
        // Silently fall back to mock data
      }
    };

    void fetchReports();
  }, []);

  // Derive max value for category progress bars
  const maxCategoryValue = Math.max(...categories.map((c) => c.amountValue));

  return (
    <DashboardLayout activePage="Reports">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reports &amp; Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Procurement Insights - May 2025
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-md cursor-pointer transition-all duration-200"
            >
              <CalendarDays className="w-4 h-4 mr-1.5" />
              May 2025
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-md cursor-pointer transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* ── Top Metric Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.07 }}
            >
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className={`text-3xl font-bold tracking-tight ${card.colorClass}`}>
                    {card.value}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-2">
                    {card.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Main Analytics Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ─── Left Column: Spend by Category ────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg h-full">
              <CardContent className="p-6">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                  Spend by Category
                </h2>

                <div className="space-y-5">
                  {categories.map((cat) => {
                    const pct = Math.round((cat.amountValue / maxCategoryValue) * 100);
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            {cat.category}
                          </span>
                          <span className={`text-sm font-semibold ${cat.colorClass}`}>
                            {cat.amountStr}
                          </span>
                        </div>
                        {/* Progress bar track */}
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${cat.barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Right Column: Top Vendors + Monthly Trend ─────────── */}
          <div className="flex flex-col gap-6">
            {/* Top Vendors by Spend */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22 }}
            >
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <div className="p-6 pb-2">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Top Vendors by Spend
                  </h2>
                </div>
                <CardContent className="px-0 pb-0 pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 pl-6">
                          Vendor
                        </TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-right">
                          Spend (₹)
                        </TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center pr-6">
                          POs
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((v) => (
                        <TableRow
                          key={v.name}
                          className="hover:bg-slate-50 transition-colors duration-150"
                        >
                          <TableCell className="text-sm font-medium text-slate-800 pl-6">
                            {v.name}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 text-right tabular-nums">
                            {v.spend}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 text-center pr-6">
                            {v.pos}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Trend */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
            >
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
                <CardContent className="p-6">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">
                    Monthly Trend
                  </h2>

                  <div className="h-52 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart
                        data={monthlyTrend}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                        barCategoryGap="25%"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={(v: number) => `${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value: number) => [
                            `₹${(value / 100000).toFixed(1)}L`,
                            'Spend',
                          ]}
                          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {monthlyTrend.map((entry) => (
                            <Cell
                              key={entry.month}
                              fill={entry.isCurrent ? BAR_CURRENT : BAR_DEFAULT}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
