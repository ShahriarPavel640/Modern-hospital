import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { publicAPI, MedicalTest } from "../lib/api";
import { 
  Search, Calendar, FileText, CheckCircle2, Clock, AlertCircle, 
  ArrowLeft, Microscope, RefreshCw
} from "lucide-react";
import logo from "../assets/modern-hospital-logo.png";

export const Route = createFileRoute("/test-status")({
  component: TestStatusPage,
});

function TestStatusPage() {
  const [testId, setTestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<MedicalTest | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId.trim()) return;

    setLoading(true);
    setError("");
    setTestResult(null);

    const res = await publicAPI.getTestStatus(testId.trim());

    if (res.success && res.data) {
      setTestResult(res.data);
    } else {
      setError(res.error || "Medical report not found. Please verify the ID.");
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "ready for delivery":
      case "ready":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-medical-grid opacity-10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-brand-light/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/10 py-4 relative z-10 bg-brand-dark/80 backdrop-blur">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
            <div>
              <div className="text-sm font-bold tracking-tight">Modern Hospital</div>
              <div className="text-[10px] text-white/60 font-bn">মডার্ন হসপিটাল</div>
            </div>
          </Link>
          <Link to="/" className="text-sm text-accent-gold hover:text-white flex items-center gap-1.5 transition font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center relative z-10 max-w-xl">
        <div className="w-full text-center mb-8">
          <Microscope className="w-12 h-12 text-accent-gold mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Check Medical Test Status
          </h1>
          <p className="font-bn text-sm text-white/75 mt-1">
            মেডিকেল টেস্ট রিপোর্ট অনুসন্ধান
          </p>
        </div>

        {/* Search Bar Card */}
        <div className="w-full bg-white rounded-2xl p-6 shadow-elegant text-brand-dark border border-white/10 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="testId" className="block text-xs font-bold text-brand-dark/70 tracking-wider uppercase mb-2">
                Report Invoice ID / টেস্ট আইডি
              </label>
              <div className="relative">
                <input
                  id="testId"
                  required
                  placeholder="Enter Invoice ID (e.g. LAB-1048)"
                  value={testId}
                  onChange={(e) => setTestId(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl pl-4 pr-12 py-3.5 text-sm text-brand-dark placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-gradient-brand text-white rounded-lg hover:scale-105 transition disabled:opacity-50"
                  aria-label="Search"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result Card */}
        {testResult && (
          <div className="w-full bg-white rounded-2xl p-6 shadow-elegant text-brand-dark border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-brand/5 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-widest">INVOICE ID</span>
                <h3 className="text-lg font-bold text-brand-dark font-mono">{testResult.id}</h3>
              </div>
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(testResult.status)}`}>
                {testResult.status}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-widest block">Patient Name</span>
                <span className="text-base font-bold text-brand-dark">{testResult.patientName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-widest block mb-2">Prescribed Tests / পরীক্ষা সমূহ</span>
                <div className="bg-brand-muted/30 rounded-xl p-3 border border-brand/5">
                  <ul className="space-y-2">
                    {testResult.testNames.map((test, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-sm font-medium text-brand-dark">
                        <FileText className="w-4 h-4 mt-0.5 text-brand shrink-0" />
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-brand/5 pt-4">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Updated: {new Date(testResult.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Modern Hospital Pvt. Limited. All rights reserved.
      </footer>
    </div>
  );
}
