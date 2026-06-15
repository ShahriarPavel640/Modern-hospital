import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Users, ClipboardList, CalendarCheck, 
  LogOut, Home, Menu, X, ShieldAlert
} from "lucide-react";
import logo from "../assets/modern-hospital-logo.png";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activePath = routerState.location.pathname;

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      navigate({ to: "/sign-in" });
    }
  }, [authLoaded, isSignedIn, navigate]);

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (authLoaded && userLoaded && isSignedIn && !isAdmin) {
      // Redirect non-admins to the patient dashboard
      navigate({ to: "/dashboard" });
    }
  }, [authLoaded, userLoaded, isSignedIn, isAdmin, navigate]);

  if (!authLoaded || !userLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-brand-muted/20 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold text-brand">Authenticating Admin...</span>
      </div>
    );
  }

  // Deny access if role is not admin (in case navigation takes a second)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-brand-muted/20 flex flex-col justify-center items-center text-center px-4">
        <ShieldAlert className="w-14 h-14 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-brand-dark">Access Denied (403)</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          You do not have administrative privileges. Redirecting to Patient Portal...
        </p>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Doctors", path: "/admin/doctors", icon: Users },
    { name: "Lab Reports", path: "/admin/tests", icon: ClipboardList },
    { name: "Appointments", path: "/admin/appointments", icon: CalendarCheck },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-brand-muted/20 flex flex-col lg:flex-row text-brand-dark">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-brand-dark text-white px-4 py-3 flex items-center justify-between shadow-md relative z-30 border-b border-accent-gold/20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-9 w-9 object-contain bg-white rounded-full p-1" />
          <span className="font-bold text-sm text-accent-gold">Admin Portal</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 hover:bg-white/10 rounded-lg transition"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`w-full lg:w-64 bg-brand-dark text-white shrink-0 lg:flex flex-col z-20 transition-all shadow-xl lg:sticky lg:top-0 lg:h-screen border-r border-accent-gold/10 ${mobileMenuOpen ? "flex fixed inset-x-0 top-[60px] bottom-0" : "hidden lg:flex"}`}>
        {/* Branding */}
        <div className="p-6 border-b border-white/10 hidden lg:flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1 shadow-md" />
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">Modern Hospital</h2>
            <span className="text-[10px] text-accent-gold font-bold tracking-widest uppercase">Admin Panel</span>
          </div>
        </div>

        {/* User profile brief */}
        <div className="p-6 border-b border-white/5 bg-brand-dark/30">
          <p className="text-xs text-white/50">Administrator</p>
          <p className="text-sm font-bold truncate text-accent-gold">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-accent-gold/10 text-accent-gold font-bold border-l-4 border-accent-gold pl-3" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-1 bg-brand-dark/10">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/5 transition"
          >
            <Home className="w-5 h-5" />
            <span>Hospital Home</span>
          </Link>
          <Link
            to="/dashboard"
            search={{ fromAdmin: true }}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/5 transition"
          >
            <Users className="w-5 h-5" />
            <span>Patient Portal</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition border-t border-white/5 pt-4 mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 relative overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
