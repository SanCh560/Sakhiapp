import React, { useState } from 'react';
import {
  Shield, ShieldCheck, Sparkles, Mail, Lock, User, ArrowRight,
  CheckCircle2, AlertCircle, KeyRound, Globe, Compass, Plane,
  MapPin, Heart, Users, Star, RefreshCw, Loader2, Zap
} from 'lucide-react';
import { supabase } from '../db/supabaseClient';
import { syncUserToDatabase } from '../services/appServices';

export default function AuthScreen({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'check-email'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeCountry, setHomeCountry] = useState('United States');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const popularCountries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'India', 'Japan', 'Brazil', 'South Africa', 'Spain', 'Italy'
  ];

  // 1. LIVE SUPABASE SIGN IN
  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setErrorMessage('Your email has not been confirmed yet! Please check your inbox (and Spam/Junk folder) and click the verification link sent by Supabase.');
          setIsSubmitting(false);
          return;
        }

        setErrorMessage(error.message || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      if (data?.user) {
        const userObj = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0] || 'Traveller',
          email: data.user.email,
          homeCountry: data.user.user_metadata?.home_country || 'United States',
          isVerified: !!data.user.confirmed_at,
          joinedDate: new Date(data.user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
        await syncUserToDatabase(userObj);
        onAuthSuccess(userObj);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred connecting to Supabase Auth.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. LIVE SUPABASE SIGN UP & OTP DISPATCH
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !password.trim() || !homeCountry.trim()) {
      setErrorMessage('Please fill out all fields including your Home Country.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: name.trim(),
            home_country: homeCountry.trim()
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        if (error.message?.toLowerCase().includes('rate limit')) {
          setErrorMessage('Supabase email rate limit exceeded (free tier allows ~3 emails/hr). Please wait a few minutes, or disable "Confirm email" in Supabase Authentication -> Providers -> Email to test instantly without restrictions.');
        } else {
          setErrorMessage(error.message || 'Registration failed in Supabase Auth.');
        }
        setIsSubmitting(false);
        return;
      }

      // If Supabase project has email confirmations disabled or user was auto-confirmed
      if (data?.session && data?.user) {
        const userObj = {
          id: data.user.id,
          name: name.trim() || (email ? email.split('@')[0] : 'Traveller'),
          email: email.trim(),
          homeCountry: homeCountry.trim() || 'United States',
          isVerified: true,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
        await syncUserToDatabase(userObj);
        onAuthSuccess(userObj);
      } else {
        // Confirmation email dispatched by Supabase with verification link!
        if (data?.user) {
          const userObj = {
            id: data.user.id,
            name: name.trim() || (email ? email.split('@')[0] : 'Traveller'),
            email: email.trim(),
            homeCountry: homeCountry.trim() || 'United States',
            isVerified: false,
            joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          };
          await syncUserToDatabase(userObj);
        }
        setSuccessMessage(`A verification link has been sent to ${email}!`);
        setAuthMode('check-email');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit registration to Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. RESEND CONFIRMATION LINK VIA SUPABASE
  const handleResendCode = async () => {
    setErrorMessage('');
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        setErrorMessage(error.message || 'Could not resend verification email.');
      } else {
        setSuccessMessage(`A fresh verification link has been sent to ${email}! Check your spam/junk folder.`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not resend email.');
    } finally {
      setIsResending(false);
    }
  };

  // 5. DEMO SIGN-IN
  const handleDemoSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onAuthSuccess({
        id: 'usr-demo-sarah',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.com',
        homeCountry: 'United States',
        isVerified: true,
        joinedDate: 'Aug 2026'
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#120524] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Ambient background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg ring-1 ring-white/20">
            S
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5">
              <span>Sakhi</span>
              <Sparkles className="w-4 h-4 text-violet-300" />
            </h1>
            <span className="text-[11px] text-violet-300 font-semibold">AI Travel Companion for Solo Female Travellers</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-extrabold text-violet-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud Auth</span>
          </span>
        </div>
      </header>

      {/* Main Content: Split Desktop Layout */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 sm:py-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Left Column: Brand Story & Safety Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-xs font-black text-violet-200 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>Designed Exclusively for Solo Female Explorers</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Explore the world solo, <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                confidently & safely.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-violet-200/80 max-w-xl font-medium leading-relaxed">
              Sign in to unlock verified safe hotel corridors, daytime flight planners, offline vector maps, and 24/7 intelligent companion assistance. Your data stays strictly protected.
            </p>

            {/* Feature Value Props Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-violet-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>4D Safety Match Scoring</span>
                </div>
                <p className="text-[11px] text-violet-300/70">
                  AI-evaluated female dorms, 24/7 security reception, and well-lit neighborhood safety indices.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-violet-200">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>100% Offline Arrival Mode</span>
                </div>
                <p className="text-[11px] text-violet-300/70">
                  Vector maps, airport transit corridors, and audio flashcards accessible with zero mobile data.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-violet-200">
                  <Plane className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Daylight Flight Corridors</span>
                </div>
                <p className="text-[11px] text-violet-300/70">
                  Curated daytime flight arrival options landing before sunset for safe public transit navigation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-violet-200">
                  <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Emergency Speed-Dial & SOS</span>
                </div>
                <p className="text-[11px] text-violet-300/70">
                  Direct consular emergency numbers, transit SMS reporting, and offline translations.
                </p>
              </div>
            </div>

            {/* Social Proof Badge */}
            <div className="flex items-center gap-3 pt-2 text-xs text-violet-300">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-[#120524] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Traveller" />
                <img className="w-8 h-8 rounded-full border-2 border-[#120524] object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="Traveller" />
                <img className="w-8 h-8 rounded-full border-2 border-[#120524] object-cover" src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" alt="Traveller" />
              </div>
              <div>
                <span className="font-black text-white">50,000+</span> solo female journeys planned across 35+ destinations.
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated Authentication Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-slate-100 relative space-y-4">
              
              {/* Card Header & Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                      S
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">Sakhi Cloud Access</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Live Supabase Auth
                  </span>
                </div>

                {authMode !== 'check-email' && (
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
                      className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        authMode === 'signin'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                      className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        authMode === 'signup'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Banner */}
              {successMessage && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* 1. SIGN IN FORM */}
              {authMode === 'signin' && (
                <form onSubmit={handleSigninSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing In via Supabase...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Sakhi</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 2. SIGN UP FORM */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Home Country <span className="text-rose-600 font-extrabold">* (Mandatory)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={homeCountry}
                        onChange={(e) => setHomeCountry(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {popularCountries.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Globe className="w-4 h-4 text-violet-600 absolute left-3 top-3" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                      Used for emergency consular numbers & home currency conversion.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Supabase Confirmation...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account & Start Journey</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 3. EMAIL CONFIRMATION LINK NOTIFICATION SCREEN */}
              {authMode === 'check-email' && (
                <div className="space-y-4 pt-1 animate-fade-in text-slate-800">
                  <div className="text-center py-2 space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-md">
                      <Mail className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Check Your Email</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      A confirmation link has been sent by Supabase to:
                    </p>
                    <div className="inline-block px-3 py-1 bg-violet-50 border border-violet-200 rounded-xl text-xs font-black text-violet-900">
                      {email}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <span>Open the confirmation email sent to your inbox.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <span>Click the <strong>"Confirm your email"</strong> link inside.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <span>You will be automatically verified and logged into Sakhi!</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium leading-relaxed">
                    💡 <strong>Can't find the email?</strong> Please check your <strong>Spam or Junk</strong> folder.
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setErrorMessage(''); setSuccessMessage('Once confirmed in your email, enter your password to sign in!'); }}
                      className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I've Confirmed — Go to Sign In</span>
                    </button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                        className="font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                      >
                        Use Different Email
                      </button>

                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                        <span>{isResending ? 'Resending...' : 'Resend Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Demo Sign-In Separator */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-extrabold text-[10px] tracking-wider">or test immediately</span>
                </div>
              </div>

              {/* 1-Click Demo Sign-In Button */}
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-colors border border-slate-200/80 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Continue as Demo User (Sarah Jenkins)</span>
              </button>

            </div>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-violet-300/60 border-t border-white/5">
        <span>© 2026 Sakhi AI Travel Companion. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <span>Solo Female Travel Safety Standard</span>
          <span>•</span>
          <span>Zero Data Exposure Guaranteed</span>
        </div>
      </footer>

    </div>
  );
}
