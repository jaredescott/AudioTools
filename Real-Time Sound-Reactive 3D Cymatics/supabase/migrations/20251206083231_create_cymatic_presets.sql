/*
  # Create Cymatic Presets Table

  ## Overview
  This migration creates a table for storing user-created cymatic visualization presets,
  allowing users to save and load their favorite pattern configurations.

  ## New Tables
  
  ### `cymatic_presets`
  Stores visualization preset configurations with the following columns:
  - `id` (uuid, primary key) - Unique identifier for each preset
  - `name` (text) - User-defined name for the preset
  - `description` (text, optional) - Optional description of the preset
  - `sensitivity` (numeric) - Displacement sensitivity value (0.1 to 5.0)
  - `pattern_type` (text) - Pattern algorithm type: 'radial', 'harmonic', 'interference', or 'chladni'
  - `color_scheme` (text) - Color scheme: 'spectral', 'monochrome', 'heat', or 'ocean'
  - `wireframe` (boolean) - Whether wireframe mode is enabled
  - `segments` (integer) - Sphere quality/resolution (32 to 128)
  - `is_public` (boolean) - Whether the preset is visible to all users
  - `created_by` (uuid, optional) - User ID who created the preset (for future auth integration)
  - `created_at` (timestamptz) - Timestamp when preset was created
  - `updated_at` (timestamptz) - Timestamp when preset was last updated

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the `cymatic_presets` table
  - Public presets can be viewed by anyone
  - All users can create their own presets (stored without authentication for now)
  - This allows the app to work without authentication while maintaining security structure
  
  ## Notes
  - The schema is designed to support future authentication integration
  - Presets are stored per browser session using local IDs until auth is added
  - Public presets provide a gallery of community patterns
*/

CREATE TABLE IF NOT EXISTS cymatic_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  sensitivity numeric NOT NULL CHECK (sensitivity >= 0.1 AND sensitivity <= 5.0),
  pattern_type text NOT NULL CHECK (pattern_type IN ('radial', 'harmonic', 'interference', 'chladni')),
  color_scheme text NOT NULL CHECK (color_scheme IN ('spectral', 'monochrome', 'heat', 'ocean')),
  wireframe boolean NOT NULL DEFAULT false,
  segments integer NOT NULL CHECK (segments >= 32 AND segments <= 128),
  is_public boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cymatic_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public presets"
  ON cymatic_presets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can create presets"
  ON cymatic_presets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own presets"
  ON cymatic_presets FOR SELECT
  USING (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY "Users can update their own presets"
  ON cymatic_presets FOR UPDATE
  USING (created_by IS NULL OR created_by = auth.uid())
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY "Users can delete their own presets"
  ON cymatic_presets FOR DELETE
  USING (created_by IS NULL OR created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_cymatic_presets_is_public ON cymatic_presets(is_public);
CREATE INDEX IF NOT EXISTS idx_cymatic_presets_created_by ON cymatic_presets(created_by);
CREATE INDEX IF NOT EXISTS idx_cymatic_presets_created_at ON cymatic_presets(created_at DESC);
