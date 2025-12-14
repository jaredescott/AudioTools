import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CymaticPreset {
  id?: string;
  name: string;
  description?: string;
  sensitivity: number;
  pattern_type: 'radial' | 'harmonic' | 'interference' | 'chladni';
  color_scheme: 'spectral' | 'monochrome' | 'heat' | 'ocean';
  wireframe: boolean;
  segments: number;
  is_public: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}
