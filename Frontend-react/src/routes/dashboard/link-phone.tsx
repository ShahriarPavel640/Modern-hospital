import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { patientAPI, MedicalTest, Appointment } from "../../lib/api";
import { 
  Phone, ShieldCheck, AlertCircle, CheckCircle, Clock, 
  FileText, Calendar, RefreshCw
} from "lucide-react";

export const Route = createFileRoute("/dashboard/link-phone")({
  component: LinkPhonePage,
});

function LinkPhonePage() {
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  
  const [phoneInput, setPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [loadingMatchedData, setLoadingMatchedData] = useState(false);
  const [matchedTests, setMatchedTests] = useState<MedicalTest[]>([]);
  const [matchedAppointments, setMatchedAppointments] = useState<Appointment[]>([]);
  const [dataError, setDataError] = useState("");

  const linkedPhone = user?.publicMetadata?.phone as string | undefined;

  // Fetch phone-matched data (tests and appointments)
  const fetchPhoneMatchedData = async (phone: string) => {
    setLoadingMatchedData(true);
    setDataError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      // Parallel fetch tests and appointments
      const [testsRes, apptsRes] = await Promise.all([
        patientAPI.getTestsByPhone(token, phone),
        patientAPI.getMyAppointments(token, phone),
      ]);

      if (testsRes.success && testsRes.data) {
        setMatchedTests(testsRes.data);
      }
      if (apptsRes.success && apptsRes.data) {
        setMatchedAppointments(apptsRes.data);
      }
    } catch (err: any) {
      setDataError(err.message || "Failed to load matching records");
    }
    setLoadingMatchedData(false);
  };

  useEffect(() => {
    if (linkedPhone) {
      fetchPhoneMatchedData(linkedPhone);
    }
  }, [linkedPhone]);

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
    <div className="space-y-8 max-w-4xl">
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
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-dark">Phone Link Active</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your account is linked to phone number: <strong className="text-brand-dark">{linkedPhone}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-bn">
                  আপনার অ্যাকাউন্টের সাথে এই নম্বরটি যুক্ত আছে।
                </p>
              </div>
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  Medical test results and booked serials at the hospital counter are often linked to your phone number. Linking your phone allows you to view those records here.
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
          </div>
        )}
      </div>

      {/* Linked Data Section */}
      {linkedPhone && (
        <div className="space-y-6">
          {/* Matched Reports */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand/10 pb-2">
              <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                <span>Reports Matched by Phone ({matchedTests.length})</span>
              </h2>
              {linkedPhone && (
                <button 
                  onClick={() => fetchPhoneMatchedData(linkedPhone)}
                  className="p-1.5 border border-brand/10 text-brand rounded-lg text-xs font-semibold hover:bg-brand/5 transition flex items-center gap-1.5 disabled:opacity-50"
                  disabled={loadingMatchedData}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMatchedData ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>

            {loadingMatchedData ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-brand/5 shadow-sm space-y-3 animate-pulse h-40" />
                ))}
              </div>
            ) : dataError ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl p-4 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{dataError}</span>
              </div>
            ) : matchedTests.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {matchedTests.map((test) => (
                  <div key={test.id} className="bg-white rounded-2xl p-5 border border-brand/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand group-hover:bg-accent-gold transition" />
                    <div className="flex items-center justify-between border-b border-brand/5 pb-3 mb-3 pl-1">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">INVOICE ID</span>
                        <h4 className="text-sm font-extrabold text-brand-dark font-mono mt-0.5">{test.id}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="space-y-2.5 pl-1 text-xs">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest block">Patient Name</span>
                        <span className="font-bold text-brand-dark">{test.patientName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Tests</span>
                        <div className="flex flex-wrap gap-1">
                          {test.testNames.map((n, idx) => (
                            <span key={idx} className="bg-brand-muted/40 px-2.5 py-1 rounded-md font-semibold text-brand-dark border border-brand/5">{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center border border-brand/10 text-xs text-muted-foreground">
                No reports found matching this phone number.
              </div>
            )}
          </div>

          {/* Matched Appointments */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2 border-b border-brand/10 pb-2">
              <Calendar className="w-5 h-5 text-brand" />
              <span>Appointments Matched by Phone ({matchedAppointments.length})</span>
            </h2>

            {loadingMatchedData ? (
              <div className="bg-white rounded-2xl p-6 border border-brand/5 shadow-sm space-y-3 animate-pulse h-32" />
            ) : matchedAppointments.length > 0 ? (
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
                      {matchedAppointments.map((app) => (
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
              <div className="bg-white rounded-2xl p-6 text-center border border-brand/10 text-xs text-muted-foreground">
                No appointments found matching this phone number.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
