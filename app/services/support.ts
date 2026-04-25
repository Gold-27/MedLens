import { supabase } from './supabase';
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

export interface SupportTicket {
  id?: string;
  user_id: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-review' | 'viewed' | 'resolved' | 'closed';
  created_at?: string;
}

export const SupportService = {
  /**
   * Create a new support ticket in the support_table
   */
  async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          ...ticket,
          status: 'open',
        }
      ])
      .select();

    return { data: data ? data[0] : null, error };
  },

  /**
   * Fetch tickets for the authenticated user
   */
  async getMyTickets() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * AI Chat Support
   */
  async sendChatMessage(message: string, conversationId?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${Config.API_BASE_URL}/api/support/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${Config.API_BASE_URL}/api/support/chat/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
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
  }
};
