import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { authForgotPassword } from '@/lib/api';

// ── Component ───────────────────────────────────────────────────────

export default function Login(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Forgot password state
  const [showForgot, setShowForgot] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotSent, setForgotSent] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string>('');

  const { login } = useAuth();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
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

  const handleForgotSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      await authForgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send reset link.';
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border border-slate-200 shadow-lg bg-white rounded-lg">
          <CardHeader className="flex flex-col items-center gap-3 pt-10 pb-2">
            {/* Company logo / avatar */}
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
                VendorBridge
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {showForgot
                  ? 'Reset your password'
                  : 'Sign in to your procurement dashboard'}
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 pt-4">
            {/* ── Forgot Password Form ──────────────────────────────── */}
            {showForgot ? (
              <>
                {forgotSent ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3 py-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <p className="text-sm text-slate-600 text-center">
                      If that email exists, a reset link has been sent.
                      Check your inbox.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForgot(false);
                        setForgotSent(false);
                        setForgotEmail('');
                      }}
                      className="mt-2 text-sm cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Sign In
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {forgotError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 font-medium"
                      >
                        {forgotError}
                      </motion.div>
                    )}

                    <form onSubmit={handleForgotSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label
                          htmlFor="forgotEmail"
                          className="text-sm font-medium text-slate-700"
                        >
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="forgotEmail"
                            type="email"
                            placeholder="you@company.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                            disabled={forgotLoading}
                            className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending…
                          </span>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                    </form>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(false);
                        setForgotError('');
                      }}
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-4 mx-auto cursor-pointer transition-colors duration-200"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </button>
                  </>
                )}
              </>
            ) : (
              /* ── Login Form ─────────────────────────────────────────── */
              <>
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
                  {/* Email Field */}
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
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={handleEmailChange}
                        required
                        disabled={isLoading}
                        className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700"
                      >
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        disabled={isLoading}
                        className="pl-10 h-11 border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-md transition-colors duration-200"
                      />
                    </div>
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
                        Signing in…
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Register link */}
                <p className="text-center text-sm text-slate-500 mt-6">
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/register"
                    className="text-emerald-600 font-medium hover:underline transition-colors duration-200"
                    to="/forgot-password"
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    Register
                  </Link>
                </p>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-4">
                  VendorBridge ERP &middot; Procurement Management System
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
