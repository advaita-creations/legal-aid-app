-- Add mobile column to waitlist table for collecting phone numbers
ALTER TABLE IF EXISTS waitlist ADD COLUMN IF NOT EXISTS mobile text;
