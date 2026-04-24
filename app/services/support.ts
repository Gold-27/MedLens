import { supabase } from './supabase';

export interface SupportTicket {
  id?: string;
  user_id: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'closed';
  created_at?: string;
}

export const SupportService = {
  /**
   * Create a new support ticket in the support_table
   */
  async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('support_table')
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
      .from('support_table')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  }
};
