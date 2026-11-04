import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

export default defineConfig(({ command, mode }) => {
  const frontendEnv = loadEnv(mode, process.cwd(), "");
  const env = loadEnv(
    mode,
    fileURLToPath(new URL("../backend", import.meta.url)),
    "",
  );
  const bypass =
    command === "serve" && frontendEnv.VITE_DEV_BYPASS_AUTH === "true";
  const supabaseUrl =
    frontendEnv.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabasePublishableKey =
    frontendEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY;
  return {
    server: {
      host: "127.0.0.1",
      proxy: {
        "/voice": env.API_BASE_URL || "http://127.0.0.1:8000",
        "/run": env.API_BASE_URL || "http://127.0.0.1:8000",

        "/api": {
          target: env.API_BASE_URL || "http://127.0.0.1:8000",
          changeOrigin: true,

          configure(proxy) {
            proxy.on("proxyReq", (proxyReq, req) => {
              const path = req.url?.split("?")[0];

              if (
                !bypass ||
                path !== "/api/voice/system-design-session" ||
                req.method !== "GET"
              ) {
                return;
              }

              const address = req.socket.remoteAddress;
              const allowedAddresses = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

              const host = req.headers.host ?? "";
              const allowedHosts = ["localhost:5173", "127.0.0.1:5173"];

              const origin = req.headers.origin;
              const fetchSite = req.headers["sec-fetch-site"];

              if (
                !allowedAddresses.includes(address ?? "") ||
                !allowedHosts.includes(host) ||
                (origin !== undefined && origin !== `http://${host}`) ||
                (fetchSite !== undefined &&
                  fetchSite !== "same-origin" &&
                  fetchSite !== "none") ||
                !env.DEV_SESSION_SECRET ||
                !env.DEV_USER_ID
              ) {
                return;
              }

              const now = Math.floor(Date.now() / 1000);

              const encode = (value: object) =>
                Buffer.from(JSON.stringify(value)).toString("base64url");

              const header = encode({ alg: "HS256", typ: "JWT" });

              const payload = encode({
                sub: env.DEV_USER_ID,
                email: env.DEV_USER_EMAIL,
                iss: "clario-local-vite",
                aud: "clario-dev",
                iat: now,
                exp: now + 60,
              });

              const message = `${header}.${payload}`;

              const signature = createHmac("sha256", env.DEV_SESSION_SECRET)
                .update(message)
                .digest("base64url");

              proxyReq.setHeader(
                "Authorization",
                `Bearer ${message}.${signature}`,
              );
            });
          },
        },
      },
    },
    define: {
      "import.meta.env.VITE_DEV_BYPASS_AUTH": JSON.stringify(String(bypass)),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl || ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        supabasePublishableKey || "",
      ),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "local-profile-testing",
        configureServer(server) {
          if (!bypass) return;
          server.middlewares.use(async (req, res, next) => {
            const path = req.url?.split("?")[0];

            if (path !== "/__dev/profile") return next();

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");
            try {
              const address = req.socket.remoteAddress;
              if (
                !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
                  address ?? "",
                ) ||
                (req.headers.origin &&
                  new URL(req.headers.origin).host !== req.headers.host) ||
                req.method !== "GET"
              ) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: "Local GET requests only" }));
                return;
              }
              if (
                !env.DEV_USER_ID ||
                !env.DEV_USER_EMAIL ||
                !env.SUPABASE_URL ||
                !env.SUPABASE_SERVICE_ROLE_KEY
              ) {
                throw new Error("Missing dev profile configuration");
              }
              // The service key stays on this local server, never in the browser bundle.
              const client = createClient(
                env.SUPABASE_URL,
                env.SUPABASE_SERVICE_ROLE_KEY,
                {
                  auth: { persistSession: false, autoRefreshToken: false },
                },
              );
              const { data: profile, error } = await client
                .from("profiles")
                .select(
                  "id, display_name, preferred_language, starting_difficulty, weekly_interview_goal, assessment_completed, has_leetcode_experience, has_coding_experience, language_comfort, interview_confidence",
                )
                .eq("id", env.DEV_USER_ID)
                .single();
              if (error || !profile)
                throw new Error("Dev profile not available");
              res.end(
                JSON.stringify({
                  user: { id: env.DEV_USER_ID, email: env.DEV_USER_EMAIL },
                  profile,
                }),
              );
            } catch {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error:
                    "Could not load the dev profile. Check backend/.env and Supabase connectivity.",
                }),
              );
            }
          });
        },
      },
    ],
  };
});
