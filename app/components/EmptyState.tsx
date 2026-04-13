import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type EmptyStateType = 'initial' | 'not_found' | 'error' | 'offline' | 'empty_cabinet';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  subtitle,
  onRetry,
  onAction,
  actionLabel,
}) => {
  const theme = useTheme();

  const config = {
    initial: {
      icon: '💊',
      defaultTitle: 'Search for a medication to get started',
      defaultSubtitle: 'Try "ibuprofen" or "atorvastatin"',
      showAction: false,
    },
    not_found: {
      icon: '🔍',
      defaultTitle: 'We couldn\'t find this medication',
      defaultSubtitle: 'Check the spelling or try another name',
      showAction: true,
      actionLabel: 'Try Again',
    },
    error: {
      icon: '⚠️',
      defaultTitle: 'Something went wrong',
      defaultSubtitle: 'Please check your connection and try again',
      showAction: true,
      actionLabel: 'Retry',
    },
    offline: {
      icon: '📶',
      defaultTitle: 'You\'re offline',
      defaultSubtitle: 'Connect to the internet to search for medications',
      showAction: false,
    },
    empty_cabinet: {
      icon: '📁',
      defaultTitle: 'Your cabinet is empty',
      defaultSubtitle: 'Save medications from search results to see them here',
      showAction: false,
    },
  }[type];

  const handleAction = () => {
    if (type === 'error' || type === 'not_found') {
      if (onRetry) onRetry();
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {title || config.defaultTitle}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        {subtitle || config.defaultSubtitle}
      </Text>

      {config.showAction && (onRetry || onAction) && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAction}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
            {actionLabel || config.actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 160,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmptyState;