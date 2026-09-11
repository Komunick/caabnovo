ALTER TABLE member ADD COLUMN photo_file_id uuid REFERENCES stored_file(id);
