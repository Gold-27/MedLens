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

  console.log(`[SupportChat] Request received from user ${userId}. Message length: ${message.length}`);
  console.log(`[SupportChat] Conversation ID provided: ${conversationId || 'None (New)'}`);

  try {
    let currentConversationId = conversationId;

    // 1. If no conversationId, create a new one
    if (!currentConversationId) {
      console.log('[SupportChat] Creating new support conversation...');
      const { data: conv, error: convError } = await supabase
        .from('support_conversations')
        .insert({ user_id: userId, status: 'active' })
        .select()
        .single();

      if (convError) {
        console.error('[SupportChat] Failed to create conversation:', convError.message);
        throw convError;
      }
      currentConversationId = conv.id;
      console.log('[SupportChat] New conversation created:', currentConversationId);
    }

    // 2. Save user message
    console.log('[SupportChat] Saving user message to database...');
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      });

    if (msgError) {
      console.error('[SupportChat] Failed to save user message:', msgError.message);
      throw msgError;
    }
    console.log('[SupportChat] User message saved successfully.');

    // 3. Fetch recent history for DeepSeek context
    console.log('[SupportChat] Fetching message history for context...');
    const { data: history, error: historyError } = await supabase
      .from('support_messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('[SupportChat] Failed to fetch history:', historyError.message);
      throw historyError;
    }
    console.log(`[SupportChat] Fetched ${history.length} messages for context.`);

    // 4. Call DeepSeek
    console.log('[SupportChat] Calling DeepSeek API...');
    const aiResponse = await DeepSeekService.generateChatResponse(
      history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    );
    console.log('[SupportChat] AI response received. Length:', aiResponse.length);

    // 5. Save AI response
    console.log('[SupportChat] Saving AI response to database...');
    const { error: aiMsgError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse
      });

    if (aiMsgError) {
      console.error('[SupportChat] Failed to save AI response:', aiMsgError.message);
      throw aiMsgError;
    }
    console.log('[SupportChat] AI response saved successfully.');

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
    console.error('[GetChatHistory] Critical error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
