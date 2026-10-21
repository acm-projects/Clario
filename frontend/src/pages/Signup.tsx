import AuthLayout from "../components/auth/AuthLayout";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const navigate = useNavigate();

  // ============================================
  // FORM VALUES
  // ============================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // ============================================
  // LOADING / ERROR
  // ============================================
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // SIGN UP WITH SUPABASE
  // ============================================
  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    // Make sure passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Make sure password is at least 8 characters
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // ============================================
      // CREATE USER IN SUPABASE AUTH
      // ============================================
      const { data, error } = await supabase.auth.signUp({
        email,
        password,

        // Extra info stored with the auth user
        options: {
          data: {
            date_of_birth: dateOfBirth,
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log("Created user:", data.user);

      // ============================================
      // IF EMAIL CONFIRMATION IS OFF:
      // data.session exists and we can immediately
      // send them to the assessment.
      //
      // IF EMAIL CONFIRMATION IS ON:
      // they need to verify their email first.
      // ============================================
      if (data.session) {
        navigate("/Assessment");
      } else {
        alert(
          "Account created! Check your email to verify your account, then log in."
        );

        navigate("/Login");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while signing up."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/assessment`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong with Google signup.");
      setGoogleLoading(false);
    }
  }

  return <AuthLayout>
<div className="w-full max-w-[480px] rounded-3xl border border-[#4b505c]/25 bg-white p-6 shadow-[0_16px_48px_-24px_#18213725] sm:p-9">
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                Create an account
              </h2>

              <p className="mt-2 text-sm text-[#687087]">
                It takes less than a minute.
              </p>

              {/* ======================================
                  ERROR MESSAGE
              ====================================== */}
              {error && (
                <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* ======================================
                  SIGNUP FORM
              ====================================== */}
              <form onSubmit={handleSignup} className="mt-8 space-y-6">
                {/* EMAIL */}
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

                {/* ======================================
                    PASSWORDS
                ====================================== */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8+ characters"
                      autoComplete="new-password"
                      className="h-12 w-full rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] px-4 text-sm outline-none transition focus:border-[#4566ed] focus:ring-2 focus:ring-[#4566ed]/20 motion-reduce:transition-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Confirm password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter"
                      autoComplete="new-password"
                      className="h-12 w-full rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] px-4 text-sm outline-none transition focus:border-[#4566ed] focus:ring-2 focus:ring-[#4566ed]/20 motion-reduce:transition-none"
                    />
                  </div>
                </div>

                {/* ======================================
                    DATE OF BIRTH
                ====================================== */}
                <div>
                  <label
                    htmlFor="dob"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Date of birth
                  </label>

                  <input
                    id="dob"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] px-4 text-sm text-neutral-600 outline-none transition focus:border-[#4566ed] focus:ring-2 focus:ring-[#4566ed]/20 motion-reduce:transition-none sm:max-w-[220px]"
                  />
                </div>

                {/* ======================================
                    SIGN UP BUTTON
                ====================================== */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="h-12 w-full cursor-pointer rounded-xl border border-[#4b505c] bg-[#4566ed] text-sm font-semibold text-white transition hover:bg-[#3655d8] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              {/* ======================================
                  DIVIDER
              ====================================== */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-200" />

                <span className="text-[11px] text-neutral-400">
                  or continue with
                </span>

                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              {/* GOOGLE AUTH */}
              <button
                onClick={handleGoogleSignup}
                type="button"
                disabled={loading || googleLoading}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#4b505c]/30 bg-[#fffdf8] text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                <GoogleIcon />
                {googleLoading ? "Connecting to Google..." : "Google"}
              </button>

              {/* ======================================
                  GO TO LOGIN
              ====================================== */}
              <p className="mt-8 text-center text-xs text-[#687087]">
                Already have an account?{" "}
                <Link
                  to="/Login"
                  className="font-semibold text-[#4566ed] underline-offset-4 hover:underline"
                >
                  Log in
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
