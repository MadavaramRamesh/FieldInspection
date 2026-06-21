import React, { useRef, useState } from 'react';
import { StyleSheet, View, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';

interface CameraViewProps {
  onPhotoCaptured: (id: string, uri: string, capturedAt: string) => void;
}

export default function CameraComponent({ onPhotoCaptured }: CameraViewProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return <View />;
  }

  const handleCapture = async () => {
    if (isCapturing || !cameraRef.current) return;

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      const capturedAt = new Date().toISOString();
      const id = Crypto.randomUUID();
      onPhotoCaptured(id, photo.uri, capturedAt);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error(error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} />
      <View style={styles.buttonContainer}>
        <Button
          title={isCapturing ? 'Capturing...' : 'Capture Photo'}
          onPress={handleCapture}
          disabled={isCapturing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    height: 300,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
