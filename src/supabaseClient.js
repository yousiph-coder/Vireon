import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://apfzvumnhbihddqsmfvj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vCCRiz6ac_4QjhmcZSeTWQ_P2X9BWwL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
