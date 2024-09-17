import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import axios from 'axios';
import Voice from '@react-native-voice/voice';

const AyatDetail = ({route}) => {
  const {arabicText} = route.params;
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState('');
  const [transcription, setTranscription] = useState('');
  const [transcriptionNoHarakat, setTranscriptionNoHarakat] = useState('');
  const [differences, setDifferences] = useState([]);
  const [accuracy, setAccuracy] = useState(0);
  const [errorRate, setErrorRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const serverUrl = useState('https://racer-guiding-hound.ngrok-free.app'); // Default server URL
  const soundRef = useRef(null);

  const audioPath = `${RNFS.DocumentDirectoryPath}/recording.wav`;

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = e => {
    setTranscriptionNoHarakat(e.value[0]);
  };

  const startRecording = async () => {
    setLoadingRec(true);
    try {
      setRecording(true);
      Voice.start('ar-SA');
      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        wavFile: 'recording.wav',
      });
      await AudioRecord.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    } finally {
      setLoadingRec(false);
    }
  };

  const stopRecording = async () => {
    setLoadingRec(true);
    try {
      setRecording(false);
      Voice.stop();
      const result = await AudioRecord.stop();
      setAudioFile(result);
      console.log(result);
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setLoadingRec(false);
    }
  };

  const startPlaying = () => {
    if (audioFile) {
      soundRef.current = new Sound(audioFile, Sound.MAIN_BUNDLE, error => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        soundRef.current.play(success => {
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
      const response = await axios.post(`${serverUrl}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTranscription(response.data.transcription);
      setDifferences(response.data.differences);
      setAccuracy(response.data.accuracy);
      setErrorRate(response.data.error_rate);
    } catch (error) {
      console.log('Error in transcription', error);
      // Tampilkan pop-up ketika ada masalah koneksi atau server
      Alert.alert(
        "Server Error",
        "Mohon maaf server sedang tidak aktif. coba lagi nanti.",
        [{ text: "OK" }]
      );
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
            </Text>,
          );
        }
        parts.push(
          <Text
            key={startIndex + index}
            style={styles[diff.type.replace(/\s/g, '')]}>
            {originalText.slice(startIndex, startIndex + diff.original.length)}
          </Text>,
        );
        lastIndex = startIndex + diff.original.length;
      }
    });

    if (lastIndex < originalText.length) {
      parts.push(
        <Text key={lastIndex} style={styles.normalText}>
          {originalText.slice(lastIndex)}
        </Text>,
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
            disabled={loadingRec}>
            <View style={styles.buttonContainer}>
              {recording && (
                <>
                  {loadingRec && (
                    <ActivityIndicator
                      size="small"
                      color="#333333"
                      style={{marginRight: 10}}
                    />
                  )}
                  <Text style={styles.buttonText}>Berhenti Rekam</Text>
                </>
              )}
              {!recording && !loadingRec && (
                <Text style={styles.buttonText}>Mulai Rekam</Text>
              )}
            </View>
          </TouchableOpacity>

          {audioFile && (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={playing ? stopPlaying : startPlaying}>
                <Text style={styles.buttonText}>
                  {playing ? 'Berhenti Memutar' : 'Putar Rekaman'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={transcribeAudio}>
                <Text style={styles.buttonText}>Cek Bacaan</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        {transcription && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>Hasil Transkripsi :</Text>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        )}
        {transcriptionNoHarakat && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>
              Hasil Transkripsi tanpa Harakat:
            </Text>
            <Text style={styles.transcriptionText}>
              {transcriptionNoHarakat}
            </Text>
          </View>
        )}
        {differences.length > 0 && (
          <View style={styles.differencesContainer}>
            <Text style={styles.differencesText}>Perbedaan:</Text>
            {differences.map((diff, index) => (
              <View key={index} style={styles.differenceItemContainer}>
                <Text style={styles.differenceItem}>
                  {`Jenis Kesalahan: ${diff.type}`}
                </Text>
                <Text style={styles.differenceItem}>
                  {`Teks Asli: ${diff.original}`}
                </Text>
                <Text style={styles.differenceItem}>
                  {`Teks Transkripsi: ${diff.transcription}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {accuracy > 0 && (
          <View style={styles.accuracyContainer}>
            <Text
              style={
                styles.accuracyText
              }>{`Persentase Kebenaran: ${accuracy.toFixed(2)}%`}</Text>
          </View>
        )}
        {errorRate > 0 && (
          <View style={styles.errorRateContainer}>
            <Text
              style={
                styles.errorRateText
              }>{`Persentase Kesalahan: ${errorRate.toFixed(2)}%`}</Text>
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
    backgroundColor: 'white',
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
    backgroundColor: '#f44336',
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
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    width: 250,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#3f51b5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    width: 250,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: '#CCCCCC',
    color: '#333333',
    borderWidth: 1,
    borderRadius: 6,
    width: 250,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  transcriptionContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  transcriptionText: {
    fontSize: 24,
    marginVertical: 10,
    color: '#333333',
    textAlign: 'center',
  },
  differencesContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffebcd',
    borderRadius: 5,
  },
  differencesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  differenceItemContainer: {
    marginBottom: 10,
  },
  differenceItem: {
    fontSize: 18,
    color: '#000',
    marginBottom: 5, // Memberikan jarak antar item
    lineHeight: 24, // Memberikan tinggi baris untuk memastikan teks tidak saling bertumpukan
    textAlign: 'left',
    backgroundColor: '#fff', // Memberikan latar belakang putih untuk kejelasan
    padding: 5, // Memberikan sedikit ruang pada teks
    borderRadius: 3, // Membuat ujung kotak sedikit melengkung
  },
  accuracyContainer: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#3f51b5'
  },
  accuracyText: {
    fontSize: 18,
    marginVertical: 10,
    color: '#333333',
    padding: 12
  },
  errorRateContainer: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'red',
  },
  errorRateText: {
    fontSize: 18,
    marginVertical: 10,
    color: '#333333',
    padding: 12,
  },
});
