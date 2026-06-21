import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { CapturedPhoto } from '../../src/types/index';
import PhotoListItem from './PhotoListItem';

interface PhotoListProps {
  photos: CapturedPhoto[];
  onDelete: (id: string) => void;
}

export default function PhotoList({ photos, onDelete }: PhotoListProps) {
  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PhotoListItem photo={item} onDelete={onDelete} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
