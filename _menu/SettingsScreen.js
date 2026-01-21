import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Navbar from '../_index/Navbar';

const SettingsScreen = ({ navigation, userSession }) => {
  const isLoggedIn = userSession && userSession.id && userSession.role;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Section Compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          {isLoggedIn ? (
            <TouchableOpacity 
              style={styles.accountCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.accountInfo}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person-circle" size={24} color="#FFF" />
                </View>
                <View style={styles.accountText}>
                  <Text style={styles.accountName}>Profil</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#152747" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.loginCard}
              onPress={() => navigation.navigate('Login')}
            >
              <View style={styles.accountInfo}>
                <View style={styles.iconContainer}>
                  <Ionicons name="log-in" size={24} color="#FFF" />
                </View>
                <View style={styles.accountText}>
                  <Text style={styles.accountName}>Se connecter</Text>
                  <Text style={styles.accountEmail}>Accéder à votre compte</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#152747" />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Mentions légales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mentions légales</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8EDFF' }]}>
                <Ionicons name="document-text" size={18} color="#152747" />
              </View>
              <Text style={styles.menuItemText}>Conditions générales</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#152747" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8EDFF' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#152747" />
              </View>
              <Text style={styles.menuItemText}>Politique de confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#152747" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8EDFF' }]}>
                <Ionicons name="business" size={18} color="#152747" />
              </View>
              <Text style={styles.menuItemText}>Mentions légales</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#152747" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navbar */}
      <Navbar 
        navigation={navigation} 
        userSession={userSession} 
        isLoading={false}
        currentRoute="Settings"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 15,
    paddingLeft: 10,
  },
  accountCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loginCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#152747',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountText: {
    marginLeft: 15,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#152747',
  },
  accountEmail: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  menuItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SettingsScreen;