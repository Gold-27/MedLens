import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import ExportSummary, { ExportSummaryProps } from './ExportSummary';
import { ThemeProvider } from '../theme/ThemeProvider';

export interface ExportCardRef {
  capture: () => Promise<string>;
}

interface ExportCardProps extends ExportSummaryProps {}

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
          <ExportSummary {...props} />
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
    width: 420, // Match ExportSummary width
    opacity: 0,
  },
  viewShot: {
    backgroundColor: '#ffffff',
  },
  cardWrapper: {
    backgroundColor: '#ffffff',
  },
});

export default ExportCard;
