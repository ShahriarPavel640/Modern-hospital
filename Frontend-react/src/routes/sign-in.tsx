import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";
import logo from "../assets/modern-hospital-logo.png";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center relative overflow-hidden px-4">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-medical-grid opacity-10" />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent-gold/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-brand-light/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Hospital Branding */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src={logo}
            alt="Modern Hospital Logo"
            className="h-14 w-14 object-contain bg-white rounded-full p-1.5 shadow-md"
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Modern Hospital
            </h1>
            <p className="text-xs text-white/60 font-bn">
              মডার্ন হসপিটাল (প্রা.) লিমিটেড
            </p>
          </div>
        </div>

        {/* Clerk Sign In Card */}
        <SignIn
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full shadow-elegant rounded-2xl overflow-hidden",
              cardBox: "border border-white/10 bg-white",
              headerTitle: "text-brand-dark text-xl font-bold",
              headerSubtitle: "text-muted-foreground text-sm",
              formButtonPrimary:
                "bg-gradient-brand hover:opacity-95 text-white font-semibold rounded-xl py-3 shadow-md border-none",
              formFieldInput:
                "border border-brand/20 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl px-4 py-3 text-sm",
              footerActionLink: "text-brand hover:text-brand-light font-semibold",
            },
          }}
        />
      </div>
    </div>
  );
}
