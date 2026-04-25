import { supabase, getValidToken } from './supabase';
import { Config } from '../config';

export interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface SupportConversation {
  id: string;
  status: 'active' | 'waiting_for_user' | 'escalated' | 'resolved' | 'closed';
  updated_at: string;
}

export const SupportService = {
  /**
   * AI Chat Support
   */
  async sendChatMessage(message: string, conversationId?: string) {
    const token = await getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${Config.API_BASE_URL}/api/support/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message, conversationId })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      try {
        const error = JSON.parse(responseText);
        throw new Error(error.error || `Server error (${response.status})`);
      } catch (e) {
        throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`);
      }
    }

    try {
      return JSON.parse(responseText) as { conversationId: string; message: string };
    } catch (e) {
      console.error('[Support] JSON Parse Error:', e, 'Raw content:', responseText);
      throw new Error('Received invalid response from server');
    }
  },

  async getChatHistory() {
    const token = await getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${Config.API_BASE_URL}/api/support/chat/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const error = JSON.parse(responseText);
        throw new Error(error.error || `Server error (${response.status})`);
      } catch (e) {
        throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`);
      }
    }

    try {
      return JSON.parse(responseText) as { conversation: SupportConversation | null; messages: SupportMessage[] };
    } catch (e) {
      console.error('[Support] JSON Parse Error:', e, 'Raw content:', responseText);
      throw new Error('Received invalid response from server');
    }
  },

  async getSupportHistory() {
    const token = await getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${Config.API_BASE_URL}/api/support/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error('[SupportService] Failed to fetch history. Status:', response.status, 'Response:', responseText);
      throw new Error(`Failed to fetch support history: ${responseText.substring(0, 100)}`);
    }
    return JSON.parse(responseText) as { id: string; type: 'ai_chat'; subject: string; message: string; status: string; created_at: string; is_ai: boolean }[];
  },

  async getConversationMessages(conversationId: string) {
    const token = await getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${Config.API_BASE_URL}/api/support/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch conversation messages');
    return await response.json() as SupportMessage[];
  }
};
