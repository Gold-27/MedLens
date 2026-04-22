import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import SummaryCard, { SummaryCardProps } from './SummaryCard';
import { ThemeProvider } from '../theme/ThemeProvider';

export interface ExportCardRef {
  capture: () => Promise<string>;
}

interface ExportCardProps extends Omit<SummaryCardProps, 'onSave' | 'onExport' | 'onClose'> {}

const ExportCard = forwardRef<ExportCardRef, ExportCardProps>((props, ref) => {
  const viewShotRef = useRef<ViewShot>(null);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot not initialized');
      }
      return await viewShotRef.current.capture();
    },
  }));

  return (
    <View style={styles.offscreenContainer}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.95 }}
        style={styles.viewShot}
      >
        <View style={styles.cardWrapper}>
          <SummaryCard
            {...props}
            isExporting={true}
          />
        </View>
      </ViewShot>
    </View>
  );
});

const styles = StyleSheet.create({
  offscreenContainer: {
    position: 'absolute',
    left: -Dimensions.get('window').width * 2, // Way off screen
    top: 0,
    width: Dimensions.get('window').width,
    opacity: 0,
  },
  viewShot: {
    backgroundColor: 'transparent',
  },
  cardWrapper: {
    padding: 10,
    backgroundColor: '#0F172A', // Match background for better edges
  },
});

export default ExportCard;
