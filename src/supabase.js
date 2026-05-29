import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lcdcsdhqldnzwaqcpqlp.supabase.co'
const supabaseKey = 'sb_publishable_bWVXUwk_SFmt9DbVMedvKQ_uHr9SrcI'

export const supabase = createClient(supabaseUrl, supabaseKey)