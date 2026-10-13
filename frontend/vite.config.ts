import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../backend', import.meta.url)), '')
  const bypass = command === 'serve' && env.DEV_BYPASS_AUTH === 'true'
  return {
    define: {
      'import.meta.env.VITE_DEV_BYPASS_AUTH': JSON.stringify(String(bypass)),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:8000'),
    },
    plugins: [react(), tailwindcss(), {
      name: 'local-profile-testing',
      configureServer(server) {
        if (!bypass) return
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/__dev/profile') return next()
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          try {
            const address = req.socket.remoteAddress
            if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address ?? '') ||
                req.headers.origin && new URL(req.headers.origin).host !== req.headers.host || req.method !== 'GET') {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Local GET requests only' }))
              return
            }
            if (!env.DEV_USER_ID || !env.DEV_USER_EMAIL || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
              throw new Error('Missing dev profile configuration')
            }
            // The service key stays on this local server, never in the browser bundle.
            const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
              auth: { persistSession: false, autoRefreshToken: false },
            })
            const { data: profile, error } = await client.from('profiles')
              .select('id, display_name, preferred_language, starting_difficulty, weekly_interview_goal, assessment_completed, has_leetcode_experience, has_coding_experience, language_comfort, interview_confidence')
              .eq('id', env.DEV_USER_ID).single()
            if (error || !profile) throw new Error('Dev profile not available')
            res.end(JSON.stringify({ user: { id: env.DEV_USER_ID, email: env.DEV_USER_EMAIL }, profile }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Could not load the dev profile. Check backend/.env and Supabase connectivity.' }))
          }
        })
      },
    }],
  }
})
