import React from 'react';
import { View, Text, StyleSheet, TextInput, SafeAreaView, TouchableOpacity } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Connexion</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Adresse e-mail"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.searchBar}
        placeholder="Mot de passe"
        placeholderTextColor="#888"
        secureTextEntry
      />
      <TouchableOpacity style={styles.loginSubmit}>
        <Text style={styles.loginSubmitText}>Se connecter</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerButton}>Pas encore de compte ? Inscrivez-vous</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', paddingHorizontal: 20, justifyContent: 'center' },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  searchBar: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 25, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#fff', elevation: 2, marginBottom: 15 },
  loginSubmit: { width: '100%', height: 50, backgroundColor: '#007BFF', justifyContent: 'center', alignItems: 'center', borderRadius: 25, marginTop: 10 },
  loginSubmitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerButton: { marginTop: 15, fontSize: 16, color: '#007BFF', textAlign: 'center' },
});
