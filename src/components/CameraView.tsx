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

  const extractCaptureTime = (photo: any): string => {
    try {
      if (photo.exif?.DateTime) {
        const exifDate = new Date(photo.exif.DateTime.replace(/:/g, '-').replace(' ', 'T') + 'Z');
        return exifDate.toISOString();
      }
    } catch (error) {
      console.warn('Failed to extract EXIF timestamp:', error);
    }
    return new Date().toISOString();
  };

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
      const capturedAt = extractCaptureTime(photo);
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
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  camera: {
    height: '50%',
    width: '100%',
  },
  buttonContainer: {
    height: '50%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
