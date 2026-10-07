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

  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-[#F6EDD1] font-sans text-[#191d20] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#191d20] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#191d20]">
      {/* LOGO */}
      <Link
        to="/"
        className="absolute left-6 top-6 z-20 rounded-xl border border-white/90 bg-white/55 px-4 py-2 text-2xl font-semibold tracking-[-0.07em] shadow-[0_4px_24px_rgba(25,29,32,0.045)] backdrop-blur-xl sm:left-8"
      >
        CLARIO
      </Link>

      {/* MAIN PAGE */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center justify-center px-6 pb-32 pt-24 lg:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <section className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <DuckPlaceholder />

              <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl">
                Back in the
                <br />
                water.
              </h1>

              <p className="mt-6 max-w-sm text-sm leading-7 text-[#55595c] sm:text-base">
                Your next practice round is ready. Pick up right where you left
                off and keep paddling.
              </p>
            </div>
          </section>

          {/* LOGIN CARD */}
          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[470px] rounded-2xl border border-white/90 bg-white/65 p-8 shadow-[0_16px_48px_-16px_rgba(25,29,32,0.12)] backdrop-blur-xl sm:p-10">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-[#55595c]">
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
                    className="h-12 w-full rounded-lg border border-[#191d20]/15 bg-white/80 px-4 text-sm outline-none transition focus:border-[#3b8fe8] focus:ring-2 focus:ring-[#3b8fe8]/20 motion-reduce:transition-none"
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
                      className="text-xs font-medium text-[#2f7fe2] hover:underline"
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
                    className="h-12 w-full rounded-lg border border-[#191d20]/15 bg-white/80 px-4 text-sm outline-none transition focus:border-[#3b8fe8] focus:ring-2 focus:ring-[#3b8fe8]/20 motion-reduce:transition-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full cursor-pointer rounded-lg bg-[#3b8fe8] text-sm font-semibold text-[#121826] transition hover:bg-[#6eaff8] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
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
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#191d20]/15 bg-white/80 text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                <GoogleIcon />

                {googleLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>

              {/* GO TO SIGNUP */}
              <p className="mt-8 text-center text-xs text-[#55595c]">
                New to Clario?{" "}
                <Link
                  to="/Signup"
                  className="font-semibold text-[#2f7fe2] underline-offset-4 hover:underline"
                >
                  Sign up
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

/* ============================================
   GOOGLE ICON
============================================ */

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

/* ============================================
   DUCK
============================================ */

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

/* ============================================
   WATER
============================================ */

function Water() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden sm:h-24" aria-hidden="true">
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="block h-full w-full motion-reduce:hidden">
        <defs><path id="clario-login-wave" d="M0 64 Q180 0 360 64 T720 64 T1080 64 T1440 64 V160 H0Z" /></defs>
        <g fill="#6eaff8">
          <use href="#clario-login-wave" /><use href="#clario-login-wave" x="1440" />
          <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="22s" repeatCount="indefinite" />
        </g>
        <g transform="translate(0 32)"><g fill="#2d82ea">
          <use href="#clario-login-wave" /><use href="#clario-login-wave" x="1440" />
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

