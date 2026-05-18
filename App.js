import React, { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const API_URL = 'http://127.0.0.1:8000/analyze';

export default function App() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const takePhotoAndAnalyze = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setImageUri(photo.uri);

      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'food.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || 'Failed to analyze image');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <SafeAreaView style={styles.center}><Text>Requesting camera permission...</Text></SafeAreaView>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>Camera access is required.</Text>
        <Button title="Grant camera permission" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Food Analyzer</Text>

        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        </View>

        <Button title="Take Photo & Analyze" onPress={takePhotoAndAnalyze} disabled={loading} />

        {loading && <ActivityIndicator style={styles.loader} size="large" />}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        {result ? (
          <View style={styles.card}>
            <Text style={styles.row}>Dish: {result.dish_name}</Text>
            <Text style={styles.row}>Portion: {result.portion_size_grams} g</Text>
            <Text style={styles.row}>Calories: {result.calories} kcal</Text>
            <Text style={styles.row}>Protein: {result.protein_g} g</Text>
            <Text style={styles.row}>Carbs: {result.carbs_g} g</Text>
            <Text style={styles.row}>Fat: {result.fat_g} g</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  cameraWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  camera: { width: '100%', height: 320 },
  loader: { marginTop: 8 },
  preview: { width: '100%', height: 220, borderRadius: 12, marginTop: 10 },
  card: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d8d8d8', backgroundColor: '#fafafa' },
  row: { fontSize: 16, marginBottom: 4 },
  error: { color: '#c00', marginTop: 8 },
  message: { marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
});
