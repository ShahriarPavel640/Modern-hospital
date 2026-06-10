import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { adminAPI, Doctor, Appointment, MedicalTest } from "../../lib/api";
import { 
  Users, ClipboardList, CalendarCheck, Clock, 
  AlertCircle, ChevronRight, Activity, TrendingUp
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState({
    doctorsCount: 0,
    testsCount: 0,
    appointmentsCount: 0,
    pendingAppointmentsCount: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentTests, setRecentTests] = useState<MedicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      // Fetch all three datasets in parallel
      const [docsRes, apptsRes, testsRes] = await Promise.all([
        adminAPI.getDoctors(token),
        adminAPI.getAppointments(token),
        adminAPI.getTests(token),
      ]);

      let docsCount = 0;
      let apptsCount = 0;
      let testsCount = 0;
      let pendingAppts = 0;

      if (docsRes.success && docsRes.data) {
        docsCount = docsRes.data.length;
      }
      if (apptsRes.success && apptsRes.data) {
        apptsCount = apptsRes.data.length;
        pendingAppts = apptsRes.data.filter(a => a.status === "PENDING").length;
        // Sort and get recent appointments
        const sortedAppts = [...apptsRes.data]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentAppointments(sortedAppts.slice(0, 5));
      }
      if (testsRes.success && testsRes.data) {
        testsCount = testsRes.data.length;
        // Sort and get recent tests
        const sortedTests = [...testsRes.data]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentTests(sortedTests.slice(0, 5));
      }

      setStats({
        doctorsCount: docsCount,
        testsCount: testsCount,
        appointmentsCount: apptsCount,
        pendingAppointmentsCount: pendingAppts,
      });

    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard metrics");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
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
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
          Admin Overview
        </h1>
        <p className="text-sm text-muted-foreground font-bn">
          মডার্ন হসপিটাল অ্যাডমিন ড্যাশবোর্ড
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: "Total Doctors", count: stats.doctorsCount, icon: Users, desc: "Registered in directory", color: "text-blue-600 bg-blue-100" },
          { name: "Lab Reports", count: stats.testsCount, icon: ClipboardList, desc: "Created test invoices", color: "text-emerald-600 bg-emerald-100" },
          { name: "Total Bookings", count: stats.appointmentsCount, icon: CalendarCheck, desc: "Online booked serials", color: "text-purple-600 bg-purple-100" },
          { name: "Pending Bookings", count: stats.pendingAppointmentsCount, icon: Clock, desc: "Awaiting confirmation", color: "text-amber-600 bg-amber-100" },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-brand/10 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">{card.name}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="text-3xl font-extrabold text-brand-dark font-bn">{card.count}</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-1.5">{card.desc}</span>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <div className="bg-white border border-brand/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand/5 pb-3">
            <h3 className="font-bold text-base text-brand-dark flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-brand" />
              <span>Recent Online Appointments</span>
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          ) : recentAppointments.length > 0 ? (
            <div className="divide-y divide-brand/5">
              {recentAppointments.map(app => (
                <div key={app.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-brand-dark">{app.patientName}</h4>
                    <p className="text-muted-foreground mt-0.5">Doctor: {app.doctor?.name || "Specialist"}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-brand text-sm block">#{app.serialNumber}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {new Date(app.appointmentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No bookings registered yet.</p>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-white border border-brand/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand/5 pb-3">
            <h3 className="font-bold text-base text-brand-dark flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand" />
              <span>Recent Lab Invoices</span>
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          ) : recentTests.length > 0 ? (
            <div className="divide-y divide-brand/5">
              {recentTests.map(test => (
                <div key={test.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-brand-dark font-mono">{test.id}</h4>
                    <p className="text-muted-foreground mt-0.5">Patient: {test.patientName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No reports registered yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
