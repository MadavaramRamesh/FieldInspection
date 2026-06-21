import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface LabelModalProps {
  visible: boolean;
  photoUri: string;
  onSave: (label: string) => void;
  onDiscard: () => void;
}

export default function LabelModal({
  visible,
  photoUri,
  onSave,
  onDiscard,
}: LabelModalProps) {
  const [label, setLabel] = useState('');

  const isLabelEmpty = label.trim() === '';

  const handleSave = () => {
    if (!isLabelEmpty) {
      onSave(label);
      setLabel('');
    }
  };

  const handleDiscard = () => {
    setLabel('');
    onDiscard();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <Image source={{ uri: photoUri }} style={styles.thumbnail} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Front tyre, Engine bay"
            value={label}
            onChangeText={setLabel}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isLabelEmpty && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLabelEmpty}
            >
              <Text
                style={[
                  styles.buttonText,
                  isLabelEmpty && styles.buttonTextDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleDiscard}>
              <Text style={styles.buttonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999',
  },
});
