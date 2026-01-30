import * as Clipboard from 'expo-clipboard';
import { Alert, Platform } from 'react-native';

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== 'web') {
      Alert.alert('✓ Copied', 'Text copied to clipboard');
    }
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    Alert.alert('Error', 'Failed to copy to clipboard');
    return false;
  }
};

export const pasteFromClipboard = async (): Promise<string | null> => {
  try {
    const text = await Clipboard.getStringAsync();
    return text || null;
  } catch (error) {
    console.error('Failed to paste:', error);
    return null;
  }
};

export const hasClipboardString = async (): Promise<boolean> => {
  try {
    return await Clipboard.hasStringAsync();
  } catch (error) {
    console.error('Failed to check clipboard:', error);
    return false;
  }
};
