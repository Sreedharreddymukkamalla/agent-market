"use client";

import { useState, Suspense } from "react";
import { Button, Input, Card, TextField, Label } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
    } else {
      router.push("/dashboard/agent-aim?aimFresh=1");
      router.refresh();
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      alert("Verification code resent!");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
      <Card className="w-full max-w-md p-8 border border-divider bg-surface">
        <div className="flex flex-col gap-4 text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground text-sm">
            We've sent an 8-digit code to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            Enter it below to confirm your account.
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleVerify}>
          <TextField isRequired>
            <Label>Verification Code</Label>
            <Input
              className="text-center tracking-[0.5em] text-2xl font-bold"
              maxLength={8}
              placeholder="Enter 8-digit code"
              value={otp}
              variant="secondary"
              onChange={(e) => setOtp(e.target.value)}
            />
          </TextField>

          {error && (
            <p className="text-danger text-sm text-center font-medium">
              {error}
            </p>
          )}

          <Button
            className="w-full font-semibold rounded-xl"
            isPending={loading}
            size="lg"
            type="submit"
            variant="primary"
          >
            Verify Account
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              className="font-medium text-foreground underline-offset-4 hover:underline transition-all"
              type="button"
              onClick={handleResend}
            >
              Resend Code
            </button>
          </p>
        </div>

        <button
          className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => router.push("/login")}
        >
          &larr; Back to Login
        </button>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
