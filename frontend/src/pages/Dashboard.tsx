import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  Plus,
  UserPlus,
  Eye,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiGet } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────

interface DashboardStats {
  activeRfqs: number;
  pendingApprovals: number;
  purchaseOrders: number;
  invoices: number;
}

interface DashboardMetrics {
  activeRfqs: number;
  pendingApprovals: number;
  poValueThisMonth: string;
  overdueInvoices: number;
}

type POStatus = 'Approved' | 'Pending' | 'Draft';

interface RecentPurchaseOrder {
  id: string;
  vendor: string;
  amount: number;
  status: POStatus;
}

interface SpendingDataPoint {
  month: string;
  spending: number;
  budget: number;
}

interface MetricCardConfig {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
}

// ── Status Badge Styles ─────────────────────────────────────────────

const STATUS_STYLES: Record<POStatus, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Draft: 'bg-slate-100 text-slate-700',
};

// ── Mock Data (fallbacks) ───────────────────────────────────────────

const MOCK_METRICS: DashboardMetrics = {
  activeRfqs: 12,
  pendingApprovals: 5,
  poValueThisMonth: '₹ 2.3L',
  overdueInvoices: 3,
};

const MOCK_PURCHASE_ORDERS: RecentPurchaseOrder[] = [
  { id: 'PO-001', vendor: 'Infra Solutions Pvt.', amount: 87000, status: 'Approved' },
  { id: 'PO-002', vendor: 'TechCore Systems', amount: 140000, status: 'Pending' },
  { id: 'PO-003', vendor: 'OfficeNeed Co.', amount: 34900, status: 'Draft' },
];

const MOCK_SPENDING_DATA: SpendingDataPoint[] = [
  { month: 'Jan', spending: 180000, budget: 200000 },
  { month: 'Feb', spending: 220000, budget: 200000 },
  { month: 'Mar', spending: 165000, budget: 200000 },
  { month: 'Apr', spending: 290000, budget: 250000 },
  { month: 'May', spending: 230000, budget: 250000 },
  { month: 'Jun', spending: 195000, budget: 250000 },
];

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── API response types ──────────────────────────────────────────────

interface APIPurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  quotation: {
    rfq: { title: string };
    vendor: {
      companyName: string;
      user: { firstName: string; lastName: string };
    };
    items: Array<{
      unitPrice: string;
      rfqItem: { quantity: number };
    }>;
  };
}

// ── Component ───────────────────────────────────────────────────────

export default function Dashboard(): React.JSX.Element {
  const [metrics, setMetrics] = useState<DashboardMetrics>(MOCK_METRICS);
  const [recentPOs, setRecentPOs] = useState<RecentPurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [spendingData] = useState<SpendingDataPoint[]>(MOCK_SPENDING_DATA);

  // ── Fetch live data from backend ────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async (): Promise<void> => {
      try {
        // Fetch aggregate stats
        const stats = await apiGet<DashboardStats>('/analytics/dashboard');
        setMetrics({
          activeRfqs: stats.activeRfqs,
          pendingApprovals: stats.pendingApprovals,
          poValueThisMonth: `${stats.purchaseOrders} POs`,
          overdueInvoices: stats.invoices,
        });
      } catch {
        // Silently fall back to mock data
      }

      try {
        // Fetch recent purchase orders
        const pos = await apiGet<APIPurchaseOrder[]>('/financials/purchase-orders');
        if (pos.length > 0) {
          const mapped: RecentPurchaseOrder[] = pos.slice(0, 5).map((po) => {
            const total = po.quotation.items.reduce((sum, item) => {
              return sum + item.rfqItem.quantity * parseFloat(item.unitPrice);
            }, 0);
            const statusMap: Record<string, POStatus> = {
              ISSUED: 'Approved',
              ACKNOWLEDGED: 'Approved',
              FULFILLED: 'Approved',
              CANCELLED: 'Draft',
            };
            return {
              id: po.poNumber,
              vendor: po.quotation.vendor.companyName,
              amount: total,
              status: statusMap[po.status] ?? 'Pending',
            };
          });
          setRecentPOs(mapped);
        }
      } catch {
        // Silently fall back to mock data
      }
    };

    void fetchDashboardData();
  }, []);

  const metricCards: MetricCardConfig[] = [
    {
      title: 'Active RFQs',
      value: String(metrics.activeRfqs),
      subtitle: 'Open requests',
      icon: FileText,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      trend: '+2 this week',
      trendUp: true,
    },
    {
      title: 'Pending Approvals',
      value: String(metrics.pendingApprovals),
      subtitle: 'Awaiting review',
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      trend: '3 urgent',
      trendUp: false,
    },
    {
      title: "PO's this Month",
      value: metrics.poValueThisMonth,
      subtitle: 'Total value',
      icon: DollarSign,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      trend: '+12% vs last month',
      trendUp: true,
    },
    {
      title: 'Invoices',
      value: String(metrics.overdueInvoices),
      subtitle: 'Total generated',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      trend: 'View all',
      trendUp: false,
    },
  ];

  return (
    <DashboardLayout activePage="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, Procurement Officer — Today's Overview
          </p>
        </div>

        {/* ── Metric Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
              >
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          {card.title}
                        </p>
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">
                          {card.value}
                        </p>
                        <p className="text-xs text-slate-400">{card.subtitle}</p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    {card.trend && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span
                          className={`text-xs font-medium ${
                            card.trendUp
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {card.trendUp && (
                            <ArrowUpRight className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                          )}
                          {card.trend}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ── Middle Section (Table + Chart) ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Purchase Orders — 2/3 width */}
          <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Recent Purchase Orders
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Latest procurement activity
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs cursor-pointer"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        PO #
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Vendor
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPOs.map((po) => (
                      <TableRow
                        key={po.id}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <TableCell className="text-sm font-medium text-slate-900">
                          {po.id}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {po.vendor}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-900 text-right tabular-nums">
                          {formatCurrency(po.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[po.status]}`}
                          >
                            {po.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Spending Trends — 1/3 width */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Spending Trends
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Last 6 months
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-5 pt-0">
              <div className="h-56 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart
                    data={spendingData}
                    margin={{ top: 5, right: 15, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Area
                      type="monotone"
                      dataKey="spending"
                      stroke="#059669"
                      strokeWidth={2}
                      fill="url(#spendingGrad)"
                      name="Spending"
                    />
                    <Area
                      type="monotone"
                      dataKey="budget"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#budgetGrad)"
                      name="Budget"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-3 px-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-600 rounded" />
                  <span className="text-xs text-slate-500">Spending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-600 rounded border-dashed" />
                  <span className="text-xs text-slate-500">Budget</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom: Quick Actions ───────────────────────────────── */}
        <div className="border-t border-slate-200 mt-8 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Quick Actions
            </h3>
            <div className="flex items-center gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New RFQ
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-md cursor-pointer transition-all duration-200"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Add Vendor
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-md cursor-pointer transition-all duration-200"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                View Invoices
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
