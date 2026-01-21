import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const ProfilePage = ({ navigation, route, userSession, setUserSession }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserData();
  }, [navigation]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const session = await AsyncStorage.getItem('userSession');
      
      if (session) {
        const user = JSON.parse(session);
        console.log('🔍 Session pour profil:', user);
        
        const response = await fetch(
          `http://192.168.1.68:3000/profil?id=${user.id}&type_utilisateur=${user.role}`
        );
        
        const result = await response.json();
        
        if (response.ok) {
          const profilData = {
            ...result.profil,
            id: user.id,
            role: user.role
          };
          
          setUserData(profilData);
          setEditedData(profilData);
        } else {
          setError(result.error || 'Erreur inconnue');
        }
      } else {
        setError('Session utilisateur introuvable');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de récupérer les données');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userSession');
      
      if (setUserSession) {
        setUserSession(null);
      }
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (err) {
      console.error('Erreur de déconnexion:', err);
      Alert.alert('Erreur', 'Impossible de se déconnecter');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData(userData);
    }
    setIsEditing(!isEditing);
  };

const handleSave = async () => {
  try {
    const session = await AsyncStorage.getItem('userSession');
    if (!session) {
      Alert.alert('Erreur', 'Session utilisateur introuvable');
      return;
    }

    const user = JSON.parse(session);

    // CORRECTION : Formater la date au format YYYY-MM-DD
    let formattedDate = '';
    if (editedData.date_naissance) {
      // Si c'est déjà au bon format, garder tel quel
      if (editedData.date_naissance.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = editedData.date_naissance;
      } else {
        // Sinon, convertir depuis le format ISO
        const dateObj = new Date(editedData.date_naissance);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      }
    }

    // Préparer les données selon le type d'utilisateur
    const dataToSend = {
      id: user.id,
      type_utilisateur: user.role || 'client',
      prenom: editedData.prenom || '',
      nom: editedData.nom || '',
      mail: editedData.mail || '',
      numero: editedData.numero || '',
      adresse: editedData.adresse || '',
      ville: editedData.ville || '',
      code_postal: editedData.code_postal || '',
      date_naissance: formattedDate, // ← UTILISER LA DATE FORMATÉE
      genre: editedData.genre || ''
    };

    // Ajouter les champs spécifiques aux prestataires/employés
    if (user.role === 'prestataire' || user.role === 'employe') {
      dataToSend.categorie = editedData.categorie || '';
      dataToSend.disponibilite = editedData.disponibilite || '';
    }

    console.log('📤 Envoi des données profil:', dataToSend);

    const response = await fetch('http://192.168.1.68:3000/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    const responseText = await response.text();
    console.log('📥 Réponse brute profil:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erreur parsing JSON profil:', parseError);
      throw new Error('Réponse invalide du serveur');
    }

    if (response.ok) {
      // Mettre à jour les données avec la réponse du serveur
      const updatedUserData = {
        ...userData,
        ...dataToSend
      };
      
      setUserData(updatedUserData);
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      
      // Mettre à jour la session si l'email a changé
      if (editedData.mail && editedData.mail !== userData.mail) {
        const updatedSession = {
          ...user,
          email: editedData.mail
        };
        await AsyncStorage.setItem('userSession', JSON.stringify(updatedSession));
      }
    } else {
      console.error('❌ Erreur serveur:', result);
      Alert.alert('Erreur', result.error || 'Erreur lors de la mise à jour');
    }
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
    Alert.alert('Erreur', error.message || 'Impossible de sauvegarder les modifications');
  }
};

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

const handleDateChange = (event, selectedDate) => {
  setShowDatePicker(false);
  if (selectedDate) {
    // CORRECTION : Stocker directement au format YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];
    console.log('📅 Date sélectionnée formatée:', formattedDate);
    handleFieldChange('date_naissance', formattedDate);
  }
};

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const session = await AsyncStorage.getItem('userSession');
      if (!session) {
        Alert.alert('Erreur', 'Session utilisateur introuvable');
        return;
      }

      const user = JSON.parse(session);
      console.log('🔍 Session utilisateur:', user);

      const updateData = {
        id: user.id,
        type_utilisateur: user.role || 'client',
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };

      console.log('📤 Envoi des données mot de passe:', updateData);

      const response = await fetch('http://192.168.1.68:3000/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const responseText = await response.text();
      console.log('📥 Réponse brute:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur parsing JSON:', parseError);
        throw new Error('Réponse invalide du serveur');
      }

      if (response.ok) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier le mot de passe');
    }
  };

  const formatDisponibilite = (disponibilite) => {
    if (!disponibilite) return null;
    
    try {
      const dispoObj = typeof disponibilite === 'string' ? JSON.parse(disponibilite) : disponibilite;
      const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      
      return jours.map(jour => {
        const jourData = dispoObj[jour.toLowerCase()] || dispoObj[jour];
        if (jourData && jourData.debut && jourData.fin) {
          return `${jour}: ${jourData.debut} - ${jourData.fin}`;
        }
        return null;
      }).filter(Boolean).join('\n');
    } catch {
      return String(disponibilite).replace(/[\[\]{}"]/g, '').trim();
    }
  };

  const formatSpecialite = (specialite) => {
    if (!specialite) return null;
    
    try {
      const specArray = typeof specialite === 'string' ? JSON.parse(specialite) : specialite;
      return Array.isArray(specArray) ? specArray.join(', ') : String(specialite);
    } catch {
      return String(specialite).replace(/[\[\]"]/g, '').trim();
    }
  };

  // CORRECTION : Nouvelle fonction pour gérer l'édition des spécialités
  const handleSpecialiteChange = (text) => {
    // Pour les prestataires, on peut stocker la catégorie comme string simple
    // ou comme tableau JSON selon votre besoin
    handleFieldChange('categorie', text);
  };

  // CORRECTION : Nouvelle fonction pour rendre le champ spécialité éditable
  const renderEditableSpecialite = () => {
    if (!userData.categorie && !isEditing) return null;

    return (
      <View style={styles.infoItem}>
        <View style={styles.iconContainer}>
          <Ionicons name="ribbon-outline" size={20} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.labelText}>Spécialité</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={editedData.categorie || ''}
              onChangeText={handleSpecialiteChange}
              placeholder="Vos spécialités (séparées par des virgules)"
              multiline={true}
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.valueText}>
              {formatSpecialite(userData.categorie) || 'Non renseigné'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEditableField = (iconName, label, value, fieldName, placeholder = "", keyboardType = "default", multiline = false, isDate = false) => {
    if (!value && !isEditing) return null;

    return (
      <View style={styles.infoItem}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.labelText}>{label}</Text>
          {isEditing ? (
            isDate ? (
              <View>
                <TouchableOpacity onPress={showDatePickerModal}>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateInputText}>
                      {editedData[fieldName] ? formatDateForDisplay(editedData[fieldName]) : 'Sélectionner une date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={editedData[fieldName] || ''}
                onChangeText={(text) => handleFieldChange(fieldName, text)}
                placeholder={placeholder}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
              />
            )
          ) : (
            <Text style={styles.valueText}>
              {isDate ? formatDateForDisplay(value) : (value || 'Non renseigné')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderStaticField = (iconName, label, value, isMultiline = false) => {
    if (!value) return null;

    return (
      <View style={styles.infoItem}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.labelText}>{label}</Text>
          <Text style={[styles.valueText, isMultiline && styles.multilineText]}>
            {value}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#152747" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={50} color="#152747" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.retryText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="person-outline" size={50} color="#152747" />
          <Text style={styles.errorText}>Aucune donnée utilisateur trouvée</Text>
        </View>
      </View>
    );
  }

  const formattedDisponibilite = formatDisponibilite(userData.disponibilite);
  const isPrestataire = userData.role === 'prestataire' || userData.role === 'employe';

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header avec avatar */}
        <View style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#152747" />
          </View>
          
          {isEditing ? (
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedData.prenom || ''}
                onChangeText={(text) => handleFieldChange('prenom', text)}
                placeholder="Prénom"
              />
              <TextInput
                style={styles.nameInput}
                value={editedData.nom || ''}
                onChangeText={(text) => handleFieldChange('nom', text)}
                placeholder="Nom"
              />
            </View>
          ) : (
            <>
              <Text style={styles.userName}>
                {userData.prenom} {userData.nom}
              </Text>
              <Text style={styles.userEmail}>{userData.mail}</Text>
              <Text style={styles.userRole}>
                {userData.role === 'prestataire' ? 'Prestataire' : 
                 userData.role === 'employe' ? 'Employé' : 'Client'}
              </Text>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditToggle}
          >
            <Ionicons 
              name={isEditing ? "close-circle" : "create-outline"} 
              size={20} 
              color="#FFF" 
            />
            <Text style={styles.editButtonText}>
              {isEditing ? 'Annuler' : 'Modifier le profil'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.passwordButton}
            onPress={handlePasswordChange}
          >
            <Ionicons name="key-outline" size={20} color="#152747" />
            <Text style={styles.passwordButtonText}>Modifier le mot de passe</Text>
          </TouchableOpacity>
        </View>

        {/* Section informations personnelles */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={22} color="#152747" />
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
          </View>
          
          {renderEditableField('mail-outline', 'Email', userData.mail, 'mail', 'votre@email.com', 'email-address')}
          {renderEditableField('call-outline', 'Téléphone', userData.numero, 'numero', 'Votre numéro', 'phone-pad')}
          {renderEditableField('location-outline', 'Adresse', userData.adresse, 'adresse', 'Votre adresse', 'default', true)}
          {renderEditableField('location-outline', 'Ville', userData.ville, 'ville', 'Votre ville')}
          {renderEditableField('location-outline', 'Code postal', userData.code_postal, 'code_postal', 'Code postal', 'numeric')}
          {renderEditableField('calendar-outline', 'Date de naissance', 
            userData.date_naissance, 
            'date_naissance', 'JJ/MM/AAAA', 'default', false, true)}
          
          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={userData.genre === 'femme' ? 'female-outline' : 'male-outline'} 
                size={20} 
                color="#FFF" 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.labelText}>Genre</Text>
              {isEditing ? (
                <View style={styles.genreContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.genreButton, 
                      editedData.genre === 'femme' && styles.genreButtonSelected
                    ]}
                    onPress={() => handleFieldChange('genre', 'femme')}
                  >
                    <Text style={[
                      styles.genreText,
                      editedData.genre === 'femme' && styles.genreTextSelected
                    ]}>Femme</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.genreButton, 
                      editedData.genre === 'homme' && styles.genreButtonSelected
                    ]}
                    onPress={() => handleFieldChange('genre', 'homme')}
                  >
                    <Text style={[
                      styles.genreText,
                      editedData.genre === 'homme' && styles.genreTextSelected
                    ]}>Homme</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.genreButton, 
                      editedData.genre === 'autre' && styles.genreButtonSelected
                    ]}
                    onPress={() => handleFieldChange('genre', 'autre')}
                  >
                    <Text style={[
                      styles.genreText,
                      editedData.genre === 'autre' && styles.genreTextSelected
                    ]}>Autre</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.valueText}>
                  {userData.genre === 'femme' ? 'Femme' : userData.genre === 'homme' ? 'Homme' : userData.genre}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Section professionnelle pour prestataires/employés */}
        {isPrestataire && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={22} color="#152747" />
              <Text style={styles.sectionTitle}>Informations professionnelles</Text>
            </View>
            
            {renderEditableSpecialite()}
            {renderStaticField('time-outline', 'Disponibilités', formattedDisponibilite, true)}
          </View>
        )}

        {/* Bouton Valider en mode édition */}
        {isEditing && (
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
          >
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            <Text style={styles.saveText}>Valider les modifications</Text>
          </TouchableOpacity>
        )}

        {/* Bouton de déconnexion */}
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFF" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Modal pour le DatePicker */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner la date de naissance</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#152747" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={editedData.date_naissance ? new Date(editedData.date_naissance) : new Date('2000-01-01')}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date('1900-01-01')}
                locale="fr-FR"
                textColor="#000000"
                themeVariant="light"
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>

        {/* Modal pour changement de mot de passe */}
        <Modal
          visible={showPasswordModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Modifier le mot de passe</Text>
              
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe actuel"
                placeholderTextColor="#999"
                secureTextEntry
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({...prev, currentPassword: text}))}
              />
              
              <TextInput
                style={styles.passwordInput}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#999"
                secureTextEntry
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({...prev, newPassword: text}))}
              />
              
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmer le nouveau mot de passe"
                placeholderTextColor="#999"
                secureTextEntry
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({...prev, confirmPassword: text}))}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handlePasswordUpdate}
                >
                  <Text style={styles.confirmButtonText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

// Les styles restent identiques...
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#152747',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    padding: 15,
    backgroundColor: '#152747',
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#152747',
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  nameInputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  nameInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#152747',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152747',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#152747',
  },
  passwordButtonText: {
    color: '#152747',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#152747',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#152747',
  },
  dateInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#152747',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  multilineText: {
    lineHeight: 22,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    marginBottom: 5,
  },
  genreButtonSelected: {
    backgroundColor: '#152747',
    borderColor: '#152747',
  },
  genreText: {
    fontSize: 14,
    color: '#666',
  },
  genreTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#27AE60',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Styles pour les modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
  },
  datePicker: {
    height: 200,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  passwordInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: '#152747',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#152747',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfilePage;