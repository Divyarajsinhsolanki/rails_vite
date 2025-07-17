import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://akxufgnyqgfgpgrnzrkz.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreHVmZ255cWdmZ3Bncm56cmt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjczNTkzMSwiZXhwIjoyMDY4MzExOTMxfQ.ekRDJFgVUPZAtaXF8wkY7yytTXfYi3sOUlfYMG_7H_8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
