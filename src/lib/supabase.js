import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://mfqeuohheozsahaugslg.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcWV1b2hoZW96c2FoYXVnc2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTc5NDYsImV4cCI6MjA2MTkzMzk0Nn0.aemxtVO8QsNFcboQjKCzUkBxw0D-Rx0c-0BiV2YV3Qg'

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
