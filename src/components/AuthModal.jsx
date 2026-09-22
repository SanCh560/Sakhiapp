import React, { useState } from 'react';
import { X, Mail, Lock, User, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, AlertCircle, KeyRound, Globe } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin' | 'verify-otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeCountry, setHomeCountry] = useState('United States'); // Mandatory field
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const popularCountries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'India', 'Japan', 'Brazil', 'South Africa', 'Spain', 'Italy'
  ];

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
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
    setTimeout(() => {
      setIsSubmitting(false);
      // Advance to Email OTP Verification Step
      setAuthMode('verify-otp');
    }, 600);
  };

  const handleSigninSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const user = {
        name: name.trim() || email.split('@')[0] || 'Sarah Jenkins',
        email: email.trim(),
        homeCountry: homeCountry.trim() || 'United States',
        isVerified: true,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      onAuthSuccess(user);
    }, 600);
  };

  const handleOtpChange = (index, val) => {
    if (val.length > 1) val = val[0];
    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredCode = otpCode.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const user = {
        name: name.trim() || 'Sarah Jenkins',
        email: email.trim(),
        homeCountry: homeCountry.trim() || 'United States',
        isVerified: true,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      onAuthSuccess(user);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-xl shadow-xs">
            A
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {authMode === 'verify-otp'
                ? 'Verify Your Email'
                : authMode === 'signup'
                ? 'Create Your Sakhi Account'
                : 'Welcome Back! Sign In'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {authMode === 'verify-otp'
                ? `Enter the 6-digit code sent to ${email}`
                : authMode === 'signup'
                ? 'Join 50,000+ solo female travellers exploring safely'
                : 'Sign in to access your offline trips & preferences'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SIGN UP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
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
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                >
                  {popularCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Globe className="w-4 h-4 text-violet-600 absolute left-3 top-3" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Used to calculate home currency conversions & emergency consular contacts</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Sending Verification Code...' : 'Create Account & Verify Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500 font-medium">Already have an account? </span>
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMessage(''); }}
                className="text-xs font-extrabold text-violet-600 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: EMAIL OTP VERIFICATION FORM */}
        {authMode === 'verify-otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-200 text-violet-950 text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-violet-900">
                <KeyRound className="w-4 h-4 text-violet-600" />
                Email Verification Code Sent
              </div>
              <p>We emailed a 6-digit confirmation code to <strong>{email}</strong>. Please enter it below to activate your account.</p>
            </div>

            <div className="flex justify-between gap-2">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-11 h-12 text-center font-black text-lg text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying Account...' : 'Complete Registration & Sign In'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                Back to Sign Up
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SIGN IN FORM */}
        {authMode === 'signin' && (
          <form onSubmit={handleSigninSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
                  placeholder="Your password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:border-violet-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In to Sakhi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500 font-medium">Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMessage(''); }}
                className="text-xs font-extrabold text-violet-600 hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
