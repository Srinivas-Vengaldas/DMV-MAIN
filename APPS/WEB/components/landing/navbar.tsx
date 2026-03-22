"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/landing/auth-modal";
import { ProfileDropdown } from "@/components/landing/profile-dropdown";

export function Navbar() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  const handleDocumentVerification = async () => {
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

  const handleAppointmentScheduling = async () => {
    if (!user) {
      setAuthModal("login");
      return;
    }

    router.push("/appointment");
  };

  const handleDashboardRedirect = () => {
    if (!user) {
      setAuthModal("login");
      return;
    }

    if (user.role === "ADMIN") {
      router.push("/admin");
    } else if (user.role === "STAFF") {
      router.push("/staff");
    } else {
      router.push("/application");
    }
  };

  return (
    <>
      <div className="bg-accent text-accent-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium tracking-wide opacity-80">DC.gov</span>
            <span className="hidden text-xs opacity-60 sm:inline">
              An official website of the District of Columbia government
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a href="#" className="opacity-70 transition-opacity hover:opacity-100">
              311 Online
            </a>
            <a href="#" className="opacity-70 transition-opacity hover:opacity-100">
              Agency Directory
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/dc-dmv-logo.png"
              alt="DC DMV - District of Columbia Department of Motor Vehicles"
              width={160}
              height={56}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link
              href="/"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Home
            </Link>

            <button
              type="button"
              onClick={() => void handleDocumentVerification()}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Document Verification
            </button>

            <button
              type="button"
              onClick={() => void handleAppointmentScheduling()}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Appointment Scheduling
            </button>

            {user && (
              <button
                type="button"
                onClick={handleDashboardRedirect}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {user.role === "ADMIN"
                  ? "Admin Dashboard"
                  : user.role === "STAFF"
                    ? "Staff Dashboard"
                    : "My Application"}
              </button>
            )}

            <a
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              About
            </a>

            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded bg-muted" />
            ) : user ? (
              <ProfileDropdown />
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthModal("login")}
                  className="border-primary/30 text-foreground hover:bg-primary/5 hover:text-primary"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAuthModal("register")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitch={(mode) => setAuthModal(mode)}
      />
    </>
  );
}