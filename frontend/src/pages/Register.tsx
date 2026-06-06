import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  User,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  Building2,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Types ───────────────────────────────────────────────────────────

interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  country: string;
  additionalInfo: string;
}

interface SignupPayload {
  email: string;
  password: string;
  role: string;
  companyName: string;
  gstNumber: string;
  category: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface AuthErrorResponse {
  message?: string;
}

// ── Constants ───────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OFFICER', label: 'Officer' },
  { value: 'VENDOR', label: 'Vendor' },
] as const;

const INITIAL_FORM_STATE: RegisterFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  country: '',
  additionalInfo: '',
};

// ── Component ───────────────────────────────────────────────────────

export default function Register(): React.JSX.Element {
  const [formData, setFormData] = useState<RegisterFormState>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const updateField = (
    field: keyof RegisterFormState,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    updateField(name as keyof RegisterFormState, value);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Sync this payload with the final backend schema.
      // The backend currently expects: email, password, role, companyName, gstNumber, category.
      // The UI collects: firstName, lastName, email, phone, role, country, additionalInfo.
      // Missing fields (password, companyName, gstNumber, category) use placeholder values below.
      const payload: SignupPayload = {
        email: formData.email,
        password: 'PLACEHOLDER_NEEDS_PASSWORD_FIELD',
        role: formData.role,
        companyName: `${formData.firstName} ${formData.lastName}`,
        gstNumber: 'PLACEHOLDER_NEEDS_GST_FIELD',
        category: 'GENERAL',
      };

      const res: Response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData: AuthErrorResponse = await res.json();
        throw new Error(errorData.message || 'Registration failed. Please try again.');
      }

      const data: AuthResponse = await res.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // TODO: redirect to dashboard or onboarding
      // navigate('/dashboard');
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
                      required
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
                      required
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
                    Email Address
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

                {/* Role (Select) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-sm font-medium text-slate-700"
                  >
                    Role
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

                {/* Country */}
                <div className="space-y-2">
                  <Label
                    htmlFor="country"
                    className="text-sm font-medium text-slate-700"
                  >
                    Country
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      placeholder="India"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information (full-width) */}
              <div className="space-y-2">
                <Label
                  htmlFor="additionalInfo"
                  className="text-sm font-medium text-slate-700"
                >
                  Additional Information
                </Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  placeholder="Tell us about your organization, procurement needs, or any special requirements…"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  rows={4}
                  className="border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200 resize-none"
                />
              </div>

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
              <a
                href="#"
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                Sign in
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
