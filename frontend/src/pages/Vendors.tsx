import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Users, Filter, Loader2 } from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getVendors, type VendorProfile } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────

type VendorStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface StatusFilterTab {
  label: string;
  value: VendorStatusFilter;
  count: number;
}

// ── Status Badge Styles ─────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-rose-100 text-rose-700',
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-amber-500',
  SUSPENDED: 'bg-rose-500',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};

// ── Component ───────────────────────────────────────────────────────

export default function Vendors(): React.JSX.Element {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<VendorStatusFilter>('ALL');

  // ── Add Vendor Modal state ──────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  interface NewVendorForm {
    companyName: string;
    email: string;
    gstNumber: string;
    contactPhone: string;
    category: string;
  }

  const INITIAL_FORM: NewVendorForm = {
    companyName: '',
    email: '',
    gstNumber: '',
    contactPhone: '',
    category: '',
  };

  const [newVendorForm, setNewVendorForm] = useState<NewVendorForm>(INITIAL_FORM);

  // Fetch vendors from API
  useEffect(() => {
    const fetchVendors = async (): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const data = await getVendors();
        setVendors(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load vendors.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchVendors();
  }, []);

  // ── Computed counts per status ────────────────────────────────────

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: vendors.length };
    for (const v of vendors) {
      counts[v.vendorStatus] = (counts[v.vendorStatus] ?? 0) + 1;
    }
    return counts;
  }, [vendors]);

  const filterTabs: StatusFilterTab[] = [
    { label: 'All', value: 'ALL', count: statusCounts['ALL'] ?? 0 },
    { label: 'Active', value: 'ACTIVE', count: statusCounts['ACTIVE'] ?? 0 },
    { label: 'Inactive', value: 'INACTIVE', count: statusCounts['INACTIVE'] ?? 0 },
    { label: 'Suspended', value: 'SUSPENDED', count: statusCounts['SUSPENDED'] ?? 0 },
  ];

  // ── Filtered data ─────────────────────────────────────────────────

  const filteredVendors = useMemo(() => {
    let result = vendors;

    // Status filter
    if (activeFilter !== 'ALL') {
      result = result.filter((v) => v.vendorStatus === activeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.companyName.toLowerCase().includes(query) ||
          v.category.toLowerCase().includes(query) ||
          v.gstNumber.toLowerCase().includes(query) ||
          (v.contactPhone && v.contactPhone.includes(query)) ||
          (v.user?.email && v.user.email.toLowerCase().includes(query))
      );
    }

    return result;
  }, [vendors, activeFilter, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleFormChange = (
    field: keyof NewVendorForm,
    value: string
  ): void => {
    setNewVendorForm((prev) => ({ ...prev, [field]: value }));
  };

  // TODO: BACKEND — Replace this mock insertion with a real call to
  // POST /api/auth/signup  { role: "VENDOR", email, password: "temp123", companyName, gstNumber, category, contactPhone }
  // then re-fetch the vendors list via getVendors().
  const handleAddVendor = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    const mockVendor: VendorProfile = {
      id: `mock-${Date.now()}`,
      userId: `mock-user-${Date.now()}`,
      companyName: newVendorForm.companyName,
      gstNumber: newVendorForm.gstNumber,
      contactPhone: newVendorForm.contactPhone || null,
      category: newVendorForm.category,
      vendorStatus: 'ACTIVE',
      rating: null,
      user: {
        id: `mock-user-${Date.now()}`,
        email: newVendorForm.email,
        firstName: null,
        lastName: null,
        isActive: true,
      },
    };

    setVendors((prev) => [mockVendor, ...prev]);
    setNewVendorForm(INITIAL_FORM);
    setIsModalOpen(false);
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
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-md shadow-sm cursor-pointer transition-all duration-200">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Vendor
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg bg-white border border-slate-200 rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Add New Vendor
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddVendor} className="flex flex-col gap-4 mt-4">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-company" className="text-sm font-medium text-slate-700">
                    Company Name
                  </Label>
                  <Input
                    id="vendor-company"
                    placeholder="e.g. Acme Supplies Pvt. Ltd."
                    value={newVendorForm.companyName}
                    onChange={(e) => handleFormChange('companyName', e.target.value)}
                    required
                    className="h-10 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    placeholder="vendor@company.com"
                    value={newVendorForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                    className="h-10 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md"
                  />
                </div>

                {/* GST + Contact (2-col) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor-gst" className="text-sm font-medium text-slate-700">
                      GST Number
                    </Label>
                    <Input
                      id="vendor-gst"
                      placeholder="22AAAAA0000A1Z5"
                      value={newVendorForm.gstNumber}
                      onChange={(e) => handleFormChange('gstNumber', e.target.value)}
                      required
                      className="h-10 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor-phone" className="text-sm font-medium text-slate-700">
                      Contact Number
                    </Label>
                    <Input
                      id="vendor-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={newVendorForm.contactPhone}
                      onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                      className="h-10 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-category" className="text-sm font-medium text-slate-700">
                    Category
                  </Label>
                  <Input
                    id="vendor-category"
                    placeholder="e.g. IT Hardware, Office Supplies"
                    value={newVendorForm.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    required
                    className="h-10 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm cursor-pointer transition-all duration-200"
                >
                  Save Vendor
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

        {/* ── Error State ─────────────────────────────────────────── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* ── Loading State ───────────────────────────────────────── */}
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
                      Vendor Name
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      GST No.
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Contact
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
                            <div>
                              <span className="text-sm font-medium text-slate-900 block">
                                {vendor.companyName}
                              </span>
                              {vendor.user?.email && (
                                <span className="text-xs text-slate-400">
                                  {vendor.user.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {vendor.category}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 font-mono text-xs">
                          {vendor.gstNumber}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {vendor.contactPhone || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[vendor.vendorStatus] || 'bg-slate-100 text-slate-600'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[vendor.vendorStatus] || 'bg-slate-400'}`}
                            />
                            {STATUS_LABEL[vendor.vendorStatus] || vendor.vendorStatus}
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
        )}

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
