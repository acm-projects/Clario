import AuthLayout from "../components/auth/AuthLayout";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  // Email/password form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // EMAIL + PASSWORD LOGIN
  // ============================================
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      console.log("Logged in user:", data.user);

      navigate("/Dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while logging in."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // GOOGLE OAUTH LOGIN
  // ============================================
  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          // After Google + Supabase finish authentication,
          // send the user here.
          redirectTo: `${window.location.origin}/Dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      // Normally the browser redirects away from this page,
      // so there is no navigate() needed here.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong with Google login."
      );

      setGoogleLoading(false);
    }
  }

  return <AuthLayout>
<div className="w-full max-w-[480px] rounded-3xl border border-[#4b505c]/25 bg-white p-6 shadow-[0_16px_48px_-24px_#18213725] sm:p-9">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-[#687087]">
                  Log in to keep practicing.
                </p>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* EMAIL LOGIN */}
              <form onSubmit={handleLogin} className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] px-4 text-sm outline-none transition focus:border-[#4566ed] focus:ring-2 focus:ring-[#4566ed]/20 motion-reduce:transition-none"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-medium text-[#4566ed] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] px-4 text-sm outline-none transition focus:border-[#4566ed] focus:ring-2 focus:ring-[#4566ed]/20 motion-reduce:transition-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full cursor-pointer rounded-xl border border-[#4b505c] bg-[#4566ed] text-sm font-semibold text-white transition hover:bg-[#3655d8] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-200" />

                <span className="text-[11px] text-neutral-400">
                  or continue with
                </span>

                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              {/* GOOGLE LOGIN */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                <GoogleIcon />

                {googleLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>

              {/* GO TO SIGNUP */}
              <p className="mt-8 text-center text-xs text-[#687087]">
                New to Clario?{" "}
                <Link
                  to="/Signup"
                  className="font-semibold text-[#4566ed] underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
  </AuthLayout>;
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.4l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.59A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.01 6.01 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.49H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.51l3.34-2.59Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.95 5.49l3.34 2.59C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
}
