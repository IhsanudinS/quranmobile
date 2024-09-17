/* eslint-disable prettier/prettier */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import axios from 'axios';

const AyatDetail = ({ route }) => {
  const { arabicText } = route.params;
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState('');
  const [transcription, setTranscription] = useState('');
  const [differences, setDifferences] = useState([]);
  const [accuracy, setAccuracy] = useState(0);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef(null);

  const audioPath = `${RNFS.DocumentDirectoryPath}/recording.wav`;

  const startRecording = async () => {
    setRecording(true);
    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      wavFile: 'recording.wav',
    });
    AudioRecord.start();
  };

  const stopRecording = async () => {
    setRecording(false);
    const result = await AudioRecord.stop();
    setAudioFile(audioPath);
    console.log(result);
  };

  const startPlaying = () => {
    if (audioFile) {
      soundRef.current = new Sound(audioFile, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        soundRef.current.play((success) => {
          if (success) {
            console.log('Successfully finished playing');
          } else {
            console.log('Playback failed due to audio decoding errors');
          }
          setPlaying(false);
          soundRef.current.release();
        });
        setPlaying(true);
      });
    }
  };

  const stopPlaying = () => {
    if (soundRef.current) {
      soundRef.current.stop(() => {
        setPlaying(false);
        console.log('Stopped playing');
      });
    }
  };

  const transcribeAudio = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: `file://${audioFile}`,
      type: 'audio/wav',
      name: 'recording.wav',
    });
    formData.append('original_text', arabicText);

    try {
      const response = await axios.post('http://192.168.1.5:5000/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTranscription(response.data.transcription);
      setDifferences(response.data.differences);
      setAccuracy(response.data.accuracy);
    } catch (error) {
      console.log('Error in transcription', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHighlightedText = () => {
    let originalText = arabicText;
    let parts = [];
    let lastIndex = 0;

    differences.forEach((diff, index) => {
      let startIndex = originalText.indexOf(diff.original, lastIndex);
      if (startIndex !== -1) {
        if (startIndex > lastIndex) {
          parts.push(
            <Text key={lastIndex} style={styles.normalText}>
              {originalText.slice(lastIndex, startIndex)}
            </Text>
          );
        }
        parts.push(
          <Text key={startIndex + index} style={styles[diff.type.replace(/\s/g, '')]}>
            {originalText.slice(startIndex, startIndex + diff.original.length)}
          </Text>
        );
        lastIndex = startIndex + diff.original.length;
      }
    });

    if (lastIndex < originalText.length) {
      parts.push(
        <Text key={lastIndex} style={styles.normalText}>
          {originalText.slice(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.arabicText}>{renderHighlightedText()}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
          </TouchableOpacity>
          {audioFile && (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={playing ? stopPlaying : startPlaying}
              >
                <Text style={styles.buttonText}>{playing ? 'Stop Playing' : 'Play Recording'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={transcribeAudio}
              >
                <Text style={styles.buttonText}>Transcribe</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        {transcription && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>Hasil Transkripsi:</Text>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        )}
        {differences.length > 0 && (
          <View style={styles.differencesContainer}>
            <Text style={styles.differencesText}>Perbedaan:</Text>
            {differences.map((diff, index) => (
              <Text key={index} style={styles.differenceItem}>
                {`Jenis Kesalahan: ${diff.type}, Teks Asli: "${diff.original}", Teks Transkripsi: "${diff.transcription}"`}
              </Text>
            ))}
          </View>
        )}
        {accuracy > 0 && (
          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyText}>{`Presentase Kebenaran: ${accuracy.toFixed(2)}%`}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AyatDetail;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  arabicText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
    backgroundColor: 'yellow',
    padding: 8,
    textAlign: 'center',
  },
  normalText: {
    color: '#000000',
  },
  KesalahanHuruf: {
    backgroundColor: '#ffeb3b',
  },
  KesalahanHarakat: {
    backgroundColor: '#ff5722',
  },
  KatayangHilang: {
    backgroundColor: '#f44336',
  },
  KataTambahan: {
    backgroundColor: '#2196f3',
  },
  buttonContainer: {
    flexDirection: 'column',
    marginVertical: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  transcriptionContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e2e3e5',
    borderRadius: 5,
    width: '100%',
  },
  transcriptionText: {
    margin: 5,
    fontSize: 19,
    color: '#333333',
  },
  differencesContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
    width: '100%',
  },
  differencesText: {
    margin: 5,
    fontSize: 19,
    color: '#721c24',
  },
  differenceItem: {
    margin: 5,
    fontSize: 17,
    color: '#721c24',
  },
  accuracyContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#d4edda',
    borderRadius: 5,
    width: '100%',
  },
  accuracyText: {
    margin: 5,
    fontSize: 19,
    color: '#155724',
  },
});
