/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Button,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Voice from '@react-native-voice/voice';
import axios from 'axios';
import _ from 'lodash';

const BASE_URL = 'https://api.quran.gading.dev/';

const Home = ({navigation}) => {
  const [surah, setSurah] = useState([]);
  const [filteredSurah, setFilteredSurah] = useState([]);
  const [searchText, setSearchText] = useState('');

  const getData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}surah`);
      setSurah(res.data.data);
      setFilteredSurah(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    const normalizedText = _.deburr(text).toLowerCase(); // Normalisasi teks tanpa tanda diakritik
    const filtered = surah.filter((item) =>
      _.deburr(item.name.transliteration.id).replace(/[^\w\s]/gi, ' ').toLowerCase().includes(normalizedText.replace(/[^\w\s]/gi, ''))
    );
    setFilteredSurah(filtered);
  };

  const onSpeechResults = (event) => {
    const text = event.value[0];
    setSearchText(text);
    handleSearch(text);
  };

  const startListening = async () => {
    try {
      await Voice.start('id-ID');
    } catch (error) {
      console.log('Error starting voice recognition: ', error);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari Surat..."
          value={searchText}
          onChangeText={handleSearch}
        />
        <Button title="Voice Search" onPress={startListening} />
      </View> */}
      <FlatList
        data={filteredSurah}
        renderItem={({item, index}) => (
          <TouchableOpacity
            style={styles.itemSurah}
            onPress={() => {
              navigation.navigate('Detail', {
                surahId: `${BASE_URL}surah/${item.number}`,
                surahName: item.name.transliteration.id, // Kirim nama surat
              });
            }}>
            <Text style={styles.itemNumber}>{item.number}</Text>
            <View style={styles.itemNameSurah}>
              <View>
                <Text style={styles.itemText}>
                  {item.name.transliteration.id}
                </Text>
                <Text style={{fontSize: 10, color: '#333333'}}>
                  {item.revelation.id} - {item.numberOfVerses} Ayat
                </Text>
              </View>
              <Text style={styles.itemText}>{item.name.short}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </SafeAreaView>
  );
};
export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Warna latar belakang yang lebih terang
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#ffff',
    borderRadius: 5,
    elevation: 2,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
    color:'black',
  },
  itemSurah: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#ffffff', // Warna latar belakang item
    borderRadius: 5,
    elevation: 2, // Menambahkan bayangan (untuk Android)
  },
  itemText: {
    fontSize: 18,
    color: '#333333', // Warna teks yang lebih gelap
  },
  itemNumber: {
    alignItems: 'center',
    color: '#333333',
  },
  itemNameSurah: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
