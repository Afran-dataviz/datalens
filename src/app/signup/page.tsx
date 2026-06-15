'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User,
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Sparkles,
  Database,
  CheckCircle
} from 'lucide-react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function SignupPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedPlan = searchParams.get('plan') || 'free';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Validations
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          plan: selectedPlan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.error || 'Failed to register account.');
      } else {
        // Sign in immediately since email verification is disabled
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          setErrorMsg('Account created, but automatic login failed: ' + signInError.message + '. Please log in manually.');
        } else {
          setSuccess(true);
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?plan=${selectedPlan}`,
        },
      });
      if (error) setErrorMsg(error.message);
    } catch {
      setErrorMsg('Could not initialize Google authentication.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex font-body">
      
      {/* Left Panel - Branding & Stats (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-card border-r border-border p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] bg-purple/5 rounded-full blur-[100px] pointer-events-none" />

        <Link href="/" className="font-heading text-2xl font-bold tracking-wide text-gold-light self-start">
          Data<span className="text-text-primary">Lens</span>
        </Link>

        <div className="my-auto space-y-12">
          <div className="space-y-6">
            <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
              Premium Data Analytics, <span className="text-gold-gradient font-heading">Refined</span>
            </h2>
            <p className="text-text-muted font-light leading-relaxed text-base">
              Create an account and test your spreadsheets today. Experience automated data structure recognition, automated column type configuration, and immediate charting.
            </p>
          </div>

          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card2/80 backdrop-blur max-w-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20">
                <Database className="w-5 h-5 text-gold-light" />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Browser Level Engine</div>
                <div className="text-sm font-semibold">Zero server file tracking</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card2/80 backdrop-blur max-w-sm ml-8"
            >
              <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center border border-purple/20">
                <Sparkles className="w-5 h-5 text-purple" />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Plan Selected</div>
                <div className="text-sm font-semibold capitalize">{selectedPlan} Member Access</div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="text-xs text-text-muted font-light">
          &copy; {new Date().getFullYear()} DataLens Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
        <div className="absolute inset-0 bg-gold/[0.01] pointer-events-none" />
        <Link href="/" className="lg:hidden absolute top-8 left-8 text-text-muted hover:text-gold-light flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="w-full max-w-md space-y-8">
          
          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto text-gold animate-bounce">
                <CheckCircle className="w-8 h-8 text-gold-light" />
              </div>
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-bold tracking-tight">Account Created</h1>
                <p className="text-sm text-text-muted font-light max-w-sm mx-auto leading-relaxed">
                  Your account has been created successfully. Redirecting you to the dashboard...
                </p>
              </div>
              <div className="pt-4">
                <Link href="/login" className="btn-gold px-8 py-3.5 text-xs font-bold uppercase tracking-wider inline-block">
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                  Create Account
                </h1>
                <p className="text-sm text-text-muted font-light">
                  Get started with DataLens today. Transform your tables into insights.
                </p>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Alexander Wright"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3 w-4 h-4 text-text-muted" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3 w-4 h-4 text-text-muted" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold py-4 text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-gold/10"
                >
                  {loading ? 'Creating Account...' : (
                    <>
                      Register Account <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-xs uppercase text-text-muted font-mono tracking-widest">or register with</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* OAuth Login */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full py-4 border border-border rounded-xl hover:bg-card2 text-sm font-semibold flex items-center justify-center gap-3 transition"
              >
                <GoogleIcon className="w-4 h-4" /> Google Workspace
              </button>

              <div className="text-center text-sm text-text-muted font-light">
                Already have an account?{' '}
                <Link href="/login" className="text-gold hover:text-gold-light transition font-semibold">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-text-muted">Verifying credentials gate...</p>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
