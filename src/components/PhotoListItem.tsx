import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CapturedPhoto } from '../../src/types/index';
import { formatDate } from '../utils/formatDate';

interface PhotoListItemProps {
  photo: CapturedPhoto;
  onDelete: (id: string) => void;
}

export default function PhotoListItem({ photo, onDelete }: PhotoListItemProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: photo.localPath }}
        style={styles.thumbnail}
      />
      <View style={styles.details}>
        <Text style={styles.label}>{photo.label}</Text>
        <Text style={styles.timestamp}>{formatDate(photo.capturedAt)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onDelete(photo.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
});
