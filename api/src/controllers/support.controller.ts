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
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

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
    } else {
      // Verify that this conversation belongs to the user
      const { data: existingConv, error: checkError } = await supabase
        .from('support_conversations')
        .select('user_id, updated_at, created_at')
        .eq('id', currentConversationId)
        .single();

      if (checkError || !existingConv) {
        console.warn(`[SupportChat] Conversation ${currentConversationId} not found or error:`, checkError?.message);
        return res.status(404).json({ error: 'Conversation not found' });
      }

      if (existingConv.user_id !== userId) {
        console.warn(`[SupportChat] Security Violation: User ${userId} tried to access Conversation ${currentConversationId} belonging to ${existingConv.user_id}`);
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Check if expired (>1h)
      const updatedAt = new Date(existingConv.updated_at || existingConv.created_at).getTime();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - updatedAt > oneHour) {
        console.log(`[SupportChat] Conversation ${currentConversationId} expired (>1h). Creating new support conversation...`);
        const { data: conv, error: convError } = await supabase
          .from('support_conversations')
          .insert({ user_id: userId, status: 'active' })
          .select()
          .single();

        if (convError) {
          console.error('[SupportChat] Failed to create new conversation:', convError.message);
          throw convError;
        }
        currentConversationId = conv.id;
      }
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
      .select('id, status, updated_at, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (convError) throw convError;
    if (!conv || conv.length === 0) return res.json({ conversation: null, messages: [] });

    const conversation = conv[0];

    // Check if conversation is older than 1 hour
    const updatedAt = new Date(conversation.updated_at || conversation.created_at).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (now - updatedAt > oneHour) {
      console.log(`[GetChatHistory] Conversation ${conversation.id} expired (>1h).`);
      // Optionally mark as closed in DB
      await supabase
        .from('support_conversations')
        .update({ status: 'closed' })
        .eq('id', conversation.id);
        
      return res.json({ conversation: null, messages: [] });
    }

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

export const getSupportHistory = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!supabase) {
    return res.json([]);
  }

  try {
    // 1. Fetch support_conversations
    const { data: convs, error: convsError } = await supabase
      .from('support_conversations')
      .select('id, status, updated_at, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (convsError) throw convsError;

    const conversationsWithLastMsg = await Promise.all(convs.map(async (conv) => {
      const { data: msgs, error: msgsError } = await supabase
        .from('support_messages')
        .select('content, role')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        id: conv.id,
        type: 'ai_chat',
        subject: 'Support Chat with AI',
        message: msgs && msgs.length > 0 ? msgs[0].content : 'No messages yet',
        status: conv.status,
        created_at: conv.updated_at || conv.created_at,
        is_ai: true
      };
    }));

    // 2. Sort
    const mergedHistory = conversationsWithLastMsg.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(mergedHistory);
  } catch (error: any) {
    console.error('[GetSupportHistory] Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { conversationId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!conversationId) return res.status(400).json({ error: 'Conversation ID is required' });

  if (!supabase) return res.status(500).json({ error: 'Database not available' });

  try {
    // Verify ownership
    const { data: conv, error: convError } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conv) return res.status(404).json({ error: 'Conversation not found' });

    const { data: messages, error: msgsError } = await supabase
      .from('support_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgsError) throw msgsError;
 
     res.json(messages);
   } catch (error: any) {
     console.error('[GetConversationMessages] Error:', error.message);
     res.status(500).json({ error: 'Internal server error' });
   }
 };
 
 export const clearSupportHistory = async (req: Request, res: Response) => {
   const userId = (req as any).userId;
   if (!userId) return res.status(401).json({ error: 'Unauthorized' });
 
   if (!supabase) return res.status(500).json({ error: 'Database not available' });
 
   try {
     const { data: convs, error: convsError } = await supabase
       .from('support_conversations')
       .select('id')
       .eq('user_id', userId);
 
     if (convsError) throw convsError;
 
     if (convs && convs.length > 0) {
       const convIds = convs.map(c => c.id);
 
       const { error: msgsError } = await supabase
         .from('support_messages')
         .delete()
         .in('conversation_id', convIds);
 
       if (msgsError) throw msgsError;
 
       const { error: delConvsError } = await supabase
         .from('support_conversations')
         .delete()
         .in('id', convIds);
 
       if (delConvsError) throw delConvsError;
     }
 
     res.json({ success: true });
   } catch (error: any) {
     console.error('[ClearSupportHistory] Error:', error.message);
     res.status(500).json({ error: 'Internal server error' });
   }
 };
