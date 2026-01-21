import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, SafeAreaView, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Image
          source={{ uri: 'https://via.placeholder.com/150' }}
          style={styles.logo}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButton}>Se connecter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Prenez rendez-vous dès maintenant</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Nom du salon, prestations..."
          placeholderTextColor="#888"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  navbar: { height: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  logo: { width: 100, height: 40, resizeMode: 'contain' },
  loginButton: { fontSize: 16, color: '#007BFF', fontWeight: 'bold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  searchBar: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 25, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#fff', elevation: 2, marginBottom: 15 },
});
