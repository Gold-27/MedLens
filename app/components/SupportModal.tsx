import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { SupportService } from '../services/support';
import ChatSupport from './ChatSupport';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

interface HistoryItem {
  id?: string;
  type: 'ai_chat';
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryItem | null>(null);
  const [viewingMessages, setViewingMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatAutoFocus, setChatAutoFocus] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const data = await SupportService.getSupportHistory();
      setHistory(data as any as HistoryItem[]);

    } catch (error) {
      console.error('[Support] Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear your chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await SupportService.clearSupportHistory();
            } catch (err) {
              console.error('[Support] Failed to clear history:', err);
            }
            setHistory([]);
            setViewingHistoryItem(null);
            setViewingMessages([]);
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      fetchHistory();

    }
  }, [visible, fetchHistory]);



  const renderStatusBadge = (status: string) => {
    let color: any = theme.colors.outline;
    let text = status;

    switch (status) {
      case 'active': color = theme.colors.primary; text = 'Active'; break;
      case 'resolved': color = theme.colors.success; text = 'Resolved'; break;
      case 'closed': color = theme.colors.outline; text = 'Ended'; break;
      case 'escalated': color = theme.colors.error; text = 'Escalated'; break;
      default: color = theme.colors.outline; text = status;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '20', borderColor: color }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusBadgeText, { color }]}>{text}</Text>
      </View>
    );
  };



  const handleViewHistoryItem = async (item: any) => {
    setViewingHistoryItem(item);
    if (item.type === 'ai_chat') {
      setIsLoadingMessages(true);
      try {
        const msgs = await SupportService.getConversationMessages(item.id);
        setViewingMessages(msgs);
      } catch (err) {
        console.error('[Support] Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };

  const renderHistoryDetail = () => {
    if (!viewingHistoryItem) return null;

    const date = new Date(viewingHistoryItem.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
      <View style={styles.trackingContainer}>
        <TouchableOpacity 
          style={styles.backToHistory} 
          onPress={() => {
            setViewingHistoryItem(null);
            setViewingMessages([]);
          }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={[styles.backToHistoryText, { color: theme.colors.primary }]}>Back to History</Text>
        </TouchableOpacity>

        <View style={[styles.ticketCard, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.ticketCardHeader}>
            {renderStatusBadge(viewingHistoryItem.status)}
            <Text style={[styles.ticketDate, { color: theme.colors.onSurfaceVariant }]}>{date}</Text>
          </View>
          <Text style={[styles.ticketSubject, { color: theme.colors.onSurface }]}>{viewingHistoryItem.subject}</Text>
          <View style={[styles.ticketDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          
          <View style={styles.chatPreviewList}>
            {isLoadingMessages ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              viewingMessages.map((m, i) => (
                <View key={m.id || i} style={[styles.miniMessage, m.role === 'user' ? styles.miniUser : styles.miniAssistant]}>
                  <Text style={[styles.miniMessageText, { color: m.role === 'user' ? theme.colors.onPrimary : theme.colors.onSurface }]}>
                    {m.content}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryList = () => (
    <View style={styles.historyList}>
      {history.map((item) => (
        <TouchableOpacity 
          key={item.id} 
          style={[styles.historyItem, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}
          onPress={() => handleViewHistoryItem(item)}
        >
          <View style={styles.historyItemHeader}>
            <View style={styles.historyTypeIcon}>
              <Ionicons 
                name="sparkles" 
                size={16} 
                color={theme.colors.primary} 
              />
            </View>
            <Text style={[styles.historyDate, { color: theme.colors.onSurfaceVariant }]}>
              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          <Text style={[styles.historySubject, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {item.subject}
          </Text>
          <Text style={[styles.historyPreview, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
            {item.message}
          </Text>
          
          <View style={styles.historyItemFooter}>
            {renderStatusBadge(item.status)}
            <Ionicons name="chevron-forward" size={16} color={theme.colors.outline} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Support</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={[styles.tabBar, { borderBottomColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'chat' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => {
                setActiveTab('chat');
                // Don't auto-focus if manually switching
                setChatAutoFocus(false);
              }}
            >
              <Text style={[styles.tabText, { color: activeTab === 'chat' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>AI Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'history' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => {
                setActiveTab('history');
                setChatAutoFocus(false);
              }}
            >
              <Text style={[styles.tabText, { color: activeTab === 'history' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Chat History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentArea}>
            {activeTab === 'chat' ? (
              <ChatSupport 
                autoFocus={chatAutoFocus}
              />
            ) : (
              <View style={{ flex: 1 }}>
                {history.length > 0 && !viewingHistoryItem && !isLoadingHistory && (
                  <TouchableOpacity 
                    style={[styles.clearHistoryBtn, { backgroundColor: theme.colors.surfaceContainerHigh }]} 
                    onPress={handleClearHistory}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                    <Text style={[styles.clearHistoryBtnText, { color: theme.colors.error }]}>Clear History</Text>
                  </TouchableOpacity>
                )}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {isLoadingHistory ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Loading support history...</Text>
                  </View>
                ) : (
                  viewingHistoryItem ? renderHistoryDetail() : (
                    history.length > 0 ? renderHistoryList() : (
                      <View style={styles.emptyTicketsContainer}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                          <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text style={[styles.emptyTicketsTitle, { color: theme.colors.onSurface }]}>No Chat History</Text>
                        <Text style={[styles.emptyTicketsSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                          Your past AI chats will appear here once you've started a conversation with our assistant.
                        </Text>
                        <TouchableOpacity 
                          style={[styles.startChatBtn, { backgroundColor: theme.colors.primary }]}
                          onPress={() => {
                            setChatAutoFocus(true);
                            setActiveTab('chat');
                          }}
                        >
                          <Text style={styles.startChatBtnText}>Start AI Support Chat</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: 'Outfit',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Outfit',
  },
  closeButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  formContainer: {
    gap: 16,
    paddingTop: 8,
  },
  trackingContainer: {
    gap: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoBannerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Outfit',
    lineHeight: 20,
  },
  ticketCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  ticketDivider: {
    height: 1,
    width: '100%',
    opacity: 0.3,
  },
  ticketMessage: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Outfit',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: 'Outfit',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  textArea: {
    height: 160,
    paddingTop: 16,
    paddingBottom: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  sendAnotherButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  sendAnotherButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  historyList: {
    gap: 12,
    paddingTop: 4,
  },
  historyItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  historySubject: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  historyPreview: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Outfit',
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  backToHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  backToHistoryText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  chatPreviewList: {
    gap: 12,
    paddingTop: 8,
  },
  miniMessage: {
    maxWidth: '85%',
    padding: 10,
    borderRadius: 14,
  },
  miniUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF', // Fallback color
    borderBottomRightRadius: 2,
  },
  miniAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderBottomLeftRadius: 2,
  },
  miniMessageText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Outfit',
  },
  emptyTicketsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTicketsTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Outfit',
    marginBottom: 12,
  },
  emptyTicketsSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Outfit',
    lineHeight: 22,
    marginBottom: 32,
  },
  startChatBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  startChatBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
});

export default SupportModal;
