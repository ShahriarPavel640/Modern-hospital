const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper for authorized headers
function authHeaders(token: string, isJson = true) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

// Global API response format
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Data models matching the Prisma schema
export interface Doctor {
  id: string;
  name: string;
  nameBn?: string;
  specialty: string;
  degrees: string[];
  visitingHours: string;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctor?: Doctor;
  appointmentDate: string;
  serialNumber: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
}

export interface MedicalTest {
  id: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  testNames: string[];
  status: string; // Processing, Ready for Delivery, Delivered
  createdAt: string;
  updatedAt: string;
}

export const publicAPI = {
  async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    try {
      const res = await fetch(`${API_URL}/api/public/doctors`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch doctors" };
    }
  },

  async bookSerial(data: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    appointmentDate: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const res = await fetch(`${API_URL}/api/public/serials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to book appointment" };
    }
  },

  async getTestStatus(testId: string): Promise<ApiResponse<MedicalTest>> {
    try {
      const res = await fetch(`${API_URL}/api/public/tests/${testId}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch test status" };
    }
  },
};

export const patientAPI = {
  async getMyTests(token: string): Promise<ApiResponse<MedicalTest[]>> {
    try {
      const res = await fetch(`${API_URL}/api/patient/my-tests`, {
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch email-matched tests" };
    }
  },

  async linkPhone(token: string, phone: string): Promise<ApiResponse<{ phone: string }>> {
    try {
      const res = await fetch(`${API_URL}/api/patient/link-phone`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ phone }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to link phone" };
    }
  },

  async unlinkPhone(token: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const res = await fetch(`${API_URL}/api/patient/unlink-phone`, {
        method: "POST",
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to unlink phone" };
    }
  },

  async getTestsByPhone(token: string, phone: string): Promise<ApiResponse<MedicalTest[]>> {
    try {
      const res = await fetch(
        `${API_URL}/api/patient/tests-by-phone?phone=${encodeURIComponent(phone)}`,
        {
          headers: authHeaders(token),
        }
      );
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch phone-matched tests" };
    }
  },

  async getMyAppointments(token: string, phone: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const res = await fetch(
        `${API_URL}/api/patient/my-appointments?phone=${encodeURIComponent(phone)}`,
        {
          headers: authHeaders(token),
        }
      );
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch appointments" };
    }
  },
};

export const adminAPI = {
  async getDoctors(token: string): Promise<ApiResponse<Doctor[]>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/doctors`, {
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch admin doctors list" };
    }
  },

  async createDoctor(token: string, formData: FormData): Promise<ApiResponse<Doctor>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/doctors`, {
        method: "POST",
        headers: authHeaders(token, false), // multipart/form-data sets its own boundary
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create doctor" };
    }
  },

  async updateDoctor(
    token: string,
    id: string,
    formData: FormData
  ): Promise<ApiResponse<Doctor>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/doctors/${id}`, {
        method: "PUT",
        headers: authHeaders(token, false),
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update doctor" };
    }
  },

  async deleteDoctor(token: string, id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/doctors/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete doctor" };
    }
  },

  async getTests(token: string): Promise<ApiResponse<MedicalTest[]>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/tests`, {
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch medical tests" };
    }
  },

  async createTest(
    token: string,
    data: {
      id: string;
      patientName: string;
      patientPhone?: string;
      patientEmail?: string;
      testNames: string[];
      status: string;
    }
  ): Promise<ApiResponse<MedicalTest>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/tests`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create test record" };
    }
  },

  async updateTestStatus(
    token: string,
    id: string,
    status: string
  ): Promise<ApiResponse<MedicalTest>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/tests/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update test status" };
    }
  },

  async deleteTest(token: string, id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/tests/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete test record" };
    }
  },

  async getAppointments(token: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/appointments`, {
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch appointments list" };
    }
  },

  async updateAppointmentStatus(
    token: string,
    id: string,
    status: "PENDING" | "CONFIRMED" | "CANCELLED"
  ): Promise<ApiResponse<Appointment>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/appointments/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update appointment status" };
    }
  },

  async deleteAppointment(token: string, id: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const res = await fetch(`${API_URL}/api/admin/appointments/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete appointment" };
    }
  },
};
