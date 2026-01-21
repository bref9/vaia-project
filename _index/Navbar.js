import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Navbar = ({ userSession, navigation, isLoading, currentRoute }) => {
  // TOUJOURS retourner un composant React valide
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{''}</Text>
      </View>
    );
  }

  const navigateToScreen = (routeName) => {
    navigation.navigate(routeName);
  };

  const renderNavButton = (iconName, label, routeName) => {
    const isActive = currentRoute === routeName;
    return (
      <TouchableOpacity 
        style={[styles.navButton, isActive && styles.activeButton]} 
        onPress={() => navigateToScreen(routeName)}
      >
        <Ionicons 
          name={iconName} 
          size={24} 
          color={isActive ? '#007BFF' : '#5E5E5E'} 
        />
        <Text style={[styles.navText, isActive && styles.activeText]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderNavContent = () => {
    if (!userSession || !userSession.role) {
      return (
        <React.Fragment>
          {renderNavButton('search', 'Recherche', 'Home')}
          {renderNavButton('settings', 'Paramètres', 'Settings')}
        </React.Fragment>
      );
    }

    const userRole = userSession.role.toString().toLowerCase().trim();

    if (userRole === 'prestataire') {
      return (
        <React.Fragment>
          {renderNavButton('calendar', 'Agenda', 'HomePresta')}
          {renderNavButton('business', 'Salon', 'SalonPresta')}
          {renderNavButton('settings', 'Paramètres', 'Settings')}
        </React.Fragment>
      );
    }

    if (userRole === 'employe') {
      return (
        <React.Fragment>
          {renderNavButton('calendar', 'Agenda', 'HomePresta')}
          {renderNavButton('settings', 'Paramètres', 'Settings')}
        </React.Fragment>
      );
    }

    if (userRole === 'client') {
      return (
        <React.Fragment>
          {renderNavButton('search', 'Recherche', 'Home')}
          {renderNavButton('calendar', 'Mes RDV', 'MesRendezVous')}
          {renderNavButton('settings', 'Paramètres', 'Settings')}
        </React.Fragment>
      );
    }

    // Fallback par défaut
    return (
      <React.Fragment>
        {renderNavButton('search', 'Recherche', 'Home')}
        {renderNavButton('settings', 'Paramètres', 'Settings')}
      </React.Fragment>
    );
  };

  return (
    <View style={styles.navContainer}>
      {renderNavContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    height: 60,
    zIndex: 100,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: '#5E5E5E',
    marginTop: 4,
  },
  activeText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    height: 60,
  },
});

export default Navbar;