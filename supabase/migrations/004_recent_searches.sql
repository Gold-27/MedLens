-- MedQuire Recent Searches Schema

CREATE TABLE IF NOT EXISTS recent_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate saves for same user and query
  UNIQUE(user_id, query)
);

-- Indexes for performance
CREATE INDEX idx_recent_searches_user_id ON recent_searches(user_id);
CREATE INDEX idx_recent_searches_created_at ON recent_searches(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. SELECT: Users can only see their own recent searches
CREATE POLICY "Users can view own recent searches" 
  ON recent_searches FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. INSERT: Users can insert their own recent searches
CREATE POLICY "Users can insert own recent searches" 
  ON recent_searches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own recent searches (for updating timestamps)
CREATE POLICY "Users can update own recent searches" 
  ON recent_searches FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own recent searches
CREATE POLICY "Users can delete own recent searches" 
  ON recent_searches FOR DELETE 
  USING (auth.uid() = user_id);
