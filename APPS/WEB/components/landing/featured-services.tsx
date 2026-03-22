"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/landing/auth-modal";

const services = [
  {
    title: "Document Verification",
    description: "Upload and verify your identity and residency documents online before your DMV visit.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    ),
    href: "/application",
    requiresAuth: true,
    highlight: true,
  },
  {
    title: "Driver Licenses",
    description: "Apply for, renew, or replace your DC driver license or learner permit.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h2" /><path d="M15 12h2" /><path d="M7 16h10" /></svg>
    ),
    href: "#",
    requiresAuth: false,
  },
  {
    title: "Vehicle Registration",
    description: "Register, renew, or transfer your vehicle title and registration.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2" /><path d="M9 17h6" /><path d="M14 6l-1 -3" /></svg>
    ),
    href: "#",
    requiresAuth: false,
  },
  {
    title: "Pay Tickets",
    description: "Pay parking and photo enforcement tickets online securely.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
    href: "#",
    requiresAuth: false,
  },
  {
    title: "Appointment Scheduling",
    description: "Book your DMV visit after document verification is complete.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></svg>
    ),
    href: "/appointment",
    requiresAuth: true,
  },
  {
    title: "ID Cards",
    description: "Apply for a non-driver identification card for the District of Columbia.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
    ),
    href: "#",
    requiresAuth: false,
  },
];

export function FeaturedServices() {
  const { user } = useAuth();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  const handleDocumentVerificationClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      setAuthModal("login");
      return;
    }

    try {
      const res = await fetch("/application/status", {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (data?.formSubmitted) {
        router.push("/document-upload");
      } else {
        router.push("/application");
      }
    } catch {
      router.push("/application");
    }
  };

  const handleAppointmentClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      setAuthModal("login");
      return;
    }

    router.push("/appointment");
  };

  const handleServiceClick = async (service: typeof services[number], e: React.MouseEvent) => {
    if (service.title === "Document Verification") {
      await handleDocumentVerificationClick(e);
      return;
    }

    if (service.title === "Appointment Scheduling") {
      await handleAppointmentClick(e);
      return;
    }

    if (service.requiresAuth && !user) {
      e.preventDefault();
      setAuthModal("login");
      return;
    }

    if (service.href !== "#") {
      e.preventDefault();
      router.push(service.href);
    }
  };

  return (
    <>
      <section id="services" className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Featured Services</h2>
            <p className="mt-2 text-muted-foreground">
              Access the most popular DC DMV services online
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <a
                key={service.title}
                href={service.href}
                onClick={(e) => {
                  void handleServiceClick(service, e);
                }}
                className={`group flex flex-col gap-3 rounded-lg border p-6 transition-all hover:shadow-md ${
                  service.highlight
                    ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    service.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {service.icon}
                </div>

                <h3 className="text-base font-semibold text-foreground">
                  {service.title}
                  {service.requiresAuth && !user && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 inline-block text-muted-foreground"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  )}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>

                {service.requiresAuth && !user && (
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    Login required
                  </span>
                )}

                {service.highlight && user && (
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Get Started
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </span>
                )}

                {service.highlight && !user && (
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Log in to get started
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      <AuthModal
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitch={(mode) => setAuthModal(mode)}
      />
    </>
  );
}