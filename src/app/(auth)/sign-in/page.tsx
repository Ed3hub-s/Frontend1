"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardPathForRole, useAuth } from "@/context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const passwordReset = searchParams.get("reset") === "1";
  const requestedNext = searchParams.get("next");
  const nextPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') && !/[\\\u0000-\u001f]/.test(requestedNext)
    ? requestedNext : null;
  const { login, googleAuth, user, loading } = useAuth();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Google role picker for new users hitting sign-in
  const [showRolePicker, setShowRolePicker] = React.useState(false);
  const [googleToken, setGoogleToken] = React.useState("");
  const [googleRole, setGoogleRole] = React.useState("learner");
  const [googleLoading, setGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath || dashboardPathForRole(user.role));
    }
  }, [user, loading, router, nextPath]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setGoogleToken(tokenResponse.access_token);
      setSubmitting(true);
      try {
        // Check if user exists by attempting a sign-in without role
        const { role, isNewUser } = await googleAuth(tokenResponse.access_token);
        if (isNewUser) {
          // New user on sign-in page — let them pick a role
          setShowRolePicker(true);
        } else {
          router.push(nextPath || dashboardPathForRole(role));
        }
      } catch {
        setError("Google sign-in failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => setError("Google sign-in failed. Please try again."),
  });

  const handleConfirmGoogleRole = async () => {
    setGoogleLoading(true);
    try {
      // Pass role only for new user registration — backend ignores it for existing users
      const { role } = await googleAuth(googleToken, googleRole);
      router.push(nextPath || dashboardPathForRole(role));
    } catch {
      setError("Failed to complete sign-in. Please try again.");
      setShowRolePicker(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loading || user) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const role = await login(username, password);
      router.push(nextPath || dashboardPathForRole(role));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; unverified?: boolean; email?: string } } };
      const data = e.response?.data;
      if (data?.unverified && data.email) {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        return;
      }
      setError(data?.detail ?? "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 items-center justify-center font-open-sans">
      <div className="flex flex-col space-y-2 justify-center items-center">
        <Image src="/login/logo.svg" alt="logo" width={50} height={50} className="object-cover border" />
        <div className="space-y-1 flex flex-col justify-center items-center">
          <h1 className="text-2xl font-semibold font-poppins">Welcome Back!</h1>
          <p className="text-sm font-open-sans">Sign in to your account to continue</p>
        </div>
      </div>

      {passwordReset && (
        <p className="text-green-600 text-sm text-center bg-green-50 border border-green-200 rounded-md px-4 py-2 w-full max-w-md">
          ✓ Password reset successfully! You can now sign in.
        </p>
      )}

      {verified && (
        <p className="text-green-600 text-sm text-center bg-green-50 border border-green-200 rounded-md px-4 py-2 w-full max-w-md">
          ✓ Email verified successfully! You can now sign in.
        </p>
      )}

      <form className="w-full max-w-md space-y-4 py-5" onSubmit={handleSignIn}>
        <Input type="text" placeholder="Username" label="Username" labelClassName="text-sm"
          value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} />
        <Input type="password" placeholder="Password" label="Password" labelClassName="text-sm" togglePassword
          value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex items-center space-x-2 py-2">
          <Input type="checkbox" name="remember" id="remember" className="size-4" />
          <label htmlFor="remember" className="text-sm">
            I agree to&nbsp;
            <Link href="/terms-and-condition" className="text-primary">Terms and Conditions</Link>
          </label>
        </div>

        <Button className="w-full rounded-full mt-1 py-5" variant="default" size="sm" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </Button>

        <Button
          className="w-full rounded-full hover:bg-transparent active:bg-transparent active:border-0 p-0 bg-transparent text-primary"
          size="sm" type="button" onClick={() => router.push("/reset-password")}
        >
          Forget Password?
        </Button>
      </form>

      <div className="flex flex-col justify-center items-center w-full">
        <h1 className="text-sm bg-transparent px-2">or continue with</h1>
      </div>

      <div className="flex space-x-3">
        <button type="button" title="Sign in with Google" onClick={() => handleGoogleLogin()} disabled={submitting}>
          <Image src="/logo/google.svg" alt="google" width={50} height={50} />
        </button>
      </div>

      <div className="flex flex-col space-y-2 justify-center items-center">
        <p className="text-sm font-open-sans">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary">Sign Up</Link>
        </p>
      </div>

      {/* Role picker for new Google users */}
      {showRolePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-6">
            <Image src="/login/logo.svg" alt="logo" width={44} height={44} className="object-cover border rounded-lg" />
            <div className="text-center">
              <h2 className="text-xl font-bold font-poppins">One last step!</h2>
              <p className="text-sm text-gray-500 mt-1">How will you be using Ed3Hub?</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
              {(["learner", "educator"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setGoogleRole(r)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    googleRole === r ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{r === "learner" ? "🎓" : "📚"}</span>
                  <span className="text-sm font-semibold capitalize">{r}</span>
                  <span className="text-[11px] text-gray-400 text-center leading-tight">
                    {r === "learner" ? "I want to learn new skills" : "I want to teach & create courses"}
                  </span>
                </button>
              ))}
            </div>
            <Button className="w-full rounded-full py-5" onClick={handleConfirmGoogleRole} disabled={googleLoading}>
              {googleLoading ? "Setting up your account..." : "Continue"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
