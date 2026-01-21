import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';

function RegisterScreen() {
  // Références pour les champs d'entrée
  const nomRef = useRef();
  const mailRef = useRef();
  const genreRef = useRef();
  const dateNaissanceRef = useRef();
  const adresseRef = useRef();
  const villeRef = useRef();
  const codePostalRef = useRef();
  const numeroRef = useRef();
  const motDePasseRef = useRef();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.heading}>Inscription</Text>

          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => nomRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={nomRef}
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => mailRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={mailRef}
            style={styles.input}
            placeholder="Adresse e-mail"
            placeholderTextColor="#888"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => genreRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={genreRef}
            style={styles.input}
            placeholder="Genre (femme/homme)"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => dateNaissanceRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={dateNaissanceRef}
            style={styles.input}
            placeholder="Date de naissance (AAAA-MM-JJ)"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => adresseRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={adresseRef}
            style={styles.input}
            placeholder="Adresse"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => villeRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={villeRef}
            style={styles.input}
            placeholder="Ville"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => codePostalRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={codePostalRef}
            style={styles.input}
            placeholder="Code postal"
            placeholderTextColor="#888"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => numeroRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={numeroRef}
            style={styles.input}
            placeholder="Numéro de téléphone"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => motDePasseRef.current.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={motDePasseRef}
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#888"
            secureTextEntry
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>S'inscrire</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
