'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { 
  User, 
  CreditCard, 
  Sun, 
  Moon, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

const supabase = createClient();

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'appearance'>('profile');
  
  // Theme state
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Subscriptions state
  const [plan, setPlan] = useState('free');
  const [subLoading, setSubLoading] = useState(false);

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Initial fetch user
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
        
        // Fetch profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }

        // Fetch subscriptions table
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (subscription) {
          setPlan(subscription.plan || 'free');
        }
      }
    };
    
    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Update metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userEmail,
          full_name: fullName,
          avatar_url: avatarUrl,
        });
      if (dbError) throw dbError;

      setSuccessMsg('Profile updated successfully.');
    } catch (error) {
      const err = error as Error;
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccessMsg('Password changed successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const err = error as Error;
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubscriptionAction = async () => {
    setSubLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (plan === 'free') {
        // Trigger Stripe Checkout Checkout Session
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, userId }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session.');
        }
      } else {
        // Trigger Customer Billing Portal
        const res = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to open billing portal.');
        }
      }
    } catch (error) {
      const err = error as Error;
      setErrorMsg(err.message || 'Stripe configuration error. Check your API environment credentials.');
    } finally {
      setSubLoading(false);
    }
  };

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 w-full space-y-6 md:space-y-8">
      
      <div className="flex justify-between items-center pb-6 border-b border-border">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">Account Settings</h1>
          <p className="text-xs md:text-sm text-text-muted font-light mt-1">Configure profile details, subscription pricing tiers, and custom UI parameters.</p>
        </div>
      </div>

      {/* Tabs - Horizontally scrollable on mobile */}
      <div className="flex overflow-x-auto whitespace-nowrap p-1.5 rounded-xl bg-card border border-border w-full md:w-fit max-w-full scrollbar-none">
        <button
          onClick={() => { setActiveTab('profile'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider transition shrink-0 ${
            activeTab === 'profile' 
              ? 'bg-card2 text-gold border border-border' 
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <User className="w-4 h-4" /> Profile & Security
        </button>
        <button
          onClick={() => { setActiveTab('subscription'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider transition shrink-0 ${
            activeTab === 'subscription' 
              ? 'bg-card2 text-gold border border-border' 
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Subscription Plan
        </button>
        <button
          onClick={() => { setActiveTab('appearance'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider transition shrink-0 ${
            activeTab === 'appearance' 
              ? 'bg-card2 text-gold border border-border' 
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Sun className="w-4 h-4" /> Visual Theme
        </button>
      </div>

      {/* Info Messages */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Panels */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-8">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-10">
            {/* Form Profile */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="font-heading text-lg md:text-xl font-bold border-b border-border/30 pb-3 text-text-primary">Edit Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={profileLoading}
                    className="w-full px-4 py-3 bg-card2 border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Avatar URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={profileLoading}
                    className="w-full px-4 py-3 bg-card2 border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full px-4 py-3 bg-card2/50 border border-border/50 text-sm text-text-muted rounded-xl cursor-not-allowed opacity-60"
                />
                <span className="text-[10px] text-text-muted block">To edit your registered email, contact customer support.</span>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full sm:w-auto btn-gold px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition"
              >
                {profileLoading ? 'Saving changes...' : 'Save Profile'}
              </button>
            </form>

            {/* Form Security */}
            <form onSubmit={handleChangePassword} className="space-y-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-gold" />
                <h3 className="font-heading text-lg md:text-xl font-bold text-text-primary">Change Password</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 bg-card2 border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 bg-card2 border border-border rounded-xl text-sm focus:outline-none focus:border-gold/50 transition placeholder-text-muted/60 text-text-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold uppercase tracking-wider border border-border rounded-xl bg-card2 hover:bg-border transition disabled:opacity-50 text-text-primary"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-8">
            <h3 className="font-heading text-lg md:text-xl font-bold border-b border-border/30 pb-3 text-text-primary">Manage Plan</h3>
            
            {/* Status card */}
            <div className="p-4 md:p-6 rounded-2xl bg-card2 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs text-text-muted uppercase tracking-wider font-mono">Current Subscription</div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold capitalize font-heading text-text-primary">{plan} Plan</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    plan === 'pro' 
                      ? 'bg-gold/10 text-gold border border-gold/20' 
                      : 'bg-card text-text-muted border border-border'
                  }`}>
                    {plan === 'pro' ? 'Premium Active' : 'Basic Member'}
                  </span>
                </div>
                <p className="text-xs text-text-muted font-light max-w-md">
                  {plan === 'pro' 
                    ? 'Thank you for supporting DataLens. You have unlimited file parses, full AI streaming chat, and public sharing permissions.'
                    : 'Upgrade to DataLens Pro for unlimited file uploads, custom charting (Scatter & Heatmaps), pdf export reports, and Groq streaming chat.'
                  }
                </p>
              </div>

              <button
                onClick={handleSubscriptionAction}
                disabled={subLoading}
                className={`w-full md:w-auto px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded-[10px] shrink-0 transition ${
                  plan === 'pro'
                    ? 'border border-border bg-card hover:bg-border text-text-primary'
                    : 'btn-gold shadow-lg shadow-gold/15'
                }`}
              >
                {subLoading ? 'Redirecting...' : (
                  plan === 'pro' ? 'Manage Billing' : 'Upgrade to Pro ($5/mo)'
                )}
              </button>
            </div>

            {/* Test Cards Information */}
            {plan === 'free' && (
              <div className="p-4 rounded-xl border border-gold/15 bg-gold/5 flex gap-3 text-xs text-gold-light leading-relaxed">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold uppercase tracking-wide mr-1 text-gold">Stripe Test Mode Enabled:</span>
                  You can test the upgrade transaction safely. Use the card number <code className="font-mono bg-gold/10 px-1 py-0.5 rounded text-text-primary font-bold">4242 4242 4242 4242</code> with any future expiry date and any CVC.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg md:text-xl font-bold border-b border-border/30 pb-3 text-text-primary">Visual Customisation</h3>
            
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Select App Theme</label>
              
              {!mounted ? (
                <div className="h-24 bg-card2/50 animate-pulse rounded-2xl max-w-md" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition ${
                      currentTheme === 'dark'
                        ? 'border-gold bg-card2 text-gold'
                        : 'border-border bg-card2/30 text-text-muted hover:text-text-primary hover:border-border/80'
                    }`}
                  >
                    <Moon className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Obsidian Dark</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Bloomberg luxury theme</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('light')}
                    className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition ${
                      currentTheme === 'light'
                        ? 'border-gold bg-card2 text-gold'
                        : 'border-border bg-card2/30 text-text-muted hover:text-text-primary hover:border-border/80'
                    }`}
                  >
                    <Sun className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Luxury Light</div>
                      <div className="text-[10px] opacity-75 mt-0.5">High-contrast clean style</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
