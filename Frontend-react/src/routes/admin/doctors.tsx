import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import { adminAPI, Doctor } from "../../lib/api";
import { 
  Plus, Edit, Trash2, ShieldAlert, X, Clock, Upload, 
  CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";

export const Route = createFileRoute("/admin/doctors")({
  component: AdminDoctorsPage,
});

function AdminDoctorsPage() {
  const { getToken } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Form Field States
  const [name, setName] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [degrees, setDegrees] = useState("");
  const [visitingHours, setVisitingHours] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");
      const res = await adminAPI.getDoctors(token);
      if (res.success && res.data) {
        setDoctors(res.data);
      } else {
        setError(res.error || "Failed to load doctors");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch doctors");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openAddModal = () => {
    setFormType("add");
    setSelectedDoctor(null);
    setName("");
    setNameBn("");
    setSpecialty("");
    setDegrees("");
    setVisitingHours("");
    setIsAvailable(true);
    setImageFile(null);
    setImagePreview(null);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditModal = (doc: Doctor) => {
    setFormType("edit");
    setSelectedDoctor(doc);
    setName(doc.name);
    setNameBn(doc.nameBn || "");
    setSpecialty(doc.specialty);
    setDegrees(doc.degrees?.join(", ") || "");
    setVisitingHours(doc.visitingHours);
    setIsAvailable(doc.isAvailable);
    setImageFile(null);
    setImagePreview(doc.imageUrl || null);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError("File size exceeds 5MB limit");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("nameBn", nameBn.trim());
      formData.append("specialty", specialty.trim());
      formData.append("degrees", degrees.trim());
      formData.append("visitingHours", visitingHours.trim());
      formData.append("isAvailable", String(isAvailable));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let res;
      if (formType === "add") {
        res = await adminAPI.createDoctor(token, formData);
      } else {
        if (!selectedDoctor) return;
        res = await adminAPI.updateDoctor(token, selectedDoctor.id, formData);
      }

      if (res.success) {
        setSuccess(formType === "add" ? "Doctor added successfully!" : "Doctor profile updated!");
        setIsFormOpen(false);
        fetchDoctors();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setFormError(res.error || "Failed to save doctor");
      }
    } catch (err: any) {
      setFormError(err.message || "Something went wrong saving");
    }
    setFormSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authorization token");

      const res = await adminAPI.deleteDoctor(token, deleteId);
      if (res.success) {
        setSuccess("Doctor deleted successfully!");
        setDeleteId(null);
        fetchDoctors();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to delete doctor (check constraints)");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete doctor");
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
            Manage Doctors
          </h1>
          <p className="text-sm text-muted-foreground font-bn">
            চিকিৎসক তালিকা ও প্রোফাইল ব্যবস্থাপনা
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDoctors}
            disabled={loading}
            className="px-3 py-2 border border-brand/20 text-brand rounded-xl text-xs font-semibold hover:bg-brand/5 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openAddModal}
            className="bg-gradient-brand text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Doctor
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

      {/* Main Table view */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-brand/10 shadow-sm animate-pulse space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      ) : doctors.length > 0 ? (
        <div className="bg-white border border-brand/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-dark text-white uppercase text-[10px] tracking-wider border-b border-brand/10">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Name (EN / BN)</th>
                  <th className="px-6 py-4">Specialty & Degrees</th>
                  <th className="px-6 py-4">Visiting Hours</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5 text-brand-dark">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-brand-muted/10 transition-colors">
                    <td className="px-6 py-3">
                      <img
                        src={doc.imageUrl}
                        alt={doc.name}
                        className="w-10 h-10 rounded-full object-cover border border-brand/15 bg-brand-muted/20 shadow-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-bold text-sm text-brand-dark">{doc.name}</div>
                      {doc.nameBn && <div className="text-[10px] text-muted-foreground font-bn mt-0.5">{doc.nameBn}</div>}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-bold text-brand block">{doc.specialty}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{doc.degrees?.join(", ")}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-muted-foreground">{doc.visitingHours}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${doc.isAvailable ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                        {doc.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-2 text-brand hover:bg-brand/10 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete Doctor"
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
          No doctor profiles created yet.
        </div>
      )}

      {/* Doctor Add/Edit Form Overlay Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-brand-dark flex flex-col my-8">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-2 text-brand-dark/40 hover:text-brand-dark hover:bg-brand-muted/30 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 border-b border-brand/5">
              <h3 className="font-extrabold text-lg">
                {formType === "add" ? "Register New Doctor" : "Edit Doctor Profile"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Doctor Name (English) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dr. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Name BN */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Doctor Name (Bangla)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ডাঃ জন ডো"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Specialty Department *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cardiology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Degrees */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Degrees (Comma-separated) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. MBBS, MD, FCPS"
                  value={degrees}
                  onChange={(e) => setDegrees(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Visiting Hours */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Visiting Hours Schedule *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sat–Thu: 5:00 PM – 9:00 PM"
                  value={visitingHours}
                  onChange={(e) => setVisitingHours(e.target.value)}
                  className="w-full border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-brand-dark"
                />
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3 bg-brand-muted/20 border border-brand/5 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="avail"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand-light border-brand/20"
                />
                <label htmlFor="avail" className="text-xs font-bold text-brand-dark cursor-pointer select-none">
                  Available for bookings / চেম্বারে রোগী দেখছেন
                </label>
              </div>

              {/* Profile Image upload */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 uppercase tracking-wide mb-1.5">
                  Profile Image {formType === "add" ? "(Optional)" : "(Select new to replace)"}
                </label>
                
                <div className="flex gap-4 items-center">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border border-brand/10 shadow"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border border-brand/20 hover:bg-brand/5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-brand"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  {formSubmitting ? "Saving..." : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
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
              <h3 className="font-extrabold text-base">Remove Doctor?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete this doctor profile? This action will fail if the doctor has booked appointments.
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
                {deleting ? "Deleting..." : "Delete Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
