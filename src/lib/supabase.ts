import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://xwfjmjkywdrkyzlhxtyr.supabase.co'

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_RU23EsBOMIsoZtdU9m99og_gvSjXWxx'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
