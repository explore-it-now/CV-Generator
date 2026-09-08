import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, Lock, ShieldCheck, Zap, Sparkles, CreditCard, 
  ArrowRight, UserCheck, AlertCircle, Loader2 
} from "lucide-react";

export interface UserAccess {
  isPaid: boolean;
  plan: "single" | "monthly";
  email: string;
  creditsRemaining?: number;
  unlockedAt: string;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (access: UserAccess) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"single" | "monthly">("single");
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "signup">("guest");
  
  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  
  // Status states
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    }
    return v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const fillDemoCard = () => {
    setEmail("alex.morgan@demo.com");
    setName("Alex Morgan");
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12/28");
    setCardCvc("888");
    if (checkoutMode === "signup") {
      setPassword("demoPass123");
    }
    setError(null);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEmail = showSignIn ? signInEmail : email;
    if (!targetEmail || !targetEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (showSignIn) {
      // Handle sign in verification
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        const access: UserAccess = {
          isPaid: true,
          plan: "monthly",
          email: targetEmail,
          creditsRemaining: 30,
          unlockedAt: new Date().toISOString()
        };
        setIsSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(access);
        }, 1200);
      }, 1000);
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (checkoutMode === "signup" && (!password || password.length < 6)) {
      setError("Please enter a password with at least 6 characters.");
      return;
    }

    if (cardNumber.replace(/\s/g, "").length < 15) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }

    if (!cardExpiry.includes("/") || cardExpiry.length < 5) {
      setError("Please enter a valid expiry date (MM/YY).");
      return;
    }

    if (cardCvc.length < 3) {
      setError("Please enter a valid 3 or 4-digit CVC code.");
      return;
    }

    setIsProcessing(true);

    // Simulate secure payment gateway verification
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      const access: UserAccess = {
        isPaid: true,
        plan: selectedPlan,
        email: email.trim(),
        creditsRemaining: selectedPlan === "monthly" ? 30 : 1,
        unlockedAt: new Date().toISOString()
      };

      setTimeout(() => {
        onPaymentSuccess(access);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between relative bg-gradient-to-b from-blue-50/60 to-transparent dark:from-blue-950/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 mt-0.5">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" /> Download Locked
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Unlock Your Tailored CV
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Get full access to your ATS-optimized CV in PDF, Word (.docx), and plain text.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Plan Selection Cards */}
          {!showSignIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Single Generation */}
              <div
                onClick={() => setSelectedPlan("single")}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlan === "single"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-600/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Single Pass
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPlan === "single"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedPlan === "single" && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">$3.99</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">one-time</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Pay once for this generation. Best if you just need this CV right now.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>1 CV Generation</strong> & instant download</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>All formats: <strong>PDF, Word (.docx) & TXT</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>Guest checkout</strong> — no sign up needed</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Monthly Pro */}
              <div
                onClick={() => setSelectedPlan("monthly")}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlan === "monthly"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-600/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Best Value
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> Monthly Pro
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPlan === "monthly"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedPlan === "monthly" && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">$9.99</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Continuous access for active job hunters applying to different roles.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>30 Generations</strong> per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>Unlimited PDF & Word exports</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>All designer templates & cover letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Cancel anytime in 1-click</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guest vs Sign Up Toggle */}
          {!showSignIn ? (
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCheckoutMode("guest")}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  checkoutMode === "guest"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Pay as Guest (No Sign Up)
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMode("signup")}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  checkoutMode === "signup"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Create Account & Sign Up
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
              <span>Sign in to restore your existing subscription or pass</span>
              <button
                onClick={() => setShowSignIn(false)}
                className="font-bold underline hover:no-underline ml-2"
              >
                Switch to checkout
              </button>
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handlePay} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showSignIn ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Email Address {checkoutMode === "guest" && <span className="font-normal text-slate-400">(for download link)</span>}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name on Card"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {checkoutMode === "signup" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Create Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Card details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" /> Payment Information
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fillDemoCard}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60 flex items-center gap-1 transition-all"
                        title="Autofill test card credentials for demo"
                      >
                        <Sparkles className="w-3 h-3 text-blue-500" /> Demo Card
                      </button>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono hidden sm:flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> ENCRYPTED
                      </span>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="Card Number: 4242 •••• •••• 4242"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM / YY"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                      placeholder="CVC / CVV"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing || isSuccess}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing secure payment...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Payment Confirmed! Unlocking download...</span>
                </>
              ) : showSignIn ? (
                <>
                  <span>Sign In & Restore Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    Pay {selectedPlan === "single" ? "$3.99" : "$9.99/mo"} & Unlock Download
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer & Restore Link */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              100% Satisfaction or full refund
            </span>
            <button
              type="button"
              onClick={() => setShowSignIn(!showSignIn)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showSignIn ? "Back to new order" : "Already paid? Restore access"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
