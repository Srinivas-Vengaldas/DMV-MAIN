"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AuthModalProps {
  mode: "login" | "register" | null;
  onClose: () => void;
  onSwitch: (mode: "login" | "register") => void;
}

export function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const { login, register } = useAuth();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("Washington, DC");
  const [regZip, setRegZip] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setRegFirstName("");
    setRegLastName("");
    setRegEmail("");
    setRegPhone("");
    setRegAddress("");
    setRegCity("Washington, DC");
    setRegZip("");
    setRegPassword("");
    setRegConfirm("");
    setError("");
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(loginEmail, loginPassword);

    setLoading(false);

    if (!result.success) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    handleClose();

    if (result.role === "ADMIN") {
      router.push("/admin");
    } else if (result.role === "STAFF") {
      router.push("/staff");
    } else {
      router.push("/application");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const success = await register({
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      phone: regPhone,
      address: regAddress,
      city: regCity,
      zip: regZip,
      password: regPassword,
    });

    setLoading(false);

    if (success) {
      handleClose();
      router.push("/application");
    } else {
      setError("An account with this email already exists.");
    }
  };

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-border bg-background">
        {mode === "login" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Log In to Smart-DMV
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter your credentials to access your account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 pt-2">
              {error && (
                <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Logging in..." : "Log In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {"Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    resetForms();
                    onSwitch("register");
                  }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Register
                </button>
              </p>
            </form>
          </>
        ) : mode === "register" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Create an Account
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Register to start your document verification process. Your information will pre-fill
                the application form.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRegister} className="flex flex-col gap-4 pt-2">
              {error && (
                <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-first-name" className="text-foreground">
                    First Name
                  </Label>
                  <Input
                    id="reg-first-name"
                    type="text"
                    placeholder="John"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-last-name" className="text-foreground">
                    Last Name
                  </Label>
                  <Input
                    id="reg-last-name"
                    type="text"
                    placeholder="Doe"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-phone" className="text-foreground">
                  Phone Number
                </Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="(202) 555-0123"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-address" className="text-foreground">
                  Street Address
                </Label>
                <Input
                  id="reg-address"
                  type="text"
                  placeholder="1234 Pennsylvania Ave NW"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-city" className="text-foreground">
                    City & State
                  </Label>
                  <Input
                    id="reg-city"
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-zip" className="text-foreground">
                    ZIP Code
                  </Label>
                  <Input
                    id="reg-zip"
                    type="text"
                    placeholder="20001"
                    value={regZip}
                    onChange={(e) => setRegZip(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-confirm" className="text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Confirm password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetForms();
                    onSwitch("login");
                  }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Log In
                </button>
              </p>
            </form>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}