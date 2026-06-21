import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import CameraComponent from './src/components/CameraView';

export default function App() {
  const handlePhotoCaptured = (id: string, uri: string, capturedAt: string) => {
    console.log('Photo captured:', { id, uri, capturedAt });
  };

  return (
    <View style={styles.container}>
      <CameraComponent onPhotoCaptured={handlePhotoCaptured} />
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
