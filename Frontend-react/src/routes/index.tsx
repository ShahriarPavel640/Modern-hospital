import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import {
  Phone, Mail, MapPin, Clock, Facebook,
  Stethoscope, HeartPulse, Baby, Brain, Bone, Eye, Pill, Microscope,
  Ambulance, ShieldCheck, Users, Award, ChevronRight, Menu, X, Calendar,
  CheckCircle2, Sparkles, Activity, AlertCircle, CheckCircle,
} from "lucide-react";
import { publicAPI, Doctor as ApiDoctor } from "../lib/api";
import logo from "@/assets/modern-hospital-logo.png";
import hero from "@/assets/hospital-hero.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Modern Hospital Pvt. Limited | মডার্ন হসপিটাল (প্রা.) লিমিটেড" },
      { name: "description", content: "Modern Hospital Pvt. Limited — Maijdee, Noakhali. Trusted healthcare since 1996. Cardiology, Neurology, Gynecology, Pediatrics, Emergency 24/7." },
      { property: "og:title", content: "Modern Hospital Pvt. Limited" },
      { property: "og:description", content: "মডার্ন হসপিটাল (প্রা.) লিমিটেড — প্রধান সড়ক, মাইজদী, নোয়াখালী। ১৯৯৬ সাল থেকে আস্থার সাথে।" },
    ],
  }),
  component: Index,
});

const services = [
  { icon: HeartPulse, en: "Cardiology", bn: "হৃদরোগ বিভাগ" },
  { icon: Brain, en: "Neurology", bn: "নিউরোলজি" },
  { icon: Baby, en: "Gynecology & Obstetrics", bn: "গাইনি ও প্রসূতি" },
  { icon: Bone, en: "Orthopedics", bn: "অর্থোপেডিক্স" },
  { icon: Eye, en: "Eye Care", bn: "চক্ষু বিভাগ" },
  { icon: Stethoscope, en: "Medicine", bn: "মেডিসিন" },
  { icon: Microscope, en: "Pathology & Lab", bn: "প্যাথলজি ও ল্যাব" },
  { icon: Pill, en: "Pharmacy", bn: "ফার্মেসী" },
];

const packages = [
  { name: "Basic Health Checkup", bn: "বেসিক হেলথ চেকআপ", price: "১,৫০০", items: ["CBC", "Blood Sugar", "Urine R/E", "ECG", "Consultation"] },
  { name: "Executive Package", bn: "এক্সিকিউটিভ প্যাকেজ", price: "৪,৫০০", items: ["Full Blood Profile", "Lipid Profile", "Liver & Kidney", "X-Ray", "Doctor Consultation"] },
  { name: "Diabetic Care", bn: "ডায়াবেটিক কেয়ার", price: "২,৮০০", items: ["FBS / 2HABF", "HbA1c", "Lipid Profile", "Creatinine", "Diet Counseling"] },
];

function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiDoctors, setApiDoctors] = useState<ApiDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Appointment Form state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [doctorsError, setDoctorsError] = useState("");

  useEffect(() => {
    async function loadDoctors() {
      const res = await publicAPI.getDoctors();
      if (res.success && res.data) {
        setApiDoctors(res.data);
      } else {
        setDoctorsError(res.error || "Failed to load doctor profiles. Please refresh or try again later.");
      }
      setLoadingDoctors(false);
    }
    loadDoctors();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setBookingError("Please select a doctor.");
      return;
    }
    setBookingError("");
    setBookingSuccess(null);

    const errors: Record<string, string> = {};

    // Name: at least 2 chars, no numbers
    if (patientName.trim().length < 2 || /\d/.test(patientName)) {
      errors.patientName = "দয়া করে সঠিক নাম লিখুন / Please enter a valid name (2+ characters, no numbers)";
    }

    // Phone: BD format 01X-XXXXXXXX
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(patientPhone.trim())) {
      errors.patientPhone = "দয়া করে সঠিক মোবাইল নম্বর লিখুন / Please enter a valid phone (e.g. 01712345678)";
    }

    // Date: not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(appointmentDate);
    if (!appointmentDate || selectedDate.getTime() < today.getTime()) {
      errors.appointmentDate = "দয়া করে বর্তমান বা ভবিষ্যতের তারিখ নির্বাচন করুন / Please select today or a future date";
    }

    if (!selectedSpecialty) {
      errors.selectedSpecialty = "দয়া করে বিশেষত্ব নির্বাচন করুন / Please select a specialty";
    }

    if (!selectedDoctorId) {
      errors.selectedDoctorId = "দয়া করে চিকিৎসক নির্বাচন করুন / Please select a doctor";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setBookingLoading(true);

    const res = await publicAPI.bookSerial({
      patientName,
      patientPhone,
      doctorId: selectedDoctorId,
      appointmentDate,
    });

    if (res.success && res.data) {
      setBookingSuccess(res.data);
      // Reset form
      setPatientName("");
      setPatientPhone("");
      setSelectedSpecialty("");
      setSelectedDoctorId("");
      setAppointmentDate("");
      setValidationErrors({});
    } else {
      setBookingError(res.error || "Failed to book appointment. Please try again.");
    }
    setBookingLoading(false);
  };

  const availableDoctors = apiDoctors.filter((d: any) => d.isAvailable);
  const displayedDoctors = showAllDoctors ? availableDoctors : availableDoctors.slice(0, 4);

  const specialties = Array.from(new Set(availableDoctors.map((d: any) => d.specialty || d.dept))).filter(Boolean);
  const filteredDoctors = selectedSpecialty 
    ? availableDoctors.filter((d: any) => (d.specialty || d.dept) === selectedSpecialty)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="bg-brand-dark text-white/90 text-xs">
        <div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-accent-gold" /> +880 1700-000000</span>
            <span className="hidden md:flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-accent-gold" /> info@modernhospital.com</span>
            <span className="hidden lg:flex items-center gap-1.5 font-bn"><Clock className="w-3.5 h-3.5 text-accent-gold" /> ২৪/৭ জরুরী সেবা চালু</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-white/60">Follow us</span>
            <a className="w-7 h-7 grid place-items-center rounded-full bg-white/10 hover:bg-accent-gold hover:text-brand-dark transition" href="https://www.facebook.com/Mhpmaijde" target="_blank" rel="noopener noreferrer"><Facebook className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-brand/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
          <a href="#home" className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand rounded-full blur-md opacity-30" />
              <img src={logo} alt="Modern Hospital Logo" className="relative h-10 w-10 md:h-14 md:w-14 object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-xs sm:text-base md:text-xl font-bold text-brand-dark tracking-tight">Modern Hospital <span className="text-brand-light">Pvt. Ltd.</span></div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground font-bn">মডার্ন হসপিটাল (প্রা.) লিমিটেড</div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {[
              { en: "Home", href: "#home" },
              { en: "About", href: "#about" },
              { en: "Services", href: "#services" },
              { en: "Doctors", href: "#doctors" },
              { en: "Packages", href: "#packages" },
              { en: "Contact", href: "#contact" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="relative text-foreground/80 hover:text-brand transition-colors after:absolute after:bottom-[-6px] after:left-0 after:h-0.5 after:w-0 after:bg-accent-gold hover:after:w-full after:transition-all">
                {l.en}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-3 z-10 shrink-0">
            {!isLoaded ? (
              <Link to="/sign-in" className="bg-gradient-brand text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-semibold text-[10px] sm:text-xs md:text-sm shadow-elegant hover:scale-[1.02] transition-transform">
                Login
              </Link>
            ) : isSignedIn ? (
              <div className="flex items-center gap-1.5 md:gap-2">
                <Link to="/dashboard" className="bg-gradient-brand text-white px-2.5 sm:px-5 py-1.5 md:py-2.5 rounded-full font-semibold text-[10px] sm:text-xs md:text-sm shadow-elegant hover:scale-[1.02] transition-transform">
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Portal</span>
                </Link>
                <UserButton />
              </div>
            ) : (
              <Link to="/sign-in" className="bg-gradient-brand text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-semibold text-[10px] sm:text-xs md:text-sm shadow-elegant hover:scale-[1.02] transition-transform">
                Login
              </Link>
            )}
            <button className="lg:hidden p-1.5 md:p-2 text-brand-dark cursor-pointer" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t bg-white animate-in slide-in-from-top duration-300">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {[
                { en: "Home", href: "#home" },
                { en: "About", href: "#about" },
                { en: "Services", href: "#services" },
                { en: "Doctors", href: "#doctors" },
                { en: "Packages", href: "#packages" },
                { en: "Contact", href: "#contact" },
              ].map((h) => (
                <a key={h.href} href={h.href} onClick={() => setMenuOpen(false)} className="text-lg font-medium text-brand-dark hover:text-brand transition-colors border-b border-brand/5 pb-2">{h.en}</a>
              ))}
              {!isLoaded ? (
                <Link to="/sign-in" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-brand-dark hover:text-brand transition-colors border-b border-brand/5 pb-2">Login</Link>
              ) : isSignedIn ? (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-brand-dark hover:text-brand transition-colors border-b border-brand/5 pb-2">Dashboard</Link>
              ) : (
                <Link to="/sign-in" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-brand-dark hover:text-brand transition-colors border-b border-brand/5 pb-2">Login</Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative">
        <div className="relative min-h-[500px] md:h-[640px] overflow-hidden flex items-center">
          <img src={hero} alt="Modern Hospital building" className="absolute inset-0 w-full h-full object-cover scale-105" width={1600} height={900} />
          <div className="absolute inset-0 bg-gradient-hero" />
          {/* decorative orbs */}
          <div className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 rounded-full bg-accent-gold/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-56 md:w-80 h-56 md:h-80 rounded-full bg-brand-light/30 blur-3xl" />

          <div className="relative container mx-auto px-4 py-20 md:py-0">
            <div className="max-w-2xl text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
                <span className="font-bn text-xs md:text-sm">আস্থার সাথে ১৯৯৬ সাল থেকে</span>
              </div>
              <h1 className="text-3xl md:text-6xl font-extrabold leading-[1.1] mb-5 tracking-tight">
                Your Health,<br />
                <span className="bg-gradient-to-r from-accent-gold to-white bg-clip-text text-transparent">Our Priority.</span>
              </h1>
              <p className="font-bn text-xl md:text-2xl mb-3 text-white/95">আপনার স্বাস্থ্য, আমাদের অগ্রাধিকার</p>
              <p className="text-white/80 mb-8 text-sm md:text-base leading-relaxed max-w-lg">
                Modern Hospital Pvt. Limited — delivering world-class medical care in Maijdee, Noakhali with experienced specialists and modern equipment.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#appointment" className="bg-white text-brand-dark px-6 md:px-7 py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base inline-flex items-center gap-2 hover:bg-accent-gold transition-all shadow-elegant">
                  Book Appointment <ChevronRight className="w-4 h-4" />
                </a>
                <a href="#services" className="bg-white/10 backdrop-blur border border-white/30 text-white hover:bg-white/20 px-6 md:px-7 py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base transition">
                  Our Services
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick-info strip */}
        <div className="container mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: Ambulance, t: "24/7 Emergency", bn: "২৪/৭ জরুরী সেবা", d: "+880 1700-111111", href: "tel:+8801700111111" },
              { icon: Calendar, t: "Appointment", bn: "অ্যাপয়েন্টমেন্ট", d: "Book online or call us", href: "#appointment" },
              { icon: MapPin, t: "Find Us", bn: "ঠিকানা", d: "Main Road, Maijdee, Noakhali", href: "#map" },
            ].map((c, i) => (
              <a 
                key={i} 
                href={c.href}
                className="bg-white rounded-2xl shadow-elegant p-7 flex items-start gap-5 hover:-translate-y-2 transition-all duration-300 border border-brand/10 relative overflow-hidden group cursor-pointer block"
              >
                <div className="absolute inset-0 bg-medical-grid opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-brand text-white grid place-items-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <c.icon className="w-8 h-8" />
                </div>
                <div className="relative">
                  <div className="font-bold text-xl text-brand-dark">{c.t}</div>
                  <div className="text-xs font-bn text-brand mb-1.5 uppercase tracking-wider">{c.bn}</div>
                  <div className="text-sm text-foreground/70 font-medium">{c.d}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24 bg-brand-muted/30">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="relative">
            <div className="absolute -inset-4 md:-inset-6 bg-gradient-brand rounded-3xl opacity-10 blur-2xl" />
            <div className="relative rounded-3xl bg-white p-6 md:p-10 border border-brand/10 shadow-card">
              <img src={logo} alt="Modern Hospital" className="w-48 h-48 md:w-64 md:h-64 object-contain mx-auto" />
              <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1.5 shadow-md text-[10px] md:text-xs font-bold text-brand flex items-center gap-1.5">
                <Activity className="w-3 h-3 md:w-3.5 md:h-3.5 text-accent-red" /> Trusted since 1996
              </div>
            </div>
          </div>
          <div>
            <span className="section-eyebrow">About Us</span>
            <h2 className="text-2xl md:text-5xl font-bold mt-3 mb-3 text-brand-dark tracking-tight">Welcome to <span className="text-brand">Modern Hospital</span></h2>
            <p className="font-bn text-lg md:text-xl text-brand mb-5">মডার্ন হসপিটাল (প্রা.) লিমিটেড — আপনাকে স্বাগতম</p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
              Established in 1996, Modern Hospital Pvt. Limited is one of the most trusted private healthcare institutions in Noakhali. Our mission is to deliver compassionate, high-quality medical care to every patient with experienced consultants, modern diagnostic facilities, and round-the-clock emergency support.
            </p>
            <p className="font-bn text-sm md:text-base text-muted-foreground leading-relaxed mb-7">
              ১৯৯৬ সালে প্রতিষ্ঠিত মডার্ন হসপিটাল নোয়াখালী জেলার অন্যতম বিশ্বস্ত বেসরকারী চিকিৎসাকেন্দ্র। অভিজ্ঞ চিকিৎসক, আধুনিক ডায়াগনস্টিক সুবিধা ও ২৪ ঘন্টা জরুরী সেবা নিয়ে আমরা আপনার পাশে আছি।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { n: "৩০+", l: "Years Experience" },
                { n: "৫০+", l: "Specialist Doctors" },
                { n: "১০০K+", l: "Happy Patients" },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 md:p-5 rounded-2xl bg-white border border-brand/10 shadow-sm">
                  <div className="text-2xl md:text-3xl font-extrabold bg-gradient-brand bg-clip-text text-transparent font-bn">{s.n}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-grid opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-accent-gold">
              <span className="w-7 h-px bg-accent-gold" /> Our Services
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 text-white tracking-tight">Departments & <span className="text-accent-gold">Specialties</span></h2>
            <p className="font-bn text-lg text-white/70 mt-3">আমাদের সেবাসমূহ ও বিভাগ</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:bg-white/10 hover:border-accent-gold/40 hover:shadow-elegant hover:-translate-y-2 transition-all duration-300 text-center">
                <div className="relative flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-gold text-brand-dark grid place-items-center mb-5 group-hover:scale-110 transition-transform shadow-lg mx-auto">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{s.en}</h3>
                  <p className="font-bn text-sm text-white/60 mt-1">{s.bn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="py-24 bg-brand-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="section-eyebrow mx-auto">Meet Our Team</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 text-brand-dark tracking-tight">Our <span className="text-brand">Specialist Doctors</span></h2>
            <p className="font-bn text-lg text-muted-foreground mt-3">আমাদের বিশেষজ্ঞ চিকিৎসকগণ</p>
          </div>
          {doctorsError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl p-6 text-center max-w-xl mx-auto shadow-elegant flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div className="font-semibold text-sm md:text-base">{doctorsError}</div>
            </div>
          ) : availableDoctors.length === 0 && !loadingDoctors ? (
            <div className="bg-white border border-brand/10 rounded-2xl p-10 text-center text-muted-foreground max-w-xl mx-auto shadow-sm flex flex-col items-center gap-3">
              <Users className="w-8 h-8 text-brand/40 animate-pulse" />
              <div className="font-semibold text-sm md:text-base">No doctors are currently available. Please check back later.</div>
              <div className="font-bn text-xs">সাময়িকভাবে কোনো চিকিৎসক উপলব্ধ নেই। দয়া করে পরে চেষ্টা করুন।</div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedDoctors.map((d: any, i) => (
                <div key={i} className="group bg-white rounded-2xl overflow-hidden border border-brand/10 shadow-sm hover:shadow-elegant transition-all hover:-translate-y-1">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <div className="absolute inset-0 bg-brand-muted/20 bg-medical-grid opacity-30" />
                    <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 relative z-10" loading="lazy" width={600} height={700} />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-dark/70 to-transparent relative z-20" />
                    <div className="absolute top-3 left-3 bg-accent-gold text-brand-dark text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide relative z-20">{d.specialty}</div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-brand-dark">{d.name}</h3>
                    <p className="font-bn text-sm text-muted-foreground">{d.nameBn}</p>
                    <div className="text-xs text-brand font-semibold mt-2">{Array.isArray(d.degrees) ? d.degrees.join(', ') : d.degrees}</div>
                    <div className="text-xs mt-3 flex items-center gap-1.5 text-muted-foreground border-t border-brand/5 pt-3">
                      <Clock className="w-3.5 h-3.5 text-accent-gold" /> {d.visitingHours}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {availableDoctors.length > 4 && (
            <div className="text-center mt-10">
              <button
                onClick={() => setShowAllDoctors(!showAllDoctors)}
                className="bg-brand text-white hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] px-8 py-3 rounded-full font-semibold text-sm md:text-base transition-all shadow-elegant inline-flex items-center gap-2 cursor-pointer"
              >
                {showAllDoctors ? (
                  <>
                    Show Less <span className="font-bn text-sm">/ কম দেখুন</span>
                  </>
                ) : (
                  <>
                    View All Doctors <span className="font-bn text-sm">/ সকল ডাক্তার দেখুন</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-grid opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-accent-gold">
              <span className="w-7 h-px bg-accent-gold" /> Health Packages
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 text-white tracking-tight">Affordable <span className="text-accent-gold">Health Checkups</span></h2>
            <p className="font-bn text-lg text-white/70 mt-3">সাশ্রয়ী মূল্যে হেলথ চেকআপ প্যাকেজ</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {packages.map((p, i) => {
              const featured = i === 1;
              return (
                <div key={i} className={`relative rounded-3xl p-8 transition-all hover:-translate-y-2 ${featured ? "bg-gradient-brand text-white shadow-elegant scale-[1.05] z-10 border border-white/20" : "bg-white/5 backdrop-blur-md border border-white/10"}`}>
                  {featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-gold text-brand-dark text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">Most Popular</div>
                  )}
                  <h3 className={`text-xl font-bold ${featured ? "" : "text-white"}`}>{p.name}</h3>
                  <p className={`font-bn text-sm ${featured ? "text-white/80" : "text-white/60"}`}>{p.bn}</p>
                  <div className="my-6 flex items-baseline gap-1">
                    <span className={`font-bn text-5xl font-extrabold ${featured ? "text-white" : "text-accent-gold"}`}>৳{p.price}</span>
                    <span className={`text-sm ${featured ? "text-white/70" : "text-white/50"}`}>/ package</span>
                  </div>
                  <ul className="space-y-3 mb-7">
                    {p.items.map((it, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-accent-gold" /> {it}
                      </li>
                    ))}
                  </ul>
                  <a href="#appointment" className={`block text-center py-3 rounded-full font-semibold transition ${featured ? "bg-white text-brand hover:bg-accent-gold hover:text-brand-dark" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"}`}>
                    Book Now
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-grid opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-accent-gold">
              <span className="w-7 h-px bg-accent-gold" /> Why Choose Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 text-white tracking-tight">Excellence in <span className="text-accent-gold">Healthcare</span></h2>
            <p className="font-bn text-lg text-white/70 mt-3">কেন আমাদের বেছে নিবেন</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, t: "30+ Years", bn: "৩০+ বছরের অভিজ্ঞতা" },
              { icon: Users, t: "Expert Doctors", bn: "অভিজ্ঞ চিকিৎসক" },
              { icon: Ambulance, t: "24/7 Emergency", bn: "২৪ ঘন্টা জরুরী" },
              { icon: ShieldCheck, t: "Modern Equipment", bn: "আধুনিক যন্ত্রপাতি" },
            ].map((f, i) => (
              <div key={i} className="group text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-accent-gold/40 hover:shadow-elegant transition-all duration-300">
                <div className="w-20 h-20 rounded-2xl bg-gradient-gold text-brand-dark mx-auto mb-6 grid place-items-center shadow-md group-hover:scale-110 transition-transform">
                  <f.icon className="w-10 h-10" />
                </div>
                <div className="font-bold text-xl text-white">{f.t}</div>
                <div className="font-bn text-sm text-white/60 mt-2">{f.bn}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appointment + Contact */}
      <section id="appointment" className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-grid opacity-10" />
        <div className="container mx-auto px-4 relative flex flex-col gap-16">
          
          {/* Appointment Form */}
          <div className="w-full max-w-xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-card relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-accent-gold group-hover:w-3 transition-all" />
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-accent-gold">
              <span className="w-7 h-px bg-accent-gold" /> Appointment
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 text-white tracking-tight">Book Your Appointment</h2>
            <p className="font-bn text-base text-white/70 mt-1 mb-5">অ্যাপয়েন্টমেন্ট বুক করুন</p>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              {bookingError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}
              {bookingSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-emerald-100 text-sm">
                  <div className="flex items-start gap-2.5 text-emerald-300">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm md:text-base font-bn leading-snug">
                        অ্যাপয়েন্টমেন্ট বুক করার জন্য ধন্যবাদ। আমাদের টিম খুব শীঘ্রই আপনার সাথে যোগাযোগ করবে।
                      </div>
                      <div className="text-xs text-emerald-300/80 mt-1">
                        Thank you for booking an appointment. Our team will contact you very soon.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Patient Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/95">
                  Full Name <span className="text-accent-gold">*</span> <span className="font-bn text-[10px] text-white/50 ml-1">(সম্পূর্ণ নাম)</span>
                </label>
                <input 
                  required 
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    if (validationErrors.patientName) {
                      setValidationErrors(prev => ({ ...prev, patientName: "" }));
                    }
                  }}
                  placeholder="Enter your full name" 
                  className={`w-full bg-white/10 border ${validationErrors.patientName ? 'border-red-500 focus:ring-red-500/15' : 'border-white/15 focus:ring-accent-gold/15'} rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-gold focus:ring-2 transition shadow-sm text-white text-sm placeholder:text-white/30`} 
                />
                {validationErrors.patientName && (
                  <span className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationErrors.patientName}
                  </span>
                )}
              </div>

              {/* Patient Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/95">
                  Phone Number <span className="text-accent-gold">*</span> <span className="font-bn text-[10px] text-white/50 ml-1">(মোবাইল নম্বর)</span>
                </label>
                <input 
                  required 
                  type="tel" 
                  value={patientPhone}
                  onChange={(e) => {
                    setPatientPhone(e.target.value);
                    if (validationErrors.patientPhone) {
                      setValidationErrors(prev => ({ ...prev, patientPhone: "" }));
                    }
                  }}
                  placeholder="e.g. 01712345678" 
                  className={`w-full bg-white/10 border ${validationErrors.patientPhone ? 'border-red-500 focus:ring-red-500/15' : 'border-white/15 focus:ring-accent-gold/15'} rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-gold focus:ring-2 transition shadow-sm text-white text-sm placeholder:text-white/30`} 
                />
                {validationErrors.patientPhone && (
                  <span className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationErrors.patientPhone}
                  </span>
                )}
              </div>

              {/* Select Specialty */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/95">
                  Select Specialty <span className="text-accent-gold">*</span> <span className="font-bn text-[10px] text-white/50 ml-1">(বিশেষত্ব নির্বাচন করুন)</span>
                </label>
                <select 
                  required
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setSelectedDoctorId("");
                    if (validationErrors.selectedSpecialty) {
                      setValidationErrors(prev => ({ ...prev, selectedSpecialty: "" }));
                    }
                  }}
                  className={`w-full bg-white/10 border ${validationErrors.selectedSpecialty ? 'border-red-500 focus:ring-red-500/15' : 'border-white/15 focus:ring-accent-gold/15'} rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-gold focus:ring-2 transition shadow-sm text-white/80 text-sm cursor-pointer`}
                >
                  <option value="" className="bg-brand-dark">Choose a specialty...</option>
                  {specialties.map((s, i) => (
                    <option key={i} value={s} className="bg-brand-dark text-white text-sm">
                      {s}
                    </option>
                  ))}
                </select>
                {validationErrors.selectedSpecialty && (
                  <span className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationErrors.selectedSpecialty}
                  </span>
                )}
              </div>

              {/* Select Doctor */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/95">
                  Select Doctor <span className="text-accent-gold">*</span> <span className="font-bn text-[10px] text-white/50 ml-1">(চিকিৎসক নির্বাচন করুন)</span>
                </label>
                <select 
                  required
                  disabled={!selectedSpecialty}
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    if (validationErrors.selectedDoctorId) {
                      setValidationErrors(prev => ({ ...prev, selectedDoctorId: "" }));
                    }
                  }}
                  className={`w-full bg-white/10 border ${validationErrors.selectedDoctorId ? 'border-red-500 focus:ring-red-500/15' : 'border-white/15 focus:ring-accent-gold/15'} rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-gold focus:ring-2 transition shadow-sm text-white/80 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="" className="bg-brand-dark">
                    {!selectedSpecialty ? "Select a specialty first..." : "Choose a doctor..."}
                  </option>
                  {filteredDoctors.map((d: any, i) => (
                    <option key={i} value={d.id || d.name} className="bg-brand-dark text-white text-sm">
                      {d.name} ({d.degrees ? (Array.isArray(d.degrees) ? d.degrees.join(', ') : d.degrees) : d.spec})
                    </option>
                  ))}
                </select>
                {validationErrors.selectedDoctorId && (
                  <span className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationErrors.selectedDoctorId}
                  </span>
                )}
              </div>

              {/* Appointment Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/95">
                  Appointment Date <span className="text-accent-gold">*</span> <span className="font-bn text-[10px] text-white/50 ml-1">(অ্যাপয়েন্টমেন্টের তারিখ)</span>
                </label>
                <input 
                  required
                  type="date" 
                  value={appointmentDate}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value);
                    if (validationErrors.appointmentDate) {
                      setValidationErrors(prev => ({ ...prev, appointmentDate: "" }));
                    }
                  }}
                  className={`w-full bg-white/10 border ${validationErrors.appointmentDate ? 'border-red-500 focus:ring-red-500/15' : 'border-white/15 focus:ring-accent-gold/15'} rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-gold focus:ring-2 transition shadow-sm text-white/80 text-sm`} 
                />
                {validationErrors.appointmentDate && (
                  <span className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationErrors.appointmentDate}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button 
                  type="submit" 
                  disabled={bookingLoading}
                  className="w-full bg-gradient-gold text-brand-dark py-3 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shadow-elegant disabled:opacity-50 cursor-pointer"
                >
                  {bookingLoading ? "Booking..." : "Confirm Booking / অ্যাপয়েন্টমেন্ট সম্পন্ন করুন"} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Contact Info */}
          <div id="contact" className="w-full max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-accent-gold">
              <span className="w-7 h-px bg-accent-gold" /> Contact Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-white tracking-tight">Get in Touch</h2>
            <p className="font-bn text-lg text-white/70 mt-1 mb-7">আমাদের সাথে যোগাযোগ করুন</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { icon: MapPin, t: "Main Road, Maijdee, Noakhali", bn: "প্রধান সড়ক, মাইজদী, নোয়াখালী" },
                { icon: Phone, t: "+880 1700-000000 / +880 321-00000", bn: "জরুরী: +880 1700-111111" },
                { icon: Mail, t: "info@modernhospital.com", bn: "appointment@modernhospital.com" },
                { icon: Clock, t: "OPD: 9:00 AM – 10:00 PM", bn: "জরুরী বিভাগ: ২৪ ঘন্টা খোলা" },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent-gold/30 hover:shadow-card transition group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-gold text-brand-dark grid place-items-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{c.t}</div>
                    <div className="text-sm text-white/50 font-bn mt-1">{c.bn}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Location */}
          <div id="map" className="w-full max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase text-accent-gold mb-3">
              <span className="w-7 h-px bg-accent-gold" /> Location Map / অবস্থান মানচিত্র
            </span>
            <div className="rounded-2xl overflow-hidden border border-white/10 h-80 shadow-card relative">
              <div className="absolute inset-0 bg-brand/20 pointer-events-none z-10 mix-blend-multiply" />
              <iframe
                title="Modern Hospital Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.057351659972!2d91.09469521487841!3d22.87989328221886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3754a48a9fadd699%3A0xa4566cea63696e9a!2sModern+Hospital%2C+Chowmohani+-+Maijdee+Rd%2C+Noakhali!5e0!3m2!1sen!2sbd!4v1718500000000"
                className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700 contrast-125"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark text-white pt-16 pb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent" />
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Modern Hospital" className="h-12 w-12 object-contain bg-white rounded-full p-1.5" />
              <div>
                <div className="font-bold">Modern Hospital</div>
                <div className="font-bn text-xs text-white/70">মডার্ন হসপিটাল</div>
              </div>
            </div>
            <p className="text-sm text-white/70 font-bn leading-relaxed mb-4">
              ১৯৯৬ সাল থেকে নোয়াখালী জেলায় আস্থার সাথে চিকিৎসা সেবা প্রদান করে আসছি।
            </p>
            <div className="flex gap-2">
              <a href="https://www.facebook.com/Mhpmaijde" target="_blank" rel="noopener noreferrer" className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-accent-gold hover:text-brand-dark transition">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-accent-gold text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {[["#about", "About Us"], ["#services", "Services"], ["#doctors", "Doctors"], ["#packages", "Packages"], ["#contact", "Contact"]].map(([h, l]) => (
                <li key={h}><a href={h} className="hover:text-accent-gold transition flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-accent-gold text-sm uppercase tracking-wider font-bn">সেবাসমূহ</h4>
            <ul className="space-y-2.5 text-sm text-white/70 font-bn">
              {services.slice(0, 5).map((s, i) => <li key={i} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />{s.bn}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-accent-gold text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-accent-gold" /> Main Road, Maijdee, Noakhali</li>
              <li className="flex gap-2"><Phone className="w-4 h-4 shrink-0 mt-0.5 text-accent-gold" /> +880 1700-000000</li>
              <li className="flex gap-2"><Mail className="w-4 h-4 shrink-0 mt-0.5 text-accent-gold" /> info@modernhospital.com</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-6 border-t border-white/10 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Modern Hospital Pvt. Limited. All rights reserved. <span className="font-bn">| সর্বস্বত্ব সংরক্ষিত</span>
        </div>
      </footer>
    </div>
  );
}
