import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Users, Filter } from 'lucide-react';

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

// ── Types ───────────────────────────────────────────────────────────

type VendorStatus = 'Active' | 'Pending' | 'Blocked';

interface Vendor {
  id: string;
  vendorName: string;
  category: string;
  gstNumber: string;
  contactNo: string;
  status: VendorStatus;
}

interface StatusFilterTab {
  label: string;
  value: VendorStatus | 'All';
  count: number;
}

// ── Status Badge Styles ─────────────────────────────────────────────

const STATUS_STYLES: Record<VendorStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Blocked: 'bg-rose-100 text-rose-700',
};

const STATUS_DOT: Record<VendorStatus, string> = {
  Active: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Blocked: 'bg-rose-500',
};

// ── Mock Data ───────────────────────────────────────────────────────

const MOCK_VENDORS: Vendor[] = [
  {
    id: 'V-001',
    vendorName: 'Infra Supplies Pvt Ltd',
    category: 'Construction',
    gstNumber: '27AABCS1429BZ0',
    contactNo: '+91 98765 43210',
    status: 'Active',
  },
  {
    id: 'V-002',
    vendorName: 'TechCore LTD',
    category: 'IT',
    gstNumber: '27AABCS1429BZ0',
    contactNo: '+91 98765 43211',
    status: 'Active',
  },
  {
    id: 'V-003',
    vendorName: 'FastLog Transport',
    category: 'Logistics',
    gstNumber: '27AABCS1429BZ0',
    contactNo: '+91 98765 43212',
    status: 'Blocked',
  },
  {
    id: 'V-004',
    vendorName: 'GreenLeaf Organics',
    category: 'Agriculture',
    gstNumber: '29BBHCS2219AZ1',
    contactNo: '+91 87654 32109',
    status: 'Active',
  },
  {
    id: 'V-005',
    vendorName: 'BrightStar Electronics',
    category: 'IT',
    gstNumber: '07CCKRS8821CZ3',
    contactNo: '+91 76543 21098',
    status: 'Pending',
  },
  {
    id: 'V-006',
    vendorName: 'Metro Build Corp',
    category: 'Construction',
    gstNumber: '33DDLMS4412DZ5',
    contactNo: '+91 65432 10987',
    status: 'Active',
  },
  {
    id: 'V-007',
    vendorName: 'SafeHaul Logistics',
    category: 'Logistics',
    gstNumber: '19EENPS5523EZ7',
    contactNo: '+91 54321 09876',
    status: 'Pending',
  },
];

// ── Component ───────────────────────────────────────────────────────

export default function Vendors(): React.JSX.Element {
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<VendorStatus | 'All'>('All');

  // TODO: Replace mock data with live API fetch once backend is running
  useEffect(() => {
    const fetchVendors = async (): Promise<void> => {
      try {
        const res: Response = await fetch(
          'http://localhost:5000/api/directory/vendors'
        );
        if (res.ok) {
          const data = (await res.json()) as Vendor[];
          setVendors(data);
        }
      } catch {
        // Silently fall back to mock data
      }
    };

    void fetchVendors();
  }, []);

  // ── Computed counts per status ────────────────────────────────────

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: vendors.length };
    for (const v of vendors) {
      counts[v.status] = (counts[v.status] ?? 0) + 1;
    }
    return counts;
  }, [vendors]);

  const filterTabs: StatusFilterTab[] = [
    { label: 'All', value: 'All', count: statusCounts['All'] ?? 0 },
    { label: 'Active', value: 'Active', count: statusCounts['Active'] ?? 0 },
    { label: 'Pending', value: 'Pending', count: statusCounts['Pending'] ?? 0 },
    { label: 'Blocked', value: 'Blocked', count: statusCounts['Blocked'] ?? 0 },
  ];

  // ── Filtered data ─────────────────────────────────────────────────

  const filteredVendors = useMemo(() => {
    let result = vendors;

    // Status filter
    if (activeFilter !== 'All') {
      result = result.filter((v) => v.status === activeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query) ||
          v.gstNumber.toLowerCase().includes(query) ||
          v.contactNo.includes(query)
      );
    }

    return result;
  }, [vendors, activeFilter, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  return (
    <DashboardLayout activePage="Vendors">
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
              Vendors
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage supplier profiles and registrations
            </p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer transition-all duration-200">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Vendor
          </Button>
        </div>

        {/* ── Search Bar ──────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, GST number, category..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-lg shadow-sm transition-colors duration-200"
          />
        </div>

        {/* ── Filter Tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
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

        {/* ── Data Table ──────────────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 pl-5">
                    Vendor Name
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    GST No.
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Contact No.
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 text-center pr-5">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor, index) => (
                    <motion.tr
                      key={vendor.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors duration-150"
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {vendor.vendorName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {vendor.category}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 font-mono text-xs">
                        {vendor.gstNumber}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {vendor.contactNo}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[vendor.status]}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[vendor.status]}`}
                          />
                          {vendor.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center pr-5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-xs font-medium rounded-md cursor-pointer transition-all duration-200"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-sm text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-slate-300" />
                        <p>No vendors found matching your criteria.</p>
                        <p className="text-xs text-slate-300">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Footer Info ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <p>
            Showing {filteredVendors.length} of {vendors.length} vendors
          </p>
          <p>Last synced: Just now</p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
