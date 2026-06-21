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

  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Button title="Initializing camera..." onPress={() => {}} disabled />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Button title="Grant Camera Permission" onPress={() => requestPermission()} />
      </View>
    );
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
      console.log('Starting photo capture...');
      const photo = await cameraRef.current.takePictureAsync();
      console.log('Photo captured:', photo.uri);

      if (!photo || !photo.uri) {
        throw new Error('Photo capture returned invalid data');
      }

      const capturedAt = extractCaptureTime(photo);
      const id = Crypto.randomUUID();
      console.log('Calling onPhotoCaptured with:', { id, uri: photo.uri, capturedAt });
      onPhotoCaptured(id, photo.uri, capturedAt);
    } catch (error: any) {
      console.error('Capture error details:', error);
      Alert.alert('Capture Failed', `${error?.message || 'Failed to capture photo'}`);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.buttonContainer}>
          <Button
            title={isCapturing ? '⏳ Capturing...' : '📸 Capture Photo'}
            onPress={handleCapture}
            disabled={isCapturing}
            color="#007AFF"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  cameraWrapper: {
    height: '100%',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
