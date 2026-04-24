-- Create support_conversations table
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'waiting_for_user', 'escalated', 'resolved', 'closed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_conversations
CREATE POLICY "Users can view their own conversations" 
ON support_conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON support_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON support_conversations FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for support_messages
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
