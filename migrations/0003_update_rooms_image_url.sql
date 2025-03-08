ALTER TABLE rooms
  DROP COLUMN IF EXISTS generated_image_url;

ALTER TABLE rooms
  ADD COLUMN transformed_image_url TEXT NOT NULL;