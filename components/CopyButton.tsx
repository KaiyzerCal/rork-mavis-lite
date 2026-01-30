import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Copy, Check } from 'lucide-react-native';
import { copyToClipboard } from '@/lib/clipboard';

interface CopyButtonProps {
  text: string;
  size?: number;
  color?: string;
  onCopy?: () => void;
}

export default function CopyButton({ text, size = 18, color = '#6366f1', onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      onCopy?.();
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <TouchableOpacity onPress={handleCopy} style={styles.button} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {copied ? (
          <Check size={size} color="#10b981" strokeWidth={2.5} />
        ) : (
          <Copy size={size} color={color} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
