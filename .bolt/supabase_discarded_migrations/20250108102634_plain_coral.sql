/*
  # Insert sales representatives

  1. Data
    - Insert initial sales representatives with their codes
    - Use ON CONFLICT to handle duplicates gracefully
*/

INSERT INTO sales_reps (id, name, code) VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'IKH', 'IKH'),
  ('550e8400-e29b-41d4-a716-446655440000', 'BVI', 'BVI'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'GMA', 'GMA'),
  ('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'TSA', 'TSA'),
  ('6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'EPO', 'EPO'),
  ('6ba7b813-9dad-11d1-80b4-00c04fd430c8', 'BCI', 'BCI'),
  ('6ba7b814-9dad-11d1-80b4-00c04fd430c8', 'VIE', 'VIE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code;