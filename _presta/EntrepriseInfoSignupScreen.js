import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const EntrepriseInfoSignupScreen = ({ route, navigation }) => {
  const { prestataireData } = route.params;

  // États pour les informations de l'entreprise
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [adresseEntreprise, setAdresseEntreprise] = useState('');
  const [villeEntreprise, setVilleEntreprise] = useState('');
  const [codePostalEntreprise, setCodePostalEntreprise] = useState('');
  const [numeroEntreprise, setNumeroEntreprise] = useState('');
  const [informations, setInformations] = useState('');

  // États pour les horaires du salon
  const [horaires, setHoraires] = useState({
    lundi: { is_ferme: false, heure_ouverture: '09:00', heure_fermeture: '18:00', pauses: [] },
    mardi: { is_ferme: false, heure_ouverture: '09:00', heure_fermeture: '18:00', pauses: [] },
    mercredi: { is_ferme: false, heure_ouverture: '09:00', heure_fermeture: '18:00', pauses: [] },
    jeudi: { is_ferme: false, heure_ouverture: '09:00', heure_fermeture: '18:00', pauses: [] },
    vendredi: { is_ferme: false, heure_ouverture: '09:00', heure_fermeture: '18:00', pauses: [] },
    samedi: { is_ferme: true, heure_ouverture: '10:00', heure_fermeture: '17:00', pauses: [] },
    dimanche: { is_ferme: true, heure_ouverture: '00:00', heure_fermeture: '00:00', pauses: [] }
  });

  const [showHeureModal, setShowHeureModal] = useState(false);
  const [currentJour, setCurrentJour] = useState('');
  const [currentType, setCurrentType] = useState(''); // 'ouverture' ou 'fermeture'
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [currentPauseJour, setCurrentPauseJour] = useState('');

  const joursSemaine = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ];

  const heures = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0') + ':00'
  );

  const handleFermeChange = (jour, value) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        is_ferme: value
      }
    }));
  };

  const handleHeureChange = (jour, type, heure) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        [type === 'ouverture' ? 'heure_ouverture' : 'heure_fermeture']: heure
      }
    }));
    setShowHeureModal(false);
  };

  const openHeureModal = (jour, type) => {
    setCurrentJour(jour);
    setCurrentType(type);
    setShowHeureModal(true);
  };

  const openPauseModal = (jour) => {
    setCurrentPauseJour(jour);
    setShowPauseModal(true);
  };

  const addPause = (jour, debut, fin) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        pauses: [...prev[jour].pauses, { heure_debut: debut, heure_fin: fin }]
      }
    }));
    setShowPauseModal(false);
  };

  const removePause = (jour, index) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        pauses: prev[jour].pauses.filter((_, i) => i !== index)
      }
    }));
  };

const handleFinalSignup = async () => {
  // Validation des informations de l'entreprise
  if (!nomEntreprise || !adresseEntreprise || !villeEntreprise || !codePostalEntreprise) {
    Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires de l\'entreprise.');
    return;
  }

  // Validation du code postal
  if (codePostalEntreprise.length < 4) {
    Alert.alert('Erreur', 'Veuillez entrer un code postal valide.');
    return;
  }

  console.log('Données finales pour inscription:', JSON.stringify({
    ...prestataireData,
    entreprise: {
      nom: nomEntreprise,
      adresse: adresseEntreprise,
      ville: villeEntreprise,
      code_postal: codePostalEntreprise,
      numero: numeroEntreprise || null,
      informations: informations || null
    },
    horaires: horaires
  }));

  try {
    // Étape 1: Inscrire le prestataire
    const responsePrestataire = await fetch('http://192.168.1.68:3000/signup/prestataire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prestataireData),
    });

    const dataPrestataire = await responsePrestataire.json();

    if (!responsePrestataire.ok) {
      Alert.alert('Erreur', dataPrestataire.error || 'Erreur lors de l\'inscription du prestataire.');
      return;
    }

    // ✅ CORRECTION : Vérifier que l'ID est bien présent
    if (!dataPrestataire.id_prestataire) {
      console.error('❌ ID prestataire manquant dans la réponse:', dataPrestataire);
      Alert.alert('Erreur', 'Erreur lors de la création du compte. ID prestataire manquant.');
      return;
    }

    // Si le prestataire est créé avec succès, on récupère son ID
    const idPrestataire = dataPrestataire.id_prestataire;
    console.log('✅ Prestataire créé avec ID:', idPrestataire);

    // Étape 2: Créer l'entreprise
    const responseEntreprise = await fetch('http://192.168.1.68:3000/signup/entreprise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_prestataire: idPrestataire, // ← UTILISER L'ID RÉCUPÉRÉ
        nom: nomEntreprise,
        adresse: adresseEntreprise,
        ville: villeEntreprise,
        code_postal: codePostalEntreprise,
        numero: numeroEntreprise || null,
        informations: informations || null
      }),
    });

    const dataEntreprise = await responseEntreprise.json();

    if (!responseEntreprise.ok) {
      Alert.alert('Erreur', dataEntreprise.error || 'Erreur lors de la création de l\'entreprise.');
      return;
    }

    console.log('✅ Entreprise créée avec ID:', dataEntreprise.id_entreprise);

    // Étape 3: Créer les horaires du salon
    const responseHoraires = await fetch(`http://192.168.1.68:3000/signup/horaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_entreprise: dataEntreprise.id_entreprise,
        horaires: horaires
      }),
    });

    if (responseHoraires.ok) {
      Alert.alert('Succès', 'Inscription complète réussie!', [
        { 
          text: 'OK', 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      ]);
    } else {
      Alert.alert('Succès partiel', 'Prestataire et entreprise créés, mais erreur avec les horaires.', [
        { 
          text: 'OK', 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      ]);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription finale:', error);
    Alert.alert('Erreur', 'Connexion au serveur impossible. Vérifiez votre connexion internet.');
  }
};



  const PauseModal = ({ visible, onClose, onAddPause, jour }) => {
    const [debut, setDebut] = useState('12:00');
    const [fin, setFin] = useState('14:00');

    const handleAddPause = () => {
      if (debut && fin) {
        onAddPause(jour, debut, fin);
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ajouter une pause</Text>
                
                <Text style={styles.label}>Heure de début</Text>
                <ScrollView style={styles.heureScroll}>
                  {heures.map((heure) => (
                    <TouchableOpacity
                      key={heure}
                      style={[
                        styles.heureOption,
                        debut === heure && styles.heureOptionSelected
                      ]}
                      onPress={() => setDebut(heure)}
                    >
                      <Text style={[
                        styles.heureOptionText,
                        debut === heure && styles.heureOptionTextSelected
                      ]}>
                        {heure}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Heure de fin</Text>
                <ScrollView style={styles.heureScroll}>
                  {heures.map((heure) => (
                    <TouchableOpacity
                      key={heure}
                      style={[
                        styles.heureOption,
                        fin === heure && styles.heureOptionSelected
                      ]}
                      onPress={() => setFin(heure)}
                    >
                      <Text style={[
                        styles.heureOptionText,
                        fin === heure && styles.heureOptionTextSelected
                      ]}>
                        {heure}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleAddPause}>
                    <Text style={styles.confirmButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Informations de l'Entreprise</Text>
        <Text style={styles.subtitle}>Étape 2/2 : Votre entreprise et horaires</Text>
        
        <View style={styles.formContainer}>
          {/* Informations de l'entreprise */}
          <Text style={styles.sectionTitle}>Informations de l'entreprise</Text>
          
          <Text style={styles.label}>Nom de l'entreprise/salon *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de votre entreprise"
            placeholderTextColor="#999"
            value={nomEntreprise}
            onChangeText={setNomEntreprise}
          />

          <Text style={styles.label}>Adresse de l'entreprise *</Text>
          <TextInput
            style={styles.input}
            placeholder="Adresse complète"
            placeholderTextColor="#999"
            value={adresseEntreprise}
            onChangeText={setAdresseEntreprise}
          />

          <Text style={styles.label}>Ville *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ville"
            placeholderTextColor="#999"
            value={villeEntreprise}
            onChangeText={setVilleEntreprise}
          />

          <Text style={styles.label}>Code postal *</Text>
          <TextInput
            style={styles.input}
            placeholder="Code postal"
            placeholderTextColor="#999"
            value={codePostalEntreprise}
            onChangeText={setCodePostalEntreprise}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="Numéro de l'entreprise (optionnel)"
            placeholderTextColor="#999"
            value={numeroEntreprise}
            onChangeText={setNumeroEntreprise}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Informations supplémentaires</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description, spécialités, etc. (optionnel)"
            placeholderTextColor="#999"
            value={informations}
            onChangeText={setInformations}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Horaires du salon */}
          <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
          <Text style={styles.hint}>Définissez les horaires d'ouverture de votre salon</Text>

          {joursSemaine.map((jour) => (
            <View key={jour.key} style={styles.jourContainer}>
              <View style={styles.jourHeader}>
                <Text style={styles.jourLabel}>{jour.label}</Text>
                <Switch
                  value={!horaires[jour.key].is_ferme}
                  onValueChange={(value) => handleFermeChange(jour.key, !value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={!horaires[jour.key].is_ferme ? '#152747' : '#f4f3f4'}
                />
              </View>

              {!horaires[jour.key].is_ferme && (
                <View style={styles.horairesContainer}>
                  <View style={styles.heureGroup}>
                    <Text style={styles.heureLabel}>Ouverture</Text>
                    <TouchableOpacity 
                      style={styles.heureButton}
                      onPress={() => openHeureModal(jour.key, 'ouverture')}
                    >
                      <Text style={styles.heureButtonText}>
                        {horaires[jour.key].heure_ouverture}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.heureGroup}>
                    <Text style={styles.heureLabel}>Fermeture</Text>
                    <TouchableOpacity 
                      style={styles.heureButton}
                      onPress={() => openHeureModal(jour.key, 'fermeture')}
                    >
                      <Text style={styles.heureButtonText}>
                        {horaires[jour.key].heure_fermeture}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!horaires[jour.key].is_ferme && (
                <View style={styles.pausesContainer}>
                  <Text style={styles.pausesTitle}>Pauses</Text>
                  {horaires[jour.key].pauses.map((pause, index) => (
                    <View key={index} style={styles.pauseItem}>
                      <Text style={styles.pauseText}>
                        {pause.heure_debut} - {pause.heure_fin}
                      </Text>
                      <TouchableOpacity 
                        style={styles.deletePauseButton}
                        onPress={() => removePause(jour.key, index)}
                      >
                        <Text style={styles.deletePauseText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={styles.addPauseButton}
                    onPress={() => openPauseModal(jour.key)}
                  >
                    <Text style={styles.addPauseText}>+ Ajouter une pause</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity 
            style={styles.signupButton}
            onPress={handleFinalSignup}
          >
            <Text style={styles.signupButtonText}>Finaliser l'inscription</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal pour sélectionner l'heure */}
      <Modal visible={showHeureModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowHeureModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Choisir l'heure {currentType === 'ouverture' ? 'd\'ouverture' : 'de fermeture'}
                </Text>
                <ScrollView style={styles.heureScroll}>
                  {heures.map((heure) => (
                    <TouchableOpacity
                      key={heure}
                      style={[
                        styles.heureOption,
                        horaires[currentJour]?.[currentType === 'ouverture' ? 'heure_ouverture' : 'heure_fermeture'] === heure && 
                        styles.heureOptionSelected
                      ]}
                      onPress={() => handleHeureChange(currentJour, currentType, heure)}
                    >
                      <Text style={[
                        styles.heureOptionText,
                        horaires[currentJour]?.[currentType === 'ouverture' ? 'heure_ouverture' : 'heure_fermeture'] === heure && 
                        styles.heureOptionTextSelected
                      ]}>
                        {heure}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal pour ajouter une pause */}
      <PauseModal
        visible={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onAddPause={addPause}
        jour={currentPauseJour}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#152747',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
    marginTop: 20,
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    fontSize: 16,
    color: '#152747',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  // Styles pour les horaires
  jourContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  jourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  jourLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#152747',
  },
  horairesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heureGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  heureLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  heureButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  heureButtonText: {
    fontSize: 14,
    color: '#152747',
    fontWeight: '600',
  },
  pausesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pausesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 8,
  },
  pauseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
  },
  pauseText: {
    fontSize: 14,
    color: '#152747',
  },
  deletePauseButton: {
    padding: 4,
  },
  deletePauseText: {
    fontSize: 18,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  addPauseButton: {
    padding: 10,
    backgroundColor: '#e8edff',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  addPauseText: {
    fontSize: 14,
    color: '#152747',
    fontWeight: '600',
  },
  // Styles pour les modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
    marginBottom: 15,
    textAlign: 'center',
  },
  heureScroll: {
    maxHeight: 200,
    marginBottom: 15,
  },
  heureOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  heureOptionSelected: {
    backgroundColor: '#E8EDFF',
  },
  heureOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  heureOptionTextSelected: {
    color: '#152747',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#152747',
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#152747',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#152747',
  },
  backButtonText: {
    color: '#152747',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EntrepriseInfoSignupScreen;