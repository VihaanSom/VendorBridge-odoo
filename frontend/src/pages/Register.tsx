import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Building2,
  Hash,
  Tag,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';

// ── Constants ───────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OFFICER', label: 'Officer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'APPROVER', label: 'Approver' },
] as const;

const VENDOR_CATEGORIES = [
  'Construction',
  'IT',
  'Logistics',
  'Agriculture',
  'Manufacturing',
  'Consulting',
  'Other',
] as const;

// ── Types ───────────────────────────────────────────────────────────

interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: string;
  // Vendor-only fields
  companyName: string;
  gstNumber: string;
  category: string;
}

const INITIAL_FORM_STATE: RegisterFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  role: '',
  companyName: '',
  gstNumber: '',
  category: '',
};

// ── Component ───────────────────────────────────────────────────────

export default function Register(): React.JSX.Element {
  const [formData, setFormData] = useState<RegisterFormState>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { signup } = useAuth();

  const isVendor = formData.role === 'VENDOR';

  const updateField = (
    field: keyof RegisterFormState,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    updateField(name as keyof RegisterFormState, value);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.role) {
      setError('Please select a role.');
      return;
    }

    if (isVendor && (!formData.companyName || !formData.gstNumber || !formData.category)) {
      setError('Vendor role requires company name, GST number, and category.');
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        contactPhone: formData.phone || undefined,
        // Vendor-specific
        ...(isVendor && {
          companyName: formData.companyName,
          gstNumber: formData.gstNumber,
          category: formData.category,
        }),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-10">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="border border-slate-200 shadow-lg bg-white rounded-lg">
          <CardHeader className="flex flex-col items-center gap-3 pt-10 pb-2">
            {/* Profile photo placeholder */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md ring-4 ring-emerald-100"
            >
              <Building2 className="w-9 h-9 text-white" strokeWidth={1.8} />
            </motion.div>

            <div className="text-center mt-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create an Account
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Join VendorBridge to streamline your procurement workflow
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 pt-4">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 2-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                {/* First Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-slate-700"
                  >
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-slate-700"
                  >
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-slate-700"
                  >
                    Confirm Password <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Role (Select) — full width */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="role"
                    className="text-sm font-medium text-slate-700"
                  >
                    Role <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <Select
                      value={formData.role}
                      onValueChange={(value: string) => updateField('role', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        id="role"
                        className="w-full pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 rounded-md transition-colors duration-200 [&>span]:data-placeholder:text-slate-400"
                      >
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Vendor-specific fields (conditional) ───────────── */}
              {isVendor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Vendor Details
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="companyName"
                        className="text-sm font-medium text-slate-700"
                      >
                        Company Name <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="Acme Supplies Pvt Ltd"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                          className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                        />
                      </div>
                    </div>

                    {/* GST Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="gstNumber"
                        className="text-sm font-medium text-slate-700"
                      >
                        GST Number <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="gstNumber"
                          name="gstNumber"
                          type="text"
                          placeholder="27AABCS1429BZ0"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                          maxLength={15}
                          className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="category"
                        className="text-sm font-medium text-slate-700"
                      >
                        Category <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                        <Select
                          value={formData.category}
                          onValueChange={(value: string) => updateField('category', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            id="category"
                            className="w-full pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 rounded-md transition-colors duration-200 [&>span]:data-placeholder:text-slate-400"
                          >
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {VENDOR_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  'Register'
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-slate-400 mt-8">
              Already have an account?{' '}
              <Link
                to="/"
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
