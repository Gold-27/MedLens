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
import { SupportService, SupportTicket } from '../services/support';
import ChatSupport from './ChatSupport';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestTicket, setLatestTicket] = useState<SupportTicket | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await SupportService.getMyTickets();
      if (!error && data && data.length > 0) {
        setLatestTicket(data[0] as SupportTicket);
        setShowForm(false);
      } else {
        setLatestTicket(null);
        setShowForm(true);
      }
    } catch (error) {
      console.error('[Support] Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      fetchHistory();
      setSubject('');
      setMessage('');
    }
  }, [visible, fetchHistory]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please provide both a subject and a message.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'You must be signed in to submit a support ticket.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await SupportService.createTicket({
        user_id: user.id,
        email: user.email || '',
        subject: subject.trim(),
        message: message.trim(),
      });

      if (error) {
        throw error;
      }

      if (data) {
        setLatestTicket(data as SupportTicket);
        setShowForm(false);
      }
    } catch (error: any) {
      console.error('[Support] Submission failed:', error);
      Alert.alert('Submission Error', error.message || 'Failed to send support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return theme.colors.primary;
      case 'in-review': return theme.colors.accent;
      case 'viewed': return theme.colors.tertiary;
      case 'resolved': return theme.colors.success;
      case 'closed': return theme.colors.outline;
      default: return theme.colors.outline;
    }
  };

  const getStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in-review': return 'In Review';
      case 'viewed': return 'Viewed';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const renderStatusBadge = (status: SupportTicket['status']) => {
    const color = getStatusColor(status);
    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '20', borderColor: color }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusBadgeText, { color }]}>{getStatusText(status)}</Text>
      </View>
    );
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>Subject</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerLow }]}
          value={subject}
          onChangeText={setSubject}
          placeholder="What do you need help with?"
          placeholderTextColor={theme.colors.outlineVariant}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>Message</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerLow }
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us more about your issue..."
          placeholderTextColor={theme.colors.outlineVariant}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="send" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Send Support Ticket</Text>
          </>
        )}
      </TouchableOpacity>
      
      {latestTicket && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setShowForm(false)}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTrackingView = () => {
    if (!latestTicket) return null;

    const isActive = ['open', 'in-review', 'viewed'].includes(latestTicket.status);
    const date = new Date(latestTicket.created_at || '').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.trackingContainer}>
        <View style={[styles.infoBanner, { backgroundColor: isActive ? theme.colors.primaryContainer : theme.colors.surfaceContainerHigh }]}>
          <Ionicons 
            name={isActive ? "time-outline" : "checkmark-done-circle-outline"} 
            size={24} 
            color={isActive ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant} 
          />
          <Text style={[styles.infoBannerText, { color: isActive ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }]}>
            {isActive 
              ? 'Your support request is currently being reviewed.' 
              : 'This support request has been completed.'}
          </Text>
        </View>

        <View style={[styles.ticketCard, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.ticketCardHeader}>
            {renderStatusBadge(latestTicket.status)}
            <Text style={[styles.ticketDate, { color: theme.colors.onSurfaceVariant }]}>{date}</Text>
          </View>

          <Text style={[styles.ticketSubject, { color: theme.colors.onSurface }]}>{latestTicket.subject}</Text>
          <View style={[styles.ticketDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <Text style={[styles.ticketMessage, { color: theme.colors.onSurfaceVariant }]}>{latestTicket.message}</Text>
        </View>

        <TouchableOpacity
          style={[styles.sendAnotherButton, { borderColor: theme.colors.primary, borderWidth: 2 }]}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sendAnotherButtonText, { color: theme.colors.primary }]}>Send Another Support Ticket</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
              <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {showForm ? 'Send us a message' : 'Ticket Tracking'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={[styles.tabBar, { borderBottomColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'chat' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => setActiveTab('chat')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'chat' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>AI Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'tickets' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => setActiveTab('tickets')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'tickets' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Ticket History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentArea}>
            {activeTab === 'chat' ? (
              <ChatSupport onEscalate={() => {
                setActiveTab('tickets');
                setShowForm(true);
              }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {isLoadingHistory ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Loading your tickets...</Text>
                  </View>
                ) : (
                  showForm ? renderForm() : renderTrackingView()
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
    padding: 24,
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
    marginBottom: 24,
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
    borderBottomWidth: 1,
    marginBottom: 12,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginHorizontal: -24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
    gap: 24,
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
    fontWeight: '600',
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
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
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
});

export default SupportModal;
