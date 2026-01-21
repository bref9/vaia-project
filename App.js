import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import des écrans
import CategoriesScreen from './_client/CategoriesScreen';
import ClientSignupScreen from './_client/ClientSignupScreen';
import ConfirmationPrestation from './_client/ConfirmationPrestation';
import DetailsReservation from './_client/DetailsReservation';
import EntrepriseScreen from './_client/EntrepriseScreen';
import MesRendezVous from './_client/MesRendezVous';
import PaiementScreen from './_client/PaiementScreen';
import Navbar from './_index/Navbar';
import HomeScreen from './_menu/HomeScreen';
import LoginScreen from './_menu/LoginScreen';
import ProfileScreen from './_menu/ProfileScreen';
import SettingsScreen from './_menu/SettingsScreen';
import ClientsManagement from './_presta/ClientsManagement';
import Dashboard from './_presta/Dashboard';
import EntrepriseInfoSignupScreen from './_presta/EntrepriseInfoSignupScreen'; // NOUVEL IMPORT
import HomePresta from './_presta/HomePresta';
import PrestataireSignupScreen from './_presta/PrestataireSignupScreen';
import SalonPresta from './_presta/SalonPresta';

const Stack = createStackNavigator();

export default function App() {
  const [userSession, setUserSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem('userSession');
      if (session) {
        setUserSession(JSON.parse(session));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animationEnabled: false,
          gestureEnabled: true,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 0 } },
            close: { animation: 'timing', config: { duration: 0 } },
          },
          headerBackTitleVisible: false,
          headerTintColor: '#000',
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      >
        {/* Écran principal */}
        <Stack.Screen 
          name="Home" 
          options={{ 
            headerShown: false, 
            gestureEnabled: false 
          }}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <HomeScreen {...props} userSession={userSession} setUserSession={setUserSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>

        {/* Écran de connexion */}
        <Stack.Screen 
          name="Login" 
          options={({ navigation }) => ({
            title: 'Connexion',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Settings')} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => <LoginScreen {...props} setUserSession={setUserSession} />}
        </Stack.Screen>

        {/* Écrans d'inscription */}
        <Stack.Screen 
          name="ClientSignup" 
          component={ClientSignupScreen} 
          options={{ title: 'Inscription Client' }} 
        />
        <Stack.Screen 
          name="PrestataireSignup" 
          component={PrestataireSignupScreen} 
          options={{ title: 'Inscription Prestataire' }} 
        />
        
        {/* NOUVELLE ROUTE - Écran d'inscription entreprise */}
        <Stack.Screen 
          name="EntrepriseInfoSignup" 
          component={EntrepriseInfoSignupScreen} 
          options={({ navigation }) => ({
            title: 'Informations Entreprise',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        />

        {/* Écran Catégories */}
        <Stack.Screen 
          name="Categories" 
          options={({ navigation }) => ({
            title: 'Catégories',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Home')} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <CategoriesScreen {...props} userSession={userSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>

        {/* Écran Entreprise - AVEC NAVBAR */}
        <Stack.Screen 
          name="EntrepriseScreen" 
          options={({ navigation }) => ({
            title: 'Détails du prestataire',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <EntrepriseScreen {...props} userSession={userSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>
        

        {/* Écran Confirmation Prestation - SANS NAVBAR */}
        <Stack.Screen 
          name="ConfirmationPrestation" 
          options={({ navigation }) => ({
            title: 'Confirmation',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => <ConfirmationPrestation {...props} userSession={userSession} />}
        </Stack.Screen>

        {/* Écran Détails Réservation - AVEC NAVBAR */}
<Stack.Screen 
  name="DetailsReservation" 
  options={{
    headerShown: true,
    title: '',
    headerLeft: () => null,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
      height: 60,
    },
    headerTitleStyle: {
      display: 'none',
    },
    headerTitleContainerStyle: {
      width: 0,
    },
  }}
>
  {(props) => (
    <View style={{ flex: 1 }}>
      <DetailsReservation {...props} userSession={userSession} />
      <Navbar 
        {...props} 
        userSession={userSession} 
        isLoading={isLoading}
        currentRoute={props.route.name}
      />
    </View>
  )}
</Stack.Screen>


        {/* Écran Mes Rendez-vous - AVEC NAVBAR */}
<Stack.Screen 
  name="MesRendezVous" 
  options={{
    headerShown: true, // Garder l'en-tête visible
    title: '', // Titre vide
    headerLeft: () => null, // Pas de flèche
    headerStyle: {
      backgroundColor: '#fff', // Blanc comme avant
      elevation: 0, // Pas d'ombre Android
      shadowOpacity: 0, // Pas d'ombre iOS
      borderBottomWidth: 0, // Pas de ligne de séparation
      height: 60, // Hauteur standard (ajustez si besoin)
    },
    headerTitleStyle: {
      display: 'none', // Cacher complètement le titre
    },
    headerTitleContainerStyle: {
      width: 0, // Réduire le conteneur du titre à zéro
    },
  }}
>
  {(props) => (
    <View style={{ flex: 1 }}>
      <MesRendezVous {...props} userSession={userSession} />
      <Navbar 
        {...props} 
        userSession={userSession} 
        isLoading={isLoading}
        currentRoute={props.route.name}
      />
    </View>
  )}
</Stack.Screen>



        {/* Écran Profil - AVEC NAVBAR */}
        <Stack.Screen 
          name="Profile" 
          options={({ navigation }) => ({
            title: 'Mon Profil',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Settings')} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <ProfileScreen {...props} userSession={userSession} setUserSession={setUserSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>

        {/* Écran Paramètres - AVEC NAVBAR */}
        <Stack.Screen 
          name="Settings"
          options={{
            title: 'Paramètres',
            headerLeft: () => null
          }}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <SettingsScreen {...props} userSession={userSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>

<Stack.Screen 
  name="Paiement" 
  component={PaiementScreen}
  options={{ 
    headerShown: true,
    title: '',
    headerLeft: () => null,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
      height: 0,
    },
    headerTitleStyle: {
      display: 'none',
    },
    headerTitleContainerStyle: {
      width: 0,
    },
  }}
/>



        {/* Écran Dashboard - AVEC NAVBAR */}
<Stack.Screen 
  name="Dashboard" 
  options={{
    headerShown: true,
    title: '',
    headerLeft: () => null,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
      height: 60,
    },
    headerTitleStyle: {
      display: 'none',
    },
    headerTitleContainerStyle: {
      width: 0,
    },
  }}
>
  {(props) => (
    <View style={{ flex: 1 }}>
      <Dashboard {...props} userSession={userSession} />
      <Navbar 
        {...props} 
        userSession={userSession} 
        isLoading={isLoading}
        currentRoute={props.route.name}
      />
    </View>
  )}
</Stack.Screen>




        {/* Écran Gestion des Clients - AVEC NAVBAR */}
        <Stack.Screen 
          name="ClientsManagement" 
          options={({ navigation }) => ({
            title: 'Gestion des Clients',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <ClientsManagement {...props} userSession={userSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>

        {/* Écrans prestataires - AVEC NAVBAR */}
        <Stack.Screen 
          name="HomePresta" 
          options={{ 
            title: 'Mon Agenda',
            headerLeft: () => null
          }}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <HomePresta {...props} userSession={userSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="SalonPresta" 
          options={{ 
            title: 'Mon Salon',
            headerLeft: () => null
          }}
        >
          {(props) => (
            <View style={{ flex: 1 }}>
              <SalonPresta {...props} userSession={userSession} />
              <Navbar 
                {...props} 
                userSession={userSession} 
                isLoading={isLoading}
                currentRoute={props.route.name}
              />
            </View>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
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
    color: '#666',
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
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountText: {
    marginLeft: 15,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accountEmail: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  menuItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});