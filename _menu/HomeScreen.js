import React from 'react';
import { StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

export default function HomeScreen({ navigation, userSession, setUserSession }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Titre principal toujours en haut */}
      <View style={styles.titleContainer}>
        <Text style={styles.elegantTitle}>Réservez vos</Text>
        <Text style={styles.elegantTitle}>soins de beauté</Text>
        <Text style={styles.elegantTitle}>en ligne</Text>
      </View>

      {/* Barre de recherche comme dans votre code original */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchBar}
            placeholder="Rechercher un salon, un soin..."
            placeholderTextColor="#ffffffff"
            onFocus={() => navigation.navigate('Categories')}
          />
        </View>
      </View>

      {/* Header juste baissé un peu - au dessus du titre */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.appName}>PLANITY</Text>
        </View>
        <Text style={styles.headerSubtitle}>Beauty & Wellness</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
  },
  header: {
    position: 'absolute',
    top: 100, // Juste baissé un peu du bord supérieur
    left: 32,
    right: 32,
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#152747',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  appName: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#152747',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8B8B8B',
    letterSpacing: 3,
    fontWeight: '300',
    marginLeft: 48,
  },
  titleContainer: {
    marginTop: 200, // Titre descendu pour laisser place au header
    paddingHorizontal: 32,
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  elegantTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    lineHeight: 36,
    letterSpacing: 0.5,
  },
  searchWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 60,
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152747',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#a0c0ff',
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 8,
  },
});