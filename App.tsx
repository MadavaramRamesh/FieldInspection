import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Alert, View } from 'react-native';
import { useEffect } from 'react';
import CameraComponent from './src/components/CameraView';
import LabelModal from './src/components/LabelModal';
import PhotoList from './src/components/PhotoList';
import { usePhotoCapture } from './src/hooks/usePhotoCapture';
import { usePhotoStorage } from './src/hooks/usePhotoStorage';
import { usePhotoList } from './src/hooks/usePhotoList';
import { usePhotoModal } from './src/hooks/usePhotoModal';

export default function App() {
  const { photos, addPhoto, removePhoto } = usePhotoList();
  const { pendingCapture, handlePhotoCaptured } = usePhotoCapture();
  const { modalVisible, openModal, closeModal } = usePhotoModal();
  const { savePhoto, deletePhoto, error: storageError } = usePhotoStorage();

  useEffect(() => {
    if (pendingCapture) {
      openModal();
    }
  }, [pendingCapture, openModal]);

  useEffect(() => {
    if (storageError) {
      Alert.alert('Error', storageError.getUserMessage());
    }
  }, [storageError]);

  const handleSaveLabel = async (label: string) => {
    if (!pendingCapture) return;

    try {
      const saved = await savePhoto(pendingCapture, label);
      if (saved) {
        addPhoto(saved);
        closeModal();
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDiscardPhoto = () => {
    closeModal();
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const success = await deletePhoto(photoId);
      if (success) {
        removePhoto(photoId);
      }
    } catch (error) {
      console.error('Delete error:', error);
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
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
});
