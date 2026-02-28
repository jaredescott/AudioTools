import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const hasSupabase = supabase !== null;

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
