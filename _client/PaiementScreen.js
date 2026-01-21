import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

const PaiementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { prestations: prestationsRaw, entreprise, totalPrice, userData } = route.params;

  const prestations = prestationsRaw.map(presta => ({
    ...presta,
    selectedDate: presta.selectedDate ? new Date(presta.selectedDate) : null,
    selectedTime: presta.selectedTime || null
  }));

  const [userInfo, setUserInfo] = useState(null);
  const [originalUserInfo, setOriginalUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [showProcheForm, setShowProcheForm] = useState(false);
  const [procheInfo, setProcheInfo] = useState({
    prenom: '',
    nom: '',
    mail: '',
    telephone: ''
  });
  const [autorisationChecked, setAutorisationChecked] = useState(false);
  const [reservationPourProche, setReservationPourProche] = useState(false);

  const [carteInfo, setCarteInfo] = useState({
    numero: '',
    dateExpiration: '',
    cryptogramme: '',
    titulaire: ''
  });

  const [applePayAvailable, setApplePayAvailable] = useState(false);

  const paymentMethods = [
    {
      id: 'especes',
      name: 'Paiement en espèces',
      icon: 'money',
      description: 'Payer sur place en liquide'
    },
    {
      id: 'carte',
      name: 'Carte bancaire',
      icon: 'credit-card',
      description: 'Paiement sécurisé par carte'
    },
    {
      id: 'applepay',
      name: 'Apple Pay',
      icon: 'apple',
      description: 'Paiement rapide et sécurisé'
    }
  ];

  useEffect(() => {
    if (userData && userData.id) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }

    checkApplePayAvailability();
  }, []);

  const checkApplePayAvailability = async () => {
    try {
      if (Platform.OS !== 'ios') {
        setApplePayAvailable(false);
        return;
      }

      setApplePayAvailable(Platform.OS === 'ios');
    } catch (error) {
      setApplePayAvailable(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `http://192.168.1.68:3000/profil?id=${userData.id}&type_utilisateur=${userData.role}`
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.profil) {
        setUserInfo(data.profil);
        setOriginalUserInfo(data.profil);
      } else {
        throw new Error('Aucune information utilisateur trouvée');
      }

    } catch (error) {
      setUserInfo({
        prenom: 'Utilisateur',
        nom: 'Connecté',
        mail: 'email@exemple.com',
        numero: 'Non renseigné'
      });
      setOriginalUserInfo({
        prenom: 'Utilisateur',
        nom: 'Connecté',
        mail: 'email@exemple.com',
        numero: 'Non renseigné'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfoInDatabase = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        id: userData.id,
        type_utilisateur: userData.role,
        prenom: userInfo.prenom,
        nom: userInfo.nom,
        mail: userInfo.mail,
        numero: userInfo.numero || null,
        adresse: userInfo.adresse || null,
        ville: userInfo.ville || null,
        code_postal: userInfo.code_postal || null
      };

      const response = await fetch('http://192.168.1.68:3000/api/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOriginalUserInfo({ ...userInfo });
        setUserInfo(result.profil);
        return true;
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      Alert.alert('Erreur', `Impossible de mettre à jour vos informations: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setUserInfo({ ...originalUserInfo });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!userInfo.prenom.trim() || !userInfo.nom.trim() || !userInfo.mail.trim()) {
      Alert.alert('Champs manquants', 'Veuillez remplir au moins le prénom, le nom et l\'email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.mail)) {
      Alert.alert('Email invalide', 'Veuillez saisir une adresse email valide.');
      return;
    }

    const success = await updateUserInfoInDatabase();
    if (success) {
      setIsEditing(false);
    }
  };

  const handleUserInfoChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcheFormChange = (field, value) => {
    setProcheInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCarteFormChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'numero') {
      const cleanValue = value.replace(/\s/g, '');
      formattedValue = cleanValue.replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) {
        formattedValue = formattedValue.substring(0, 19);
      }
    }
    
    if (field === 'dateExpiration') {
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 2) {
        formattedValue = cleanValue;
      } else {
        formattedValue = `${cleanValue.substring(0, 2)}/${cleanValue.substring(2, 4)}`;
      }
      if (formattedValue.length > 5) {
        formattedValue = formattedValue.substring(0, 5);
      }
    }
    
    if (field === 'cryptogramme') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    }
    
    setCarteInfo(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const validerProcheForm = () => {
    if (!procheInfo.prenom.trim() || !procheInfo.nom.trim() || !procheInfo.mail.trim()) {
      Alert.alert('Champs manquants', 'Veuillez remplir au moins le prénom, le nom et l\'email de votre proche.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(procheInfo.mail)) {
      Alert.alert('Email invalide', 'Veuillez saisir une adresse email valide.');
      return false;
    }

    if (!autorisationChecked) {
      Alert.alert('Autorisation requise', 'Vous devez confirmer que vous êtes autorisé à réserver pour votre proche.');
      return false;
    }

    return true;
  };

  const validerCarteForm = () => {
    const numeroCarteClean = carteInfo.numero.replace(/\s/g, '');
    if (numeroCarteClean.length !== 16) {
      Alert.alert('Numéro de carte invalide', 'Le numéro de carte doit contenir 16 chiffres.');
      return false;
    }

    const dateRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!dateRegex.test(carteInfo.dateExpiration)) {
      Alert.alert('Date d\'expiration invalide', 'Veuillez saisir une date au format MM/AA (ex: 12/25).');
      return false;
    }

    const [month, year] = carteInfo.dateExpiration.split('/');
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    if (parseInt(year) < currentYear || 
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      Alert.alert('Carte expirée', 'La date d\'expiration de votre carte est dépassée.');
      return false;
    }

    if (carteInfo.cryptogramme.length !== 3) {
      Alert.alert('Cryptogramme invalide', 'Le cryptogramme doit contenir 3 chiffres.');
      return false;
    }

    if (!carteInfo.titulaire.trim()) {
      Alert.alert('Nom du titulaire manquant', 'Veuillez saisir le nom du titulaire de la carte.');
      return false;
    }

    return true;
  };

  const ajouterProche = () => {
    if (!validerProcheForm()) return;

    setUserInfo({
      prenom: procheInfo.prenom,
      nom: procheInfo.nom,
      mail: procheInfo.mail,
      numero: procheInfo.telephone || 'Non renseigné',
      estUnProche: true
    });

    setReservationPourProche(true);
    setShowProcheForm(false);
    
    setProcheInfo({
      prenom: '',
      nom: '',
      mail: '',
      telephone: ''
    });
    setAutorisationChecked(false);
  };

  const annulerProcheForm = () => {
    setShowProcheForm(false);
    setProcheInfo({
      prenom: '',
      nom: '',
      mail: '',
      telephone: ''
    });
    setAutorisationChecked(false);
  };

  const retablirMesInfos = async () => {
    if (userData && userData.id) {
      await fetchUserInfo();
    }
    setReservationPourProche(false);
  };

  const handlePaymentMethodSelect = (methodId) => {
    if (methodId === 'applepay' && !applePayAvailable) {
      Alert.alert(
        'Apple Pay non disponible',
        'Apple Pay n\'est pas disponible sur votre appareil. Veuillez choisir un autre mode de paiement.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedPaymentMethod(methodId);
    if (methodId !== 'carte') {
      setCarteInfo({
        numero: '',
        dateExpiration: '',
        cryptogramme: '',
        titulaire: ''
      });
    }
  };

  const processApplePay = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = Math.random() > 0.2;
      
      if (success) {
        return true;
      } else {
        throw new Error('Paiement Apple Pay refusé');
      }

    } catch (error) {
      throw error;
    }
  };

  const creerOuRecupererClient = async () => {
    try {
      if (reservationPourProche) {
        const nouveauClientData = {
          nom: userInfo.nom,
          prenom: userInfo.prenom,
          mail: userInfo.mail,
          numero: userInfo.telephone || userInfo.numero || null,
          adresse: userInfo.adresse || null
        };

        const response = await fetch('http://192.168.1.68:3000/api/reservationprestanewclients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nouveauClientData)
        });

        if (response.ok) {
          const result = await response.json();
          return result.id_client;
        } else {
          throw new Error('Erreur création nouveau client');
        }
      } else {
        return userData.id;
      }
    } catch (error) {
      throw error;
    }
  };

  const creerReservation = async (idClient) => {
    try {
      const reservationsPromises = prestations.map(async (presta) => {
        if (!presta.selectedDate || !presta.selectedTime) {
          throw new Error('Date ou heure manquante pour une prestation');
        }

        const dateString = presta.selectedDate.toISOString().split('T')[0];
        
        const reservationData = {
          id_prestation: presta.id_prestation,
          id_client: idClient,
          id_employe: presta.intervenant?.type === 'employe' ? presta.intervenant.id : null,
          id_prestataire: presta.intervenant?.type === 'prestataire' ? presta.intervenant.id : entreprise.id_prestataire,
          date_reservation: dateString,
          heure_debut: presta.selectedTime.start,
          heure_fin: presta.selectedTime.end,
          mode_paiement: selectedPaymentMethod === 'especes' ? 'en espèces' : 'en ligne',
          statut: 'reservé',
          annulee: 0,
          supprimee: 0,
          commentaire: reservationPourProche ? `Réservation pour ${userInfo.prenom} ${userInfo.nom} par ${userData.prenom} ${userData.nom}` : null
        };

        const response = await fetch('http://192.168.1.68:3000/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reservationData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur création réservation: ${errorText}`);
        }

        return await response.json();
      });

      const results = await Promise.all(reservationsPromises);
      return results;

    } catch (error) {
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Information', 'Veuillez sélectionner un mode de paiement');
      return;
    }

    if (selectedPaymentMethod === 'carte' && !validerCarteForm()) {
      return;
    }

    if (selectedPaymentMethod === 'applepay' && !applePayAvailable) {
      Alert.alert('Apple Pay non disponible', 'Veuillez choisir un autre mode de paiement.');
      return;
    }

    if (!userInfo) {
      Alert.alert('Erreur', 'Informations utilisateur manquantes');
      return;
    }

    for (const presta of prestations) {
      if (!presta.selectedDate || !presta.selectedTime || !presta.intervenant) {
        Alert.alert('Erreur', 'Certaines informations de réservation sont incomplètes.');
        return;
      }
    }

    setProcessingPayment(true);

    try {
      if (selectedPaymentMethod === 'applepay') {
        const applePaySuccess = await processApplePay();
        if (!applePaySuccess) {
          throw new Error('Paiement Apple Pay échoué');
        }
      }

      const idClient = await creerOuRecupererClient();
      const reservationsCreees = await creerReservation(idClient);

      navigation.navigate('MesRendezVous');

    } catch (error) {
      let errorMessage = 'Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.';
      
      if (selectedPaymentMethod === 'applepay') {
        errorMessage = 'Le paiement Apple Pay a échoué. Veuillez réessayer ou choisir un autre mode de paiement.';
      } else if (selectedPaymentMethod === 'carte') {
        errorMessage = 'Le paiement par carte a été refusé. Veuillez vérifier vos informations ou choisir un autre mode de paiement.';
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderUserInfo = () => {
    if (!userInfo) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            👤 {reservationPourProche ? 'Informations du proche' : 'Vos informations'}
          </Text>
          <View style={styles.actionButtonsContainer}>
            {!reservationPourProche && !isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditPress}
              >
                <Icon name="edit" size={14} color="#152747" />
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            )}
            {reservationPourProche && (
              <TouchableOpacity 
                style={styles.retablirButton}
                onPress={retablirMesInfos}
              >
                <Text style={styles.retablirButtonText}>Rétablir mes infos</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.userInfoCard}>
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Prénom *</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.prenom}
                  onChangeText={(text) => handleUserInfoChange('prenom', text)}
                  placeholder="Votre prénom"
                />
              </View>
              
              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Nom *</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.nom}
                  onChangeText={(text) => handleUserInfoChange('nom', text)}
                  placeholder="Votre nom"
                />
              </View>
              
              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Email *</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.mail}
                  onChangeText={(text) => handleUserInfoChange('mail', text)}
                  placeholder="email@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Téléphone</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.numero || ''}
                  onChangeText={(text) => handleUserInfoChange('numero', text)}
                  placeholder="06 12 34 56 78"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Adresse</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.adresse || ''}
                  onChangeText={(text) => handleUserInfoChange('adresse', text)}
                  placeholder="Votre adresse"
                />
              </View>

              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Ville</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.ville || ''}
                  onChangeText={(text) => handleUserInfoChange('ville', text)}
                  placeholder="Votre ville"
                />
              </View>

              <View style={styles.editFormRow}>
                <Text style={styles.editFormLabel}>Code postal</Text>
                <TextInput
                  style={styles.editTextInput}
                  value={userInfo.code_postal || ''}
                  onChangeText={(text) => handleUserInfoChange('code_postal', text)}
                  placeholder="Code postal"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom :</Text>
                <Text style={styles.infoValue}>
                  {userInfo.prenom} {userInfo.nom}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email :</Text>
                <Text style={styles.infoValue}>{userInfo.mail}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone :</Text>
                <Text style={styles.infoValue}>
                  {userInfo.numero || userInfo.telephone || 'Non renseigné'}
                </Text>
              </View>

              {userInfo.adresse && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Adresse :</Text>
                  <Text style={styles.infoValue}>{userInfo.adresse}</Text>
                </View>
              )}

              {userInfo.ville && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ville :</Text>
                  <Text style={styles.infoValue}>
                    {userInfo.ville} {userInfo.code_postal ? `(${userInfo.code_postal})` : ''}
                  </Text>
                </View>
              )}
            </>
          )}

          {!reservationPourProche && !isEditing && (
            <TouchableOpacity 
              style={styles.procheButton}
              onPress={() => setShowProcheForm(true)}
            >
              <Icon name="user-plus" size={16} color="#152747" />
              <Text style={styles.procheButtonText}>Réserver pour un proche</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing && (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={[styles.editActionButton, styles.cancelEditActionButton]}
              onPress={handleCancelEdit}
              disabled={loading}
            >
              <Icon name="times" size={16} color="#FFF" />
              <Text style={styles.editActionButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.editActionButton, styles.saveEditActionButton]}
              onPress={handleSaveEdit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="check" size={16} color="#FFF" />
                  <Text style={styles.editActionButtonText}>Sauvegarder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderProcheForm = () => {
    if (!showProcheForm) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.procheFormModal}>
          <Text style={styles.modalTitle}>Réserver pour un proche</Text>
          
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formLabel}>Prénom *</Text>
            <TextInput
              style={styles.textInput}
              value={procheInfo.prenom}
              onChangeText={(text) => handleProcheFormChange('prenom', text)}
              placeholder="Prénom de votre proche"
            />
            
            <Text style={styles.formLabel}>Nom *</Text>
            <TextInput
              style={styles.textInput}
              value={procheInfo.nom}
              onChangeText={(text) => handleProcheFormChange('nom', text)}
              placeholder="Nom de votre proche"
            />
            
            <Text style={styles.formLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={procheInfo.mail}
              onChangeText={(text) => handleProcheFormChange('mail', text)}
              placeholder="email@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.formLabel}>Téléphone</Text>
            <TextInput
              style={styles.textInput}
              value={procheInfo.telephone}
              onChangeText={(text) => handleProcheFormChange('telephone', text)}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
            />
            
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setAutorisationChecked(!autorisationChecked)}
              >
                <Icon 
                  name={autorisationChecked ? "check-square" : "square-o"} 
                  size={20} 
                  color={autorisationChecked ? "#152747" : "#666"} 
                />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Je déclare être autorisé par mon proche à utiliser les services Planity en son nom *
              </Text>
            </View>
          </ScrollView>

          <View style={styles.formButtons}>
            <TouchableOpacity 
              style={[styles.formButton, styles.cancelButton]}
              onPress={annulerProcheForm}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.formButton, styles.addButton]}
              onPress={ajouterProche}
            >
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCarteForm = () => {
    if (selectedPaymentMethod !== 'carte') return null;

    return (
      <View style={styles.carteFormContainer}>
        <Text style={styles.carteFormTitle}>Informations de paiement</Text>
        
        <View style={styles.carteForm}>
          <Text style={styles.formLabel}>Numéro de carte *</Text>
          <TextInput
            style={styles.textInput}
            value={carteInfo.numero}
            onChangeText={(text) => handleCarteFormChange('numero', text)}
            placeholder="1234 5678 9012 3456"
            keyboardType="numeric"
            maxLength={19}
          />
          
          <View style={styles.carteFormRow}>
            <View style={styles.carteFormGroup}>
              <Text style={styles.formLabel}>Date d'expiration *</Text>
              <TextInput
                style={[styles.textInput, styles.smallInput]}
                value={carteInfo.dateExpiration}
                onChangeText={(text) => handleCarteFormChange('dateExpiration', text)}
                placeholder="MM/AA"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            
            <View style={styles.carteFormGroup}>
              <Text style={styles.formLabel}>Cryptogramme *</Text>
              <TextInput
                style={[styles.textInput, styles.smallInput]}
                value={carteInfo.cryptogramme}
                onChangeText={(text) => handleCarteFormChange('cryptogramme', text)}
                placeholder="123"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>
          
          <Text style={styles.formLabel}>Nom du titulaire *</Text>
          <TextInput
            style={styles.textInput}
            value={carteInfo.titulaire}
            onChangeText={(text) => handleCarteFormChange('titulaire', text)}
            placeholder="M. DUPONT Jean"
            autoCapitalize="words"
          />
          
          <View style={styles.securityInfo}>
            <Icon name="lock" size={14} color="#152747" />
            <Text style={styles.securityText}>
              Paiement sécurisé - Vos informations sont cryptées
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderApplePayInfo = () => {
    if (selectedPaymentMethod !== 'applepay') return null;

    return (
      <View style={styles.applePayContainer}>
        <View style={styles.applePayInfo}>
          <Icon name="apple" size={20} color="#000" />
          <Text style={styles.applePayTitle}>Apple Pay</Text>
        </View>
        <Text style={styles.applePayDescription}>
          Cliquez sur "Payer avec Apple Pay" pour ouvrir l'interface de paiement sécurisée.
        </Text>
        <View style={styles.applePaySecurity}>
          <Icon name="lock" size={14} color="#152747" />
          <Text style={styles.applePaySecurityText}>
            Paiement sécurisé par Apple - Aucune information n'est partagée avec le vendeur
          </Text>
        </View>
      </View>
    );
  };

  const renderPrestationsRecap = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Récapitulatif</Text>
      <View style={styles.recapCard}>
        {prestations.map((presta, index) => (
          <View key={index} style={styles.prestationRecapItem}>
            <View style={styles.prestationRecapInfo}>
              <Text style={styles.prestationRecapName}>{presta.titre}</Text>
              <Text style={styles.prestationRecapDetails}>
                {presta.selectedDate?.toLocaleDateString('fr-FR')} à {presta.selectedTime?.start}
                {'\n'}
                Avec {presta.intervenant?.prenom} {presta.intervenant?.nom}
              </Text>
            </View>
            <Text style={styles.prestationRecapPrice}>{parseFloat(presta.prix).toFixed(2)} €</Text>
          </View>
        ))}
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total à régler</Text>
          <Text style={styles.totalPrice}>{totalPrice} €</Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💳 Moyen de paiement</Text>
      <View style={styles.paymentMethodsCard}>
        {paymentMethods.map(method => (
          <View key={method.id}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.id && styles.paymentMethodSelected,
                method.id === 'applepay' && !applePayAvailable && styles.paymentMethodDisabled
              ]}
              onPress={() => handlePaymentMethodSelect(method.id)}
              disabled={method.id === 'applepay' && !applePayAvailable}
            >
              <View style={styles.paymentMethodHeader}>
                <Icon 
                  name={method.icon} 
                  size={20} 
                  color={
                    selectedPaymentMethod === method.id ? '#152747' : 
                    method.id === 'applepay' && !applePayAvailable ? '#CCC' : '#666'
                  } 
                />
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodName,
                    selectedPaymentMethod === method.id && styles.paymentMethodNameSelected,
                    method.id === 'applepay' && !applePayAvailable && styles.paymentMethodNameDisabled
                  ]}>
                    {method.name}
                    {method.id === 'applepay' && !applePayAvailable && ' (Non disponible)'}
                  </Text>
                  <Text style={[
                    styles.paymentMethodDescription,
                    method.id === 'applepay' && !applePayAvailable && styles.paymentMethodDescriptionDisabled
                  ]}>
                    {method.description}
                  </Text>
                </View>
              </View>
              
              {selectedPaymentMethod === method.id && (
                <Icon name="check-circle" size={20} color="#152747" />
              )}
            </TouchableOpacity>
            
            {method.id === 'carte' && selectedPaymentMethod === 'carte' && (
              renderCarteForm()
            )}
            
            {method.id === 'applepay' && selectedPaymentMethod === 'applepay' && (
              renderApplePayInfo()
            )}
          </View>
        ))}
      </View>
    </View>
  );

  if (loading && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#152747" />
        <Text style={styles.loadingText}>Chargement de vos informations...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#152747" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderUserInfo()}

          {renderPrestationsRecap()}

          {renderPaymentMethods()}

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Icon name="info-circle" size={16} color="#152747" />
              <Text style={styles.infoText}>
                {reservationPourProche 
                  ? 'La réservation sera effectuée au nom de votre proche. Vous serez responsable du paiement.'
                  : selectedPaymentMethod === 'especes'
                  ? 'Vous réglerez le montant en espèces directement au salon lors de votre rendez-vous.'
                  : selectedPaymentMethod === 'carte'
                  ? 'Votre paiement est sécurisé. Aucune information n\'est stockée sur nos serveurs.'
                  : selectedPaymentMethod === 'applepay'
                  ? 'Le paiement Apple Pay s\'ouvrira lors de la confirmation. Aucune information de carte n\'est partagée.'
                  : 'Votre réservation sera confirmée après le traitement du paiement.'
                }
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.payButton,
            (!selectedPaymentMethod || processingPayment || isEditing) && styles.payButtonDisabled,
            selectedPaymentMethod === 'applepay' && styles.applePayButton
          ]}
          onPress={handlePayment}
          disabled={!selectedPaymentMethod || processingPayment || isEditing}
        >
          {processingPayment ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Icon 
                name={selectedPaymentMethod === 'applepay' ? "apple" : "lock"} 
                size={16} 
                color="#FFF" 
              />
              <Text style={styles.payButtonText}>
                {selectedPaymentMethod === 'especes' 
                  ? `Confirmer la réservation` 
                  : selectedPaymentMethod === 'carte'
                  ? `Payer par carte ${totalPrice} €`
                  : selectedPaymentMethod === 'applepay'
                  ? `Payer avec Apple Pay`
                  : reservationPourProche 
                    ? 'Réserver pour mon proche' 
                    : 'Payer'
                } {selectedPaymentMethod !== 'carte' && selectedPaymentMethod !== 'applepay' ? totalPrice + ' €' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderProcheForm()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#152747',
    letterSpacing: -0.5,
  },
  headerPlaceholder: {
    width: 30,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 25,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#152747',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#152747',
  },
  userInfoCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  editForm: {
    gap: 16,
    marginBottom: 10,
  },
  editFormRow: {
    gap: 8,
  },
  editFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#152747',
  },
  editTextInput: {
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#152747',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelEditActionButton: {
    backgroundColor: '#a0a0a0',
  },
  saveEditActionButton: {
    backgroundColor: '#152747',
  },
  editActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    width: 80,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#152747',
    fontWeight: '600',
    flex: 1,
  },
  recapCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  prestationRecapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  prestationRecapInfo: {
    flex: 1,
    marginRight: 10,
  },
  prestationRecapName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 4,
  },
  prestationRecapDetails: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  prestationRecapPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152747',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e8e8e8',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152747',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#152747',
  },
  paymentMethodsCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  paymentMethodSelected: {
    backgroundColor: '#f0f4f8',
    borderLeftWidth: 4,
    borderLeftColor: '#152747',
  },
  paymentMethodDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8f8f8',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 15,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 2,
  },
  paymentMethodNameSelected: {
    color: '#152747',
  },
  paymentMethodNameDisabled: {
    color: '#888',
  },
  paymentMethodDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  paymentMethodDescriptionDisabled: {
    color: '#888',
  },
  infoSection: {
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f4f8',
    padding: 18,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#152747',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#152747',
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    padding: 25,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#152747',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  retablirButton: {
    backgroundColor: '#152747',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retablirButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  procheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#152747',
    marginTop: 15,
    gap: 10,
  },
  procheButtonText: {
    color: '#152747',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(21, 39, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  procheFormModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#152747',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 25,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#152747',
    lineHeight: 20,
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#a0a0a0',
  },
  addButton: {
    backgroundColor: '#152747',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  applePayContainer: {
    backgroundColor: '#fafafa',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  applePayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applePayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
  },
  applePayDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  applePaySecurity: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e8e0',
  },
  applePaySecurityText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#152747',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  applePayButton: {
    backgroundColor: '#000',
  },
  carteFormContainer: {
    backgroundColor: '#fafafa',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  carteFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 15,
  },
  carteForm: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  carteFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  carteFormGroup: {
    flex: 1,
  },
  smallInput: {
    textAlign: 'center',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e8e0',
  },
  securityText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#152747',
    fontWeight: '500',
  },
});

export default PaiementScreen;