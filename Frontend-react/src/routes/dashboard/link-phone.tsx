import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { patientAPI } from "../../lib/api";
import { 
  Phone, ShieldCheck, AlertCircle, CheckCircle, ArrowLeft
} from "lucide-react";

export const Route = createFileRoute("/dashboard/link-phone")({
  component: LinkPhonePage,
});

function LinkPhonePage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [phoneInput, setPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const linkedPhone = user?.publicMetadata?.phone as string | undefined;

  const handleLinkPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await patientAPI.linkPhone(token, phoneInput.trim());
      if (res.success) {
        setSubmitSuccess(true);
        // Reload user metadata from Clerk server
        if (user) {
          await user.reload();
        }
      } else {
        setSubmitError(res.error || "Failed to link phone number");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process request");
    }
    setSubmitting(false);
  };

  const handleUnlinkPhone = async () => {
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await patientAPI.unlinkPhone(token);
      if (res.success) {
        setSubmitSuccess(true);
        // Reload user metadata from Clerk server
        if (user) {
          await user.reload();
        }
      } else {
        setSubmitError(res.error || "Failed to unlink phone number");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process request");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
          Link Phone Number
        </h1>
        <p className="text-sm text-muted-foreground font-bn">
          অ্যাকাউন্টের সাথে মোবাইল নম্বর সংযুক্ত করুন
        </p>
      </div>

      {/* Linking Status / Form Card */}
      <div className="bg-white border border-brand/10 rounded-2xl p-6 shadow-sm">
        {linkedPhone ? (
          /* Linked State */
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-brand-dark">Phone Link Active</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is linked to phone number: <strong className="text-brand-dark">{linkedPhone}</strong>
                </p>
                <p className="text-xs text-muted-foreground font-bn">
                  আপনার অ্যাকাউন্টের সাথে এই নম্বরটি যুক্ত আছে।
                </p>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl p-3 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Phone number successfully unlinked! Reloading data...</span>
              </div>
            )}

            <div className="pt-4 border-t border-brand/5 flex items-center gap-3">
              <Link 
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <button
                type="button"
                onClick={handleUnlinkPhone}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl transition disabled:opacity-50"
              >
                Unlink Phone Number
              </button>
            </div>
          </div>
        ) : (
          /* Form to link */
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-dark">Why Link a Phone?</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Medical test results and booked serials at the hospital counter are linked to your phone number. Linking your phone allows you to view those records on your dashboard.
                </p>
              </div>
            </div>

            <form onSubmit={handleLinkPhone} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                required
                type="tel"
                placeholder="Enter Phone Number (e.g. 01712345678)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-brand text-white font-semibold text-sm rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
              >
                {submitting ? "Linking..." : "Link Number"}
              </button>
            </form>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl p-3 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Phone number successfully linked! Reloading data...</span>
              </div>
            )}
            
            <div className="pt-4 border-t border-brand/5">
              <Link 
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-brand font-bold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
