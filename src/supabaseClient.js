
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaynxcgnbwivxmkkkpqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheW54Y2duYndpdnhta2trcHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDkyMTMsImV4cCI6MjA2MDQ4NTIxM30.7SS7iuTet6bdsCnYtmRlqEMc4DzzAzJfShNVVMrBnyo';

export const supabase = createClient(supabaseUrl, supabaseKey);
