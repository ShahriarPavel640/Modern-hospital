import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { adminAPI, MedicalTest } from "../../lib/api";
import { 
  Plus, Trash2, X, ClipboardList, Clock, 
  CheckCircle, AlertCircle, RefreshCw, Search, 
  Filter, PlusCircle, Check
} from "lucide-react";

export const Route = createFileRoute("/admin/tests")({
  component: AdminTestsPage,
});

function AdminTestsPage() {
  const { getToken } = useAuth();
  const [tests, setTests] = useState<MedicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [testNames, setTestNames] = useState<string[]>([]);
  const [currentTestInput, setCurrentTestInput] = useState("");
  const [status, setStatus] = useState("Processing");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");
      const res = await adminAPI.getTests(token);
      if (res.success && res.data) {
        setTests(res.data);
      } else {
        setError(res.error || "Failed to load test records");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch test records");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const openAddModal = () => {
    setInvoiceId("");
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setTestNames([]);
    setCurrentTestInput("");
    setStatus("Processing");
    setFormError("");
    setIsFormOpen(true);
  };

  const handleAddTestTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const cleanTag = currentTestInput.trim();
    if (cleanTag && !testNames.includes(cleanTag)) {
      setTestNames([...testNames, cleanTag]);
      setCurrentTestInput("");
    }
  };

  const handleRemoveTestTag = (tag: string) => {
    setTestNames(testNames.filter(t => t !== tag));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await adminAPI.updateTestStatus(token, id, newStatus);
      if (res.success) {
        setSuccess("Report status updated!");
        fetchTests();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to update status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to change status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate patient contact info
    if (!patientPhone.trim() && !patientEmail.trim()) {
      setFormError("At least one contact method (Phone or Email) must be provided");
      return;
    }

    if (testNames.length === 0) {
      setFormError("At least one lab test name must be added");
      return;
    }

    setFormSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await adminAPI.createTest(token, {
        id: invoiceId.trim(),
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || undefined,
        patientEmail: patientEmail.trim() || undefined,
        testNames,
        status,
      });

      if (res.success) {
        setSuccess("Lab report registered successfully!");
        setIsFormOpen(false);
        fetchTests();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setFormError(res.error || "Failed to create lab report");
      }
    } catch (err: any) {
      setFormError(err.message || "Something went wrong creating record");
    }
    setFormSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await adminAPI.deleteTest(token, deleteId);
      if (res.success) {
        setSuccess("Lab report record deleted!");
        setDeleteId(null);
        fetchTests();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to delete record");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete record");
    }
    setDeleting(false);
  };

  // Filter & Search Logic
  const filteredTests = tests.filter(test => {
    const matchesStatus = statusFilter === "All" || test.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      test.id.toLowerCase().includes(searchLower) ||
      test.patientName.toLowerCase().includes(searchLower) ||
      (test.patientPhone && test.patientPhone.includes(searchLower)) ||
      (test.patientEmail && test.patientEmail.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
            Manage Lab Invoices
          </h1>
          <p className="text-sm text-muted-foreground font-bn">
            ল্যাব রিপোর্ট ও ডেলিভারি স্ট্যাটাস ব্যবস্থাপনা
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTests}
            disabled={loading}
            className="px-3 py-2 border border-brand/20 text-brand rounded-xl text-xs font-semibold hover:bg-brand/5 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openAddModal}
            className="bg-gradient-brand text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Test Report
          </button>
        </div>
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

      {/* Filter Bar */}
      <div className="bg-white border border-brand/10 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center text-brand-dark">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search ID, Name, Phone, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-brand/10 rounded-xl text-xs focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light/25 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span className="text-xs font-semibold text-muted-foreground">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-brand/10 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Ready for Delivery">Ready for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Lab Reports Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-brand/10 shadow-sm animate-pulse space-y-4">
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      ) : filteredTests.length > 0 ? (
        <div className="bg-white border border-brand/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-dark text-white uppercase text-[10px] tracking-wider border-b border-brand/10">
                <tr>
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">Patient Information</th>
                  <th className="px-6 py-4">Tests Ordered</th>
                  <th className="px-6 py-4">Delivery Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5 text-brand-dark">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-brand-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-extrabold font-mono text-brand text-sm">{test.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-brand-dark">{test.patientName}</div>
                      <div className="text-[10px] text-muted-foreground/80 mt-1 space-y-0.5">
                        {test.patientPhone && <div>Phone: {test.patientPhone}</div>}
                        {test.patientEmail && <div>Email: {test.patientEmail}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {test.testNames.map((name, idx) => (
                          <span key={idx} className="bg-brand-muted/30 border border-brand/5 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={test.status}
                        onChange={(e) => handleStatusChange(test.id, e.target.value)}
                        className={`px-2 py-1 rounded-full border text-[10px] font-bold focus:outline-none ${getStatusColor(test.status)}`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Ready for Delivery">Ready for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteId(test.id)}
                        className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-brand/10 rounded-2xl p-10 text-center text-muted-foreground">
          No medical reports match the filters.
        </div>
      )}

      {/* Add Report Overlay Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-brand-dark flex flex-col my-8">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-2 text-brand-dark/40 hover:text-brand-dark hover:bg-brand-muted/30 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-brand/5">
              <h3 className="font-extrabold text-lg">Create Lab Invoice Report</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Invoice ID */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Report Invoice ID * (Matches paper slip)
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. LAB-1048"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark font-mono uppercase"
                />
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Patient Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Robin Hood"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Patient Phone */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Patient Mobile Number (Highly recommended)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 01700112233"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Patient Email */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Patient Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. patient@example.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Add Test Tags */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Add Lab Tests * (Click Plus to insert)
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Lipid Profile, CBC, ECG"
                    value={currentTestInput}
                    onChange={(e) => setCurrentTestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTestTag(e);
                    }}
                    className="flex-1 border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                  />
                  <button
                    type="button"
                    onClick={handleAddTestTag}
                    className="p-2.5 bg-brand text-white rounded-xl hover:scale-105 active:scale-95 transition"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Displayed tags */}
                {testNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 bg-brand-muted/20 border border-brand/5 p-3 rounded-xl">
                    {testNames.map((tag) => (
                      <span
                        key={tag}
                        className="bg-brand text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTestTag(tag)}
                          className="hover:bg-white/20 p-0.5 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                >
                  <option value="Processing">Processing</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-brand/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 border border-brand/10 rounded-xl text-xs font-bold text-brand hover:bg-brand-muted/30 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-gradient-brand text-white font-bold rounded-xl text-xs shadow hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {formSubmitting ? "Creating..." : "Register Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 text-brand-dark space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Delete Report Record?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete this lab report from the system? Patients will no longer be able to look up this invoice.
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
                {deleting ? "Deleting..." : "Delete Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
