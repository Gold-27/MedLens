-- 1. Create support_messages table (Fixes Chat errors)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create support_tickets table (Fixes Ticket Submission errors)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in-review', 'viewed', 'resolved', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

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

-- 5. Policies for support_tickets
CREATE POLICY "Users can view their own tickets" 
ON support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" 
ON support_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);
