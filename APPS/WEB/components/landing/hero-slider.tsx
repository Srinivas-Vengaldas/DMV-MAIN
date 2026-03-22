"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/landing/auth-modal";

const slides = [
  {
    image: "/images/slide-1.jpg",
    title: "Welcome to Smart-DMV",
    subtitle: "Your digital gateway to DC Department of Motor Vehicles services",
  },
  {
    image: "/images/slide-2.jpg",
    title: "Skip the Line, Go Online",
    subtitle: "Upload and verify your documents before your appointment",
  },
  {
    image: "/images/slide-3.jpg",
    title: "Fast. Secure. Convenient.",
    subtitle: "AI-powered document verification saves you time and hassle",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const handleStartVerification = async () => {
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

  return (
    <>
      <section className="relative h-[400px] overflow-hidden sm:h-[480px] lg:h-[540px]">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.title} className="relative h-full w-full shrink-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-accent/60" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="max-w-xl">
              <h1 className="text-balance text-3xl font-bold leading-tight text-accent-foreground sm:text-4xl lg:text-5xl">
                {slides[current].title}
              </h1>
              <p className="mt-3 text-pretty text-base text-accent-foreground/80 sm:text-lg">
                {slides[current].subtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => void handleStartVerification()}
                  className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  Start Document Verification
                </Button>
                <a href="#services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-accent-foreground/30 bg-accent-foreground/10 text-accent-foreground hover:bg-accent-foreground/20 hover:text-accent-foreground"
                  >
                    Explore Services
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-accent-foreground/40 hover:bg-accent-foreground/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent/40 text-accent-foreground transition-colors hover:bg-accent/60"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <button
          onClick={next}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent/40 text-accent-foreground transition-colors hover:bg-accent/60"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </section>

      <AuthModal
        mode={authModal}
        onClose={() => setAuthModal(null)}
        onSwitch={(mode) => setAuthModal(mode)}
      />
    </>
  );
}