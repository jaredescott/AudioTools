/*
  # Goniometer Measurements Schema

  1. New Tables
    - `measurements`
      - `id` (uuid, primary key) - Unique identifier for each measurement
      - `angle` (numeric) - The measured angle in degrees
      - `joint_name` (text) - Name of the joint being measured (e.g., "Knee", "Elbow", "Shoulder")
      - `side` (text) - Body side ("Left" or "Right")
      - `notes` (text, optional) - Additional notes about the measurement
      - `created_at` (timestamptz) - Timestamp when measurement was taken

  2. Security
    - Enable RLS on `measurements` table
    - Add policy for anyone to insert measurements (public access for demo)
    - Add policy for anyone to view measurements (public access for demo)

  Note: For production use, you would want to add user authentication and restrict
  access to only the user's own measurements.
*/

CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  angle numeric NOT NULL,
  joint_name text NOT NULL DEFAULT '',
  side text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert measurements"
  ON measurements
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public to view measurements"
  ON measurements
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public to delete measurements"
  ON measurements
  FOR DELETE
  TO anon
  USING (true);