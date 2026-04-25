-- MedQuire Initial Schema
-- Based on database_schema.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- Note: Supabase Auth automatically creates a users table in auth schema
-- We'll create a public profile table if needed, but for now we rely on auth.users

-- Cabinet Items table
CREATE TABLE IF NOT EXISTS cabinet_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  drug_key TEXT NOT NULL,
  source TEXT DEFAULT 'OpenFDA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint to prevent duplicate saves for same user and drug
  UNIQUE(user_id, drug_key),
  
  -- Ensure drug_name and drug_key are not empty
  CONSTRAINT drug_name_not_empty CHECK (drug_name <> ''),
  CONSTRAINT drug_key_not_empty CHECK (drug_key <> '')
);

-- Indexes for performance
CREATE INDEX idx_cabinet_items_user_id ON cabinet_items(user_id);
CREATE INDEX idx_cabinet_items_drug_key ON cabinet_items(drug_key);
CREATE INDEX idx_cabinet_items_created_at ON cabinet_items(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE cabinet_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. SELECT: Users can only see their own cabinet items
CREATE POLICY "Users can view own cabinet items" 
  ON cabinet_items FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. INSERT: Users can insert their own cabinet items
CREATE POLICY "Users can insert own cabinet items" 
  ON cabinet_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. DELETE: Users can delete their own cabinet items (Hard Delete)
CREATE POLICY "Users can delete own cabinet items" 
  ON cabinet_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_cabinet_items_updated_at
  BEFORE UPDATE ON cabinet_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  