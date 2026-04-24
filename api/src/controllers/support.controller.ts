import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import DeepSeekService from '../services/deepseek.service';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role to bypass RLS for backend-managed support flows
const supabase = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const handleSupportChat = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { message, conversationId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!message) return res.status(400).json({ error: 'Message is required' });

  if (!supabase) {
    console.error('[SupportChat] Supabase client not initialized. Missing SUPABASE_SERVICE_ROLE_KEY?');
    return res.status(500).json({ error: 'Support service is currently unavailable due to server configuration.' });
  }

  try {
    let currentConversationId = conversationId;

    // 1. If no conversationId, create a new one
    if (!currentConversationId) {
      const { data: conv, error: convError } = await supabase
        .from('support_conversations')
        .insert({ user_id: userId, status: 'active' })
        .select()
        .single();

      if (convError) throw convError;
      currentConversationId = conv.id;
    }

    // 2. Save user message
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      });

    if (msgError) throw msgError;

    // 3. Fetch recent history for DeepSeek context
    const { data: history, error: historyError } = await supabase
      .from('support_messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) throw historyError;

    // 4. Call DeepSeek
    const aiResponse = await DeepSeekService.generateChatResponse(
      history.map(m => ({ role: m.role, content: m.content }))
    );

    // 5. Save AI response
    const { error: aiMsgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse
      });

    if (aiMsgError) throw aiMsgError;

    // 6. Update conversation updated_at
    await supabase
      .from('support_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId);

    res.json({
      conversationId: currentConversationId,
      message: aiResponse
    });

  } catch (error: any) {
    console.error('[SupportChat] Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!supabase) {
    return res.json({ conversation: null, messages: [] });
  }

  try {
    // Get latest active conversation
    const { data: conv, error: convError } = await supabase
      .from('support_conversations')
      .select('id, status')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (convError) throw convError;
    if (!conv || conv.length === 0) return res.json({ conversation: null, messages: [] });

    const conversation = conv[0];

    // Get messages
    const { data: messages, error: msgsError } = await supabase
      .from('support_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (msgsError) throw msgsError;

    res.json({
      conversation,
      messages
    });
  } catch (error: any) {
    console.error('[GetChatHistory] Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
