-- 1. Create support_messages table (Fixes Chat errors)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for support_messages
CREATE POLICY "Users can view messages from their conversations" 
ON support_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = support_messages.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages into their conversations" 
ON support_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = support_messages.conversation_id AND user_id = auth.uid()
  )
);

