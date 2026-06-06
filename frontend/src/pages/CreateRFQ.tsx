import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  X,
  UploadCloud,
  Send,
  Save,
  FileText,
  Loader2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ── Types ───────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  item: string;
  qty: number;
  unit: string;
}

interface AssignedVendor {
  id: string;
  name: string;
}

interface RfqFormState {
  title: string;
  category: string;
  deadline: string;
  description: string;
  items: LineItem[];
  vendors: AssignedVendor[];
  file: File | null;
}

interface RfqPayload {
  title: string;
  deadline: string;
  attachmentUrl: string;
  items: { item: string; qty: number; unit: string }[];
  vendorIds: string[];
}

interface RfqApiResponse {
  id: string;
  title: string;
  status: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Mock Data ───────────────────────────────────────────────────────

const INITIAL_ITEMS: LineItem[] = [
  { id: generateId(), item: 'Ergonomic Chair', qty: 25, unit: 'NOS' },
  { id: generateId(), item: 'Standing Desk', qty: 10, unit: 'NOS' },
];

const INITIAL_VENDORS: AssignedVendor[] = [
  { id: 'V-001', name: 'Infra Supplies Pvt Ltd' },
  { id: 'V-002', name: 'TechCore LTD' },
];

const INITIAL_FORM: RfqFormState = {
  title: '',
  category: '',
  deadline: '',
  description: '',
  items: INITIAL_ITEMS,
  vendors: INITIAL_VENDORS,
  file: null,
};

// ── Stepper Steps ───────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'RFQ Details' },
  { number: 2, label: 'Review' },
  { number: 3, label: 'Send' },
] as const;

// ── Component ───────────────────────────────────────────────────────

export default function CreateRFQ(): React.JSX.Element {
  const [formData, setFormData] = useState<RfqFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form field helpers ────────────────────────────────────────────

  const updateField = <K extends keyof RfqFormState>(
    field: K,
    value: RfqFormState[K]
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    updateField(name as keyof RfqFormState, value);
  };

  // ── Line Items ────────────────────────────────────────────────────

  const handleAddLineItem = (): void => {
    const newItem: LineItem = {
      id: generateId(),
      item: '',
      qty: 0,
      unit: 'NOS',
    };
    updateField('items', [...formData.items, newItem]);
  };

  const handleRemoveLineItem = (id: string): void => {
    updateField(
      'items',
      formData.items.filter((item) => item.id !== id)
    );
  };

  const handleLineItemChange = (
    id: string,
    field: keyof Omit<LineItem, 'id'>,
    value: string | number
  ): void => {
    updateField(
      'items',
      formData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // ── Vendors ───────────────────────────────────────────────────────

  const handleAddVendor = (): void => {
    // TODO: Replace with a vendor selection modal/dropdown from the directory
    const newVendor: AssignedVendor = {
      id: generateId(),
      name: `New Vendor ${formData.vendors.length + 1}`,
    };
    updateField('vendors', [...formData.vendors, newVendor]);
  };

  const handleRemoveVendor = (id: string): void => {
    updateField(
      'vendors',
      formData.vendors.filter((v) => v.id !== id)
    );
  };

  // ── File Upload ───────────────────────────────────────────────────

  const handleFileSelect = (file: File): void => {
    updateField('file', file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (): void => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  // ── Submit ────────────────────────────────────────────────────────

  const handleSubmit = async (isDraft: boolean): Promise<void> => {
    setIsSubmitting(true);

    try {
      // TODO: File upload logic needs to be integrated with a cloud storage
      // service (like AWS S3 or Firebase Storage) before sending the
      // attachmentUrl to the backend. For now, we pass an empty string.
      const payload: RfqPayload = {
        title: formData.title,
        deadline: formData.deadline,
        attachmentUrl: '',
        items: formData.items.map(({ item, qty, unit }) => ({ item, qty, unit })),
        vendorIds: formData.vendors.map((v) => v.id),
      };

      const res: Response = await fetch('http://localhost:5000/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, status: isDraft ? 'DRAFT' : 'OPEN' }),
      });

      if (!res.ok) {
        throw new Error('Failed to create RFQ');
      }

      const _data = (await res.json()) as RfqApiResponse;
      void _data;

      // TODO: navigate to /rfqs or show success toast
    } catch {
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout activePage="RFQ's">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-6xl"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create RFQ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            New request for quotation
          </p>
        </div>

        {/* ── Stepper ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    step.number === 1
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step.number === 1 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className="w-16 lg:w-24 h-px bg-slate-200 mx-3" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Main Form (2-Column Grid) ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ──── Left Column: Core Details ─────────────────────── */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-slate-800">
                RFQ Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the basic information
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  RFQ Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Office Furniture Procurement Q2"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                  Category
                </Label>
                <Input
                  id="category"
                  name="category"
                  type="text"
                  placeholder="Furniture"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium text-slate-700">
                  Deadline <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  className="h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Ergonomic chairs and standing desks for 3rd floor expansion..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* ──── Right Column: Line Items + Vendors ────────────── */}
          <div className="space-y-6">
            {/* ── Line Items ──────────────────────────────────────── */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="px-6 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Line Items
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Items to be quoted by vendors
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-medium">
                    {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5 pt-0">
                {/* Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-2.5">
                          Item
                        </th>
                        <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-2.5 w-20">
                          Qty
                        </th>
                        <th className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-2.5 w-20">
                          Unit
                        </th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((lineItem) => (
                        <tr
                          key={lineItem.id}
                          className="hover:bg-slate-50/60 transition-colors duration-150"
                        >
                          <td className="px-3 py-2">
                            <Input
                              type="text"
                              value={lineItem.item}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleLineItemChange(lineItem.id, 'item', e.target.value)
                              }
                              placeholder="Item name"
                              className="h-8 border-slate-200 bg-transparent text-sm rounded-md"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              value={lineItem.qty}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleLineItemChange(
                                  lineItem.id,
                                  'qty',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              min={0}
                              className="h-8 border-slate-200 bg-transparent text-sm text-center rounded-md w-16"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="text"
                              value={lineItem.unit}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleLineItemChange(lineItem.id, 'unit', e.target.value)
                              }
                              className="h-8 border-slate-200 bg-transparent text-sm text-center rounded-md w-16"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(lineItem.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
                              aria-label="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="mt-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium cursor-pointer transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Line Item
                </Button>
              </CardContent>
            </Card>

            {/* ── Assigned Vendors ────────────────────────────────── */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
              <CardHeader className="px-6 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Assign Vendors
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select vendors to receive this RFQ
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-medium">
                    {formData.vendors.length} selected
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5 pt-0">
                <div className="space-y-2">
                  {formData.vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {vendor.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVendor(vendor.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
                        aria-label={`Remove ${vendor.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {formData.vendors.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No vendors assigned yet.
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVendor}
                  className="mt-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium cursor-pointer transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Vendor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Bottom Section (Actions + Attachments) ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Attachments ────────────────────────────────────────── */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-slate-800">
                Attachments
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload supporting documents
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-50/60'
                    : 'border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <UploadCloud
                  className={`w-8 h-8 ${
                    isDragOver ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                />
                <p className="text-sm text-slate-500 text-center">
                  <span className="font-medium text-emerald-600">
                    Click to upload
                  </span>{' '}
                  or drag & drop files
                </p>
                <p className="text-xs text-slate-400">
                  PDF, DOC, XLSX up to 10MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                className="hidden"
              />

              {formData.file && (
                <div className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 truncate max-w-xs">
                      {formData.file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({(formData.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('file', null)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
                    aria-label="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Action Buttons ─────────────────────────────────────── */}
          <div className="flex flex-col justify-end gap-3">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(false)}
              className="h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Save & Send to Vendors
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(true)}
              className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
