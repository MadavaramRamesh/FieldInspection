import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import CameraComponent from './src/components/CameraView';
import LabelModal from './src/components/LabelModal';
import PhotoList from './src/components/PhotoList';
import { CapturedPhoto } from './src/types/index';

export default function App() {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  const handlePhotoCaptured = (id: string, uri: string, capturedAt: string) => {
    console.log('Photo captured:', { id, uri, capturedAt });
    setPhoto({ id, localPath: uri, capturedAt, label: '' });
  };

  const handleSaveLabel = (label: string) => {
    if (photo) {
      const savedPhoto = { ...photo, label };
      console.log('Photo saved with label:', savedPhoto);
      setPhotos([savedPhoto, ...photos]);
      setPhoto(null);
    }
  };

  const handleDiscardPhoto = () => {
    console.log('Photo discarded');
    setPhoto(null);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <View style={styles.container}>
      <CameraComponent onPhotoCaptured={handlePhotoCaptured} />
      {photo && (
        <LabelModal
          visible={true}
          photoUri={photo.localPath}
          onSave={handleSaveLabel}
          onDiscard={handleDiscardPhoto}
        />
      )}
      <PhotoList photos={photos} onDelete={handleDeletePhoto} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
