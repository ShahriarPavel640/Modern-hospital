import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { patientAPI, MedicalTest, Appointment } from "../../lib/api";
import { 
  ClipboardList, Clock, RefreshCw, FileText, ChevronRight,
  AlertCircle, ShieldCheck, Calendar, Phone
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const linkedPhone = user?.publicMetadata?.phone as string | undefined;

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");
      
      // Fetch email tests, phone tests (if linked), and appointments (if linked) in parallel
      const fetchPromises: Promise<any>[] = [
        patientAPI.getMyTests(token)
      ];
      
      if (linkedPhone) {
        fetchPromises.push(patientAPI.getTestsByPhone(token, linkedPhone));
        fetchPromises.push(patientAPI.getMyAppointments(token, linkedPhone));
      }
      
      const results = await Promise.all(fetchPromises);
      
      const emailRes = results[0];
      let phoneRes = null;
      let apptsRes = null;
      
      if (linkedPhone) {
        phoneRes = results[1];
        apptsRes = results[2];
      }
      
      // Process email tests
      let allTests: MedicalTest[] = [];
      if (emailRes.success && emailRes.data) {
        allTests = [...emailRes.data];
      } else if (!emailRes.success) {
        setError(emailRes.error || "Failed to load email-matched reports");
      }
      
      // Process phone tests
      if (phoneRes) {
        if (phoneRes.success && phoneRes.data) {
          allTests = [...allTests, ...phoneRes.data];
        } else if (!phoneRes.success) {
          console.error("Phone tests error:", phoneRes.error);
        }
      }
      
      // Deduplicate by test.id
      const uniqueTestsMap = new Map<string, MedicalTest>();
      allTests.forEach(t => {
        if (t && t.id) {
          uniqueTestsMap.set(t.id, t);
        }
      });
      const deduplicatedTests = Array.from(uniqueTestsMap.values());
      
      // Sort by updatedAt descending
      deduplicatedTests.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTests(deduplicatedTests);
      
      // Process appointments
      if (apptsRes) {
        if (apptsRes.success && apptsRes.data) {
          setAppointments(apptsRes.data);
        } else if (!apptsRes.success) {
          console.error("Appointments error:", apptsRes.error);
        }
      } else {
        setAppointments([]);
      }
      
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

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

  const getAppointmentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
            Welcome back, {user?.firstName || "Patient"}!
          </h1>
          <p className="text-sm text-muted-foreground font-bn">
            মডার্ন হসপিটালের ডিজিটাল পেশেন্ট পোর্টাল
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2 border border-brand/20 text-brand rounded-xl text-xs font-semibold hover:bg-brand/5 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
        </button>
      </div>

      {/* Verification Status Banner / Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Email Verification Info */}
        <div className="bg-white border border-brand/10 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-brand-dark">Email Verification</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Matching reports for: <strong className="text-brand-dark">{user?.primaryEmailAddress?.emailAddress}</strong>
            </p>
          </div>
        </div>

        {/* Phone Link Status Info */}
        {linkedPhone ? (
          <div className="bg-white border border-emerald-500/10 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-brand-dark">Linked Phone Number</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Matching records for: <strong className="text-brand-dark">{linkedPhone}</strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-sm text-brand-dark">No Phone Linked</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Link your phone to view matching appointments and counter-registered reports.
              </p>
              <Link 
                to="/dashboard/link-phone" 
                className="inline-flex items-center gap-1 text-xs text-brand font-bold mt-2 hover:underline"
              >
                Link Phone Now <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
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
        </div>
      )}

      {/* Error Message */}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Dashboard Sections */}
      {!loading && !error && (
        <div className="space-y-10">
          {/* Lab Reports Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2 border-b border-brand/10 pb-2">
              <ClipboardList className="w-5 h-5 text-brand" />
              <span>Medical Lab Reports / ল্যাব টেস্ট রিপোর্ট ({tests.length})</span>
            </h2>
            
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

                      {test.patientPhone && (
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Phone Number</span>
                          <span className="text-xs font-semibold text-brand-dark">{test.patientPhone}</span>
                        </div>
                      )}

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
              <div className="bg-white border border-brand/10 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-muted/30 text-brand flex items-center justify-center mx-auto">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-brand-dark">No Lab Reports Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    We couldn't find any medical test results matching your email or linked phone number.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Doctor Appointments Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2 border-b border-brand/10 pb-2">
              <Calendar className="w-5 h-5 text-brand" />
              <span>Doctor Appointments / ডাক্তার অ্যাপয়েন্টমেন্ট ({appointments.length})</span>
            </h2>

            {!linkedPhone ? (
              <div className="bg-white border border-brand/10 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-brand-dark">Link Phone to View Appointments</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    To view appointments booked online or at the hospital counter, you must link your phone number first.
                  </p>
                  <Link 
                    to="/dashboard/link-phone" 
                    className="inline-block px-5 py-2 bg-brand text-white text-xs font-semibold rounded-xl shadow hover:bg-brand-dark transition mt-1"
                  >
                    Link Phone Number
                  </Link>
                </div>
              </div>
            ) : appointments.length > 0 ? (
              <div className="bg-white rounded-2xl overflow-hidden border border-brand/10 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-dark text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Serial</th>
                        <th className="px-6 py-3.5">Doctor</th>
                        <th className="px-6 py-3.5">Appointment Date</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand/10">
                      {appointments.map((app) => (
                        <tr key={app.id} className="hover:bg-brand-muted/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-brand font-mono text-sm">
                            #{app.serialNumber}
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            {app.doctor?.name || "Specialist Consultant"}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {new Date(app.appointmentDate).toLocaleDateString(undefined, {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full border font-bold uppercase text-[9px] ${getAppointmentStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-brand/10 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-muted/30 text-brand flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-brand-dark">No Appointments Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    No doctor appointments match your linked phone number.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
