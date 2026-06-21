import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Alert, View } from 'react-native';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import CameraComponent from './src/components/CameraView';
import LabelModal from './src/components/LabelModal';
import PhotoList from './src/components/PhotoList';
import { CapturedPhoto } from './src/types/index';
import { initDB, insertPhoto, deletePhoto, fetchAllPhotos } from './src/db/database';

interface PendingCapture {
  id: string;
  uri: string;
  capturedAt: string;
}

export default function App() {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);

  useEffect(() => {
    initDB();
    const persisted = fetchAllPhotos();
    setPhotos(persisted);
  }, []);

  const handlePhotoCaptured = (id: string, uri: string, capturedAt: string) => {
    setPendingCapture({ id, uri, capturedAt });
    setModalVisible(true);
  };

  const handleSaveLabel = async (label: string) => {
    if (!pendingCapture) return;

    try {
      const photosDir = `${FileSystem.documentDirectory}photos/`;
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });

      const permanentPath = `${photosDir}${pendingCapture.id}.jpg`;
      await FileSystem.copyAsync({
        from: pendingCapture.uri,
        to: permanentPath,
      });

      const photo: CapturedPhoto = {
        id: pendingCapture.id,
        localPath: permanentPath,
        capturedAt: pendingCapture.capturedAt,
        label,
      };

      insertPhoto(photo);
      setPhotos([photo, ...photos]);
      setPendingCapture(null);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo');
      console.error(error);
    }
  };

  const handleDiscardPhoto = () => {
    setPendingCapture(null);
    setModalVisible(false);
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      const photo = photos.find(p => p.id === id);
      if (!photo) return;

      deletePhoto(id);
      await FileSystem.deleteAsync(photo.localPath, { idempotent: true });
      setPhotos(photos.filter(p => p.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete photo');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.cameraContainer}>
        <CameraComponent onPhotoCaptured={handlePhotoCaptured} />
      </View>
      <View style={styles.listContainer}>
        <PhotoList photos={photos} onDelete={handleDeletePhoto} />
      </View>
      {pendingCapture && (
        <LabelModal
          visible={modalVisible}
          photoUri={pendingCapture.uri}
          onSave={handleSaveLabel}
          onDiscard={handleDiscardPhoto}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  cameraContainer: {
    height: 150,
  },
  listContainer: {
    flex: 1,
  },
});
