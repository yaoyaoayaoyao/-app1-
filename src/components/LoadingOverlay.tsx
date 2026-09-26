import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, Text } from 'react-native';
import { colors } from '@/theme';
import { Mascot } from './Mascot';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Mascot size={80} expression="happy" animated={true} />
          {message && <Text style={styles.message}>{message}</Text>}
          <ActivityIndicator color={colors.primary} style={styles.indicator} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', elevation: 4 },
  message: { color: colors.textSecondary, fontSize: 14, marginTop: 12 },
  indicator: { marginTop: 12 },
});
