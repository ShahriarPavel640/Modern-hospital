import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { adminAPI, publicAPI, Appointment, Doctor } from "../../lib/api";
import { 
  Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, 
  Search, Filter, ChevronDown, Check, XCircle, Trash2, ShieldAlert
} from "lucide-react";

export const Route = createFileRoute("/admin/appointments")({
  component: AdminAppointmentsPage,
});

function AdminAppointmentsPage() {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await adminAPI.deleteAppointment(token, deleteId);
      if (res.success) {
        setSuccess("Appointment record deleted successfully!");
        setDeleteId(null);
        fetchInitialData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to delete appointment");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete appointment");
    }
    setDeleting(false);
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState(""); // empty string = all dates

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      // Fetch appointments and doctors in parallel
      const [apptsRes, docsRes] = await Promise.all([
        adminAPI.getAppointments(token),
        publicAPI.getDoctors(), // public route is fine for listing doctors
      ]);

      if (apptsRes.success && apptsRes.data) {
        setAppointments(apptsRes.data);
      } else {
        setError(apptsRes.error || "Failed to load appointments");
      }

      if (docsRes.success && docsRes.data) {
        setDoctors(docsRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load appointment records");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: "PENDING" | "CONFIRMED" | "CANCELLED") => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await adminAPI.updateAppointmentStatus(token, id, newStatus);
      if (res.success) {
        setSuccess(`Appointment status set to ${newStatus}!`);
        fetchInitialData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to update appointment status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to modify status");
    }
  };

  // Filter & Search Logic
  const filteredAppointments = appointments.filter(app => {
    // Filter by Doctor
    const matchesDoctor = doctorFilter === "All" || app.doctorId === doctorFilter;
    
    // Filter by Date
    let matchesDate = true;
    if (dateFilter) {
      const appDateStr = new Date(app.appointmentDate).toISOString().split('T')[0];
      matchesDate = appDateStr === dateFilter;
    }

    // Search query matches name or phone
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      app.patientName.toLowerCase().includes(searchLower) ||
      app.patientPhone.includes(searchLower) ||
      (app.doctor?.name && app.doctor.name.toLowerCase().includes(searchLower));

    return matchesDoctor && matchesDate && matchesSearch;
  });

  // Sort: First by Date (descending), then by Serial number (ascending)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateDiff = new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.serialNumber - b.serialNumber;
  });

  const getStatusColor = (status: string) => {
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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
            Manage Appointments
          </h1>
          <p className="text-sm text-muted-foreground font-bn">
            অনলাইন সিরিয়াল ও অ্যাপয়েন্টমেন্ট স্ট্যাটাস ব্যবস্থাপনা
          </p>
        </div>
        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2 border border-brand/20 text-brand rounded-xl text-xs font-semibold hover:bg-brand/5 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl p-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-white border border-brand/10 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-brand-dark">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search Patient name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-brand/10 rounded-xl text-xs focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light/25 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Doctor Filter */}
        <div className="flex items-center gap-2 w-full">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full border border-brand/10 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
          >
            <option value="All">All Doctors</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border border-brand/10 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter("")}
              className="text-xs text-red-500 hover:underline px-1 shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-brand/10 shadow-sm animate-pulse space-y-4">
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      ) : sortedAppointments.length > 0 ? (
        <div className="bg-white border border-brand/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-dark text-white uppercase text-[10px] tracking-wider border-b border-brand/10">
                <tr>
                  <th className="px-6 py-4">Serial #</th>
                  <th className="px-6 py-4">Patient Name & Phone</th>
                  <th className="px-6 py-4">Doctor (Dept)</th>
                  <th className="px-6 py-4">Appointment Date</th>
                  <th className="px-6 py-4">Booking Status</th>
                  <th className="px-6 py-4 text-center">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5 text-brand-dark">
                {sortedAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-brand-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold font-mono text-brand">#{app.serialNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-brand-dark">{app.patientName}</div>
                      <div className="text-xs text-muted-foreground/80 font-medium mt-0.5">{app.patientPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-dark">{app.doctor?.name || "Specialist Consultant"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{app.doctor?.specialty}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-muted-foreground">
                      {new Date(app.appointmentDate).toLocaleDateString(undefined, {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          disabled={app.status === "CONFIRMED"}
                          onClick={() => handleStatusChange(app.id, "CONFIRMED")}
                          className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          title="Confirm Appointment"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button
                          disabled={app.status === "CANCELLED"}
                          onClick={() => handleStatusChange(app.id, "CANCELLED")}
                          className="px-2.5 py-1 bg-red-500/10 text-red-700 hover:bg-red-500/20 disabled:opacity-30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          title="Cancel Appointment"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button
                          onClick={() => setDeleteId(app.id)}
                          className="p-1.5 text-red-600 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-brand/10 rounded-2xl p-10 text-center text-muted-foreground">
          No booked appointments match the filter selections.
        </div>
      )}
      {/* Delete Confirmation Dialog Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 text-brand-dark space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Delete Appointment Record?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to permanently delete this appointment record? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-brand/10 rounded-xl text-xs font-bold hover:bg-brand-muted/30 transition text-brand"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
