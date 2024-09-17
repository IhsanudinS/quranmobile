/* eslint-disable prettier/prettier */
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Detail = ({ route, navigation }) => {
  const [listAyat, setListAyat] = useState([]);

  const getAyat = async () => {
    try {
      axios.get(route.params.surahId).then(res => {
        // console.log(res.data.verses);
        setListAyat(res.data.data.verses);
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAyat();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={listAyat}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.ayatContainer}
            onPress={() => {
              navigation.navigate('AyatDetail', {
                arabicText: item.text.arab,
              });
            }}>
            <View style={styles.ayatHeader}>
              <Text style={styles.ayatNumber}>{item.number.inSurah}</Text>
              <Text style={styles.ayatText}>{item.text.arab}</Text>
            </View>
            <Text style={styles.translationText}>{item.translation.id}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default Detail;


const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: '#f9f9f9', // Warna latar belakang yang lebih terang
    },
    ayatContainer: {
      marginBottom: 15,
      padding: 10,
      backgroundColor: '#ffffff', // Warna latar belakang item
      borderRadius: 5,
      elevation: 2, // Menambahkan bayangan (untuk Android)
    },
    ayatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    ayatNumber: {
      fontSize: 14,
      color: '#333333', // Warna teks yang lebih gelap
      marginRight: 10, // Memberikan jarak antara nomor ayat dan teks ayat
    },
    ayatText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333333', // Warna teks yang lebih gelap
      flex: 1,
    },
    translationText: {
      fontSize: 14,
      padding: 6,
      color: 'white', // Warna teks terjemahan yang sedikit lebih terang
      marginTop: 5,
      textAlign: 'justify',
      backgroundColor: 'green',
      borderRadius: 8,
    },
  });
