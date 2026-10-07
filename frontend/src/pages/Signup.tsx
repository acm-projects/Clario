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

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-[#F6EDD1] font-sans text-[#191d20] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#191d20] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#191d20]">
      {/* ======================================
          LOGO
      ====================================== */}
      <Link
        to="/"
        className="absolute left-6 top-6 z-20 rounded-xl border border-white/90 bg-white/55 px-4 py-2 text-2xl font-semibold tracking-[-0.07em] shadow-[0_4px_24px_rgba(25,29,32,0.045)] backdrop-blur-xl sm:left-8"
      >
        CLARIO
      </Link>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center justify-center px-6 pb-32 pt-24 lg:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* ======================================
              LEFT SIDE
          ====================================== */}
          <section className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <DuckPlaceholder />

              <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl">
                Just keep
                <br />
                paddling.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-[#55595c] sm:text-base">
                Calm on the surface, prepared underneath. Practice technical
                interviews out loud with Clario.
              </p>

              <ul className="mt-8 space-y-4 text-sm text-neutral-600">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#3b8fe8]" />

                  Voice interviews that ask follow-ups
                </li>

                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#3b8fe8]" />

                  Code and run in the browser
                </li>

                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#3b8fe8]" />

                  Feedback after every session
                </li>
              </ul>
            </div>
          </section>

          {/* ======================================
              SIGNUP CARD
          ====================================== */}
          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[500px] rounded-2xl border border-white/90 bg-white/65 p-8 shadow-[0_16px_48px_-16px_rgba(25,29,32,0.12)] backdrop-blur-xl sm:p-10">
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                Create an account
              </h2>

              <p className="mt-2 text-sm text-[#55595c]">
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
                    className="h-12 w-full rounded-lg border border-[#191d20]/15 bg-white/80 px-4 text-sm outline-none transition focus:border-[#3b8fe8] focus:ring-2 focus:ring-[#3b8fe8]/20 motion-reduce:transition-none"
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
                      className="h-12 w-full rounded-lg border border-[#191d20]/15 bg-white/80 px-4 text-sm outline-none transition focus:border-[#3b8fe8] focus:ring-2 focus:ring-[#3b8fe8]/20 motion-reduce:transition-none"
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
                      className="h-12 w-full rounded-lg border border-[#191d20]/15 bg-white/80 px-4 text-sm outline-none transition focus:border-[#3b8fe8] focus:ring-2 focus:ring-[#3b8fe8]/20 motion-reduce:transition-none"
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
                    className="h-12 w-full rounded-lg border border-[#191d20]/15 bg-white/80 px-4 text-sm text-neutral-600 outline-none transition focus:border-[#3b8fe8] focus:ring-2 focus:ring-[#3b8fe8]/20 motion-reduce:transition-none sm:max-w-[220px]"
                  />
                </div>

                {/* ======================================
                    SIGN UP BUTTON
                ====================================== */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="h-12 w-full cursor-pointer rounded-lg bg-[#3b8fe8] text-sm font-semibold text-[#121826] transition hover:bg-[#6eaff8] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
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
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#191d20]/15 bg-white/80 text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                <GoogleIcon />
                {googleLoading ? "Connecting to Google..." : "Google"}
              </button>

              {/* ======================================
                  GO TO LOGIN
              ====================================== */}
              <p className="mt-8 text-center text-xs text-[#55595c]">
                Already have an account?{" "}
                <Link
                  to="/Login"
                  className="font-semibold text-[#2f7fe2] underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>

      <Water />
    </main>
  );
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

function DuckPlaceholder() {
  return (
    <figure className="m-0 flex h-[160px] w-[232px] flex-col border border-[#191d20]/15 bg-white/25" aria-label="Placeholder for the Clario duck illustration">
      <div className="flex justify-between border-b border-[#191d20]/10 px-4 py-2 font-detail text-[9px] tracking-wider text-[#55595c]"><span>CLARIO / MASCOT</span><span>FIG. 01</span></div>
      <div className="flex flex-1 items-center justify-center">
        <svg viewBox="0 0 240 200" className="h-24 w-32 text-[#2f7fe2] opacity-65" fill="none" aria-hidden="true">
          <path d="M48 132c-10-20-9-39-1-54 9 14 21 23 38 25 0-14 4-28 14-38 12-12 32-16 48-9 16 6 26 22 25 39l25 10-26 13c-4 29-24 49-56 49-30 0-54-12-67-35Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 7" />
          <path d="M89 127c12 16 32 20 49 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="147" cy="83" r="3" fill="currentColor" />
        </svg>
      </div>
      <figcaption className="pb-2 text-center text-[9px] text-[#55595c]">Duck illustration placeholder</figcaption>
    </figure>
  );
}

function Water() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden sm:h-24" aria-hidden="true">
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="block h-full w-full motion-reduce:hidden">
        <defs><path id="clario-signup-wave" d="M0 64 Q180 0 360 64 T720 64 T1080 64 T1440 64 V160 H0Z" /></defs>
        <g fill="#6eaff8">
          <use href="#clario-signup-wave" /><use href="#clario-signup-wave" x="1440" />
          <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="22s" repeatCount="indefinite" />
        </g>
        <g transform="translate(0 32)"><g fill="#2d82ea">
          <use href="#clario-signup-wave" /><use href="#clario-signup-wave" x="1440" />
          <animateTransform attributeName="transform" type="translate" from="-1440 0" to="0 0" dur="15s" repeatCount="indefinite" />
        </g></g>
      </svg>
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="hidden h-full w-full motion-reduce:block">
        <path d="M0 64 Q180 0 360 64 T720 64 T1080 64 T1440 64 V160 H0Z" fill="#6eaff8" />
        <path d="M0 96 Q180 32 360 96 T720 96 T1080 96 T1440 96 V160 H0Z" fill="#2d82ea" />
      </svg>
    </div>
  );
}


