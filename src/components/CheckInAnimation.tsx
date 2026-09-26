import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '@/theme';

interface CheckInAnimationProps {
  visible: boolean;
  onComplete: () => void;
}

export function CheckInAnimation({ visible, onComplete }: CheckInAnimationProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <LottieView
        source={require('../../assets/animations/check-pop.json')}
        autoPlay
        loop={false}
        onAnimationFinish={onComplete}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 1000,
  },
  animation: {
    width: 200,
    height: 200,
  },
});
