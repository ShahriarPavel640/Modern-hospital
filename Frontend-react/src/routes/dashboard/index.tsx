import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { patientAPI, MedicalTest } from "../../lib/api";
import { 
  ClipboardList, Clock, RefreshCw, FileText, ChevronRight,
  AlertCircle, ShieldCheck
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMyTests = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");
      
      const res = await patientAPI.getMyTests(token);
      if (res.success && res.data) {
        setTests(res.data);
      } else {
        setError(res.error || "Failed to load reports");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch reports");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMyTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ready for delivery":
      case "ready":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
            Welcome back, {user?.firstName || "Patient"}!
          </h1>
          <p className="text-sm text-muted-foreground font-bn">
            মডার্ন হসপিটাল ডিজিটাল পেশেন্ট পোর্টাল
          </p>
        </div>
        <button
          onClick={loadMyTests}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2 border border-brand/20 text-brand rounded-xl text-xs font-semibold hover:bg-brand/5 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Reports
        </button>
      </div>

      {/* Linked Email Box */}
      <div className="bg-white border border-brand/10 rounded-2xl p-5 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-base text-brand-dark">Email Verification</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Searching for laboratory reports matching: <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-brand/5 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-28 bg-gray-200 rounded pt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Tests Grid */}
      {!loading && !error && (
        <>
          {tests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {tests.map((test) => (
                <div 
                  key={test.id} 
                  className="bg-white rounded-2xl p-6 border border-brand/10 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand group-hover:bg-accent-gold transition" />
                  
                  <div className="flex items-center justify-between border-b border-brand/5 pb-3 mb-3 pl-1">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">INVOICE ID</span>
                      <h3 className="text-base font-extrabold text-brand-dark font-mono mt-0.5">{test.id}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </div>

                  <div className="space-y-3.5 pl-1">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Patient Name</span>
                      <span className="text-sm font-bold text-brand-dark">{test.patientName}</span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Lab Tests</span>
                      <div className="bg-brand-muted/20 border border-brand/5 rounded-xl p-3 space-y-1.5">
                        {test.testNames.map((name, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs font-semibold text-brand-dark">
                            <FileText className="w-3.5 h-3.5 mt-0.5 text-brand shrink-0" />
                            <span>{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-2 border-t border-brand/5">
                      <Clock className="w-3.5 h-3.5 text-brand/60" />
                      <span>Last Updated: {new Date(test.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-brand/10 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-5">
              <div className="w-16 h-16 rounded-full bg-brand-muted/30 text-brand flex items-center justify-center mx-auto">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-brand-dark">No Lab Reports Linked Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We couldn't find any medical test results matching your account email (<strong>{user?.primaryEmailAddress?.emailAddress}</strong>).
                </p>
                <p className="text-xs text-muted-foreground font-bn">
                  আপনার ইমেইলের সাথে কোনো মেডিকেল রিপোর্ট পাওয়া যায়নি।
                </p>
              </div>
              <div className="pt-2 border-t border-brand/5 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link 
                  to="/dashboard/link-phone" 
                  className="px-5 py-2.5 bg-gradient-brand text-white text-xs font-semibold rounded-full shadow-md hover:scale-105 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Link Phone Number
                </Link>
                <Link 
                  to="/test-status" 
                  className="px-5 py-2.5 border border-brand/20 text-brand text-xs font-semibold rounded-full hover:bg-brand/5 transition"
                >
                  Search by Invoice ID
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
