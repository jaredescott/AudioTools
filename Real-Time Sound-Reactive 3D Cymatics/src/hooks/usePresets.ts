import { useState, useCallback, useEffect } from 'react';
import { supabase, CymaticPreset } from '../lib/supabase';

export const usePresets = () => {
  const [presets, setPresets] = useState<CymaticPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cymatic_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPresets(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets';
      setError(errorMessage);
      console.error('Error loading presets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const savePreset = useCallback(async (preset: Omit<CymaticPreset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('cymatic_presets')
        .insert([preset])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      if (data) {
        setPresets((prev) => [data, ...prev]);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset';
      setError(errorMessage);
      console.error('Error saving preset:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('cymatic_presets')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(errorMessage);
      console.error('Error deleting preset:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPublicPresets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cymatic_presets')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPresets(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load public presets';
      setError(errorMessage);
      console.error('Error loading public presets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return {
    presets,
    loading,
    error,
    loadPresets,
    savePreset,
    deletePreset,
    loadPublicPresets,
  };
};
