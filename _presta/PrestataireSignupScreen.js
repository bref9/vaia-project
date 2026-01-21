import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const API_URL = 'http://192.168.1.68:3000';

const PrestataireSignupScreen = ({ navigation }) => {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [genre, setGenre] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [pays, setPays] = useState('');
  const [numero, setNumero] = useState('');
  const [codePays, setCodePays] = useState('+33');
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showPaysModal, setShowPaysModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [numeroError, setNumeroError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const genres = ['femme', 'homme', 'autre'];
  
  const paysListe = [
    'France', 'Belgique', 'Suisse', 'Canada', 'Allemagne', 'Espagne', 'Italie', 'Portugal',
    'Royaume-Uni', 'États-Unis', 'Maroc', 'Algérie', 'Tunisie', 'Luxembourg', 'Monaco'
  ];

  const codesPays = [
    { code: '+33', pays: 'France', drapeau: '🇫🇷' },
    { code: '+32', pays: 'Belgique', drapeau: '🇧🇪' },
    { code: '+41', pays: 'Suisse', drapeau: '🇨🇭' },
    { code: '+1', pays: 'Canada/États-Unis', drapeau: '🇨🇦' },
    { code: '+49', pays: 'Allemagne', drapeau: '🇩🇪' },
    { code: '+34', pays: 'Espagne', drapeau: '🇪🇸' },
    { code: '+39', pays: 'Italie', drapeau: '🇮🇹' },
    { code: '+351', pays: 'Portugal', drapeau: '🇵🇹' },
    { code: '+44', pays: 'Royaume-Uni', drapeau: '🇬🇧' },
    { code: '+212', pays: 'Maroc', drapeau: '🇲🇦' },
    { code: '+213', pays: 'Algérie', drapeau: '🇩🇿' },
    { code: '+216', pays: 'Tunisie', drapeau: '🇹🇳' },
    { code: '+352', pays: 'Luxembourg', drapeau: '🇱🇺' },
    { code: '+377', pays: 'Monaco', drapeau: '🇲🇨' },
    { code: '+31', pays: 'Pays-Bas', drapeau: '🇳🇱' },
    { code: '+46', pays: 'Suède', drapeau: '🇸🇪' },
    { code: '+47', pays: 'Norvège', drapeau: '🇳🇴' },
    { code: '+45', pays: 'Danemark', drapeau: '🇩🇰' },
    { code: '+358', pays: 'Finlande', drapeau: '🇫🇮' },
    { code: '+353', pays: 'Irlande', drapeau: '🇮🇪' }
  ];

  // Fonction pour vérifier l'unicité des identifiants
  const checkUniqueCredentials = async (emailToCheck, numeroToCheck) => {
    if (isChecking) return { emailExists: false, numeroExists: false };

    setIsChecking(true);
    
    try {
      console.log('🔍 Début vérification unicité:', { emailToCheck, numeroToCheck });
      
      const response = await fetch(`${API_URL}/check-unique-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToCheck,
          numero: numeroToCheck
        }),
      });

      console.log('✅ Réponse reçue, status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Données de vérification:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Erreur réseau lors de la vérification:', error);
      
      return { 
        emailExists: false, 
        numeroExists: false,
        networkError: true 
      };
    } finally {
      setIsChecking(false);
    }
  };

  // Vérification en temps réel de l'email
  const handleEmailChange = async (text) => {
    setEmail(text);
    setEmailError('');

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text)) {
      setEmailError('Format d\'email invalide');
      return;
    }

    // Vérification unicité après un délai (debounce)
    if (text && emailRegex.test(text)) {
      setTimeout(async () => {
        try {
          const result = await checkUniqueCredentials(text, null);
          if (result.emailExists) {
            setEmailError(`Cet email est déjà utilisé par un compte ${result.existingUserType}`);
          }
        } catch (error) {
          console.log('Vérification email échouée:', error.message);
        }
      }, 1500);
    }
  };

  // Vérification en temps réel du numéro
  const handleNumeroChange = async (text) => {
    setNumero(text);
    setNumeroError('');

    // Vérification unicité après un délai (debounce)
    if (text && text.length >= 8) {
      setTimeout(async () => {
        try {
          const numeroComplet = `${codePays}${text.replace(/^0+/, '')}`;
          const result = await checkUniqueCredentials(null, numeroComplet);
          if (result.numeroExists) {
            setNumeroError(`Ce numéro est déjà utilisé par un compte ${result.existingUserType}`);
          }
        } catch (error) {
          console.log('Vérification numéro échouée:', error.message);
        }
      }, 1500);
    }
  };

  // Fonction pour convertir la date française en format AAAA-MM-JJ
  const convertirDateEnBase = (dateFr) => {
    if (!dateFr) return '';
    
    const parties = dateFr.split('/');
    if (parties.length !== 3) return '';
    
    const [jour, mois, annee] = parties;
    
    if (jour.length === 2 && mois.length === 2 && annee.length === 4) {
      return `${annee}-${mois}-${jour}`;
    }
    
    return '';
  };

  // Fonction pour formater la saisie en temps réel
  const formaterDateSaisie = (texte) => {
    let numeriques = texte.replace(/[^0-9]/g, '');
    
    if (numeriques.length > 8) {
      numeriques = numeriques.substring(0, 8);
    }
    
    if (numeriques.length > 4) {
      return `${numeriques.substring(0, 2)}/${numeriques.substring(2, 4)}/${numeriques.substring(4)}`;
    } else if (numeriques.length > 2) {
      return `${numeriques.substring(0, 2)}/${numeriques.substring(2)}`;
    } else {
      return numeriques;
    }
  };

  const handleGenreSelect = (selectedGenre) => {
    setGenre(selectedGenre);
    setShowGenreModal(false);
  };

  const handlePaysSelect = (selectedPays) => {
    setPays(selectedPays);
    setShowPaysModal(false);
  };

  const handleCodeSelect = (selectedCode) => {
    setCodePays(selectedCode.code);
    setShowCodeModal(false);
  };

  const getCodePaysDisplay = () => {
    const codeInfo = codesPays.find(item => item.code === codePays);
    return codeInfo ? `${codeInfo.drapeau} ${codeInfo.code}` : codePays;
  };

  const handleNextStep = async () => {
    // Réinitialiser les erreurs
    setEmailError('');
    setNumeroError('');

    // Vérification des champs OBLIGATOIRES seulement
    console.log('🔍 Vérification des champs:', {
      prenom, nom, email, password, genre, dateNaissance, numero
    });

    // Liste des champs obligatoires avec leurs noms
    const champsObligatoires = [
      { value: prenom, name: 'Prénom' },
      { value: nom, name: 'Nom' },
      { value: email, name: 'Email' },
      { value: password, name: 'Mot de passe' },
      { value: genre, name: 'Genre' },
      { value: dateNaissance, name: 'Date de naissance' },
      { value: numero, name: 'Numéro de téléphone' }
    ];

    // Trouver le premier champ obligatoire manquant
    const champManquant = champsObligatoires.find(champ => {
      console.log(`Vérification ${champ.name}:`, champ.value);
      return !champ.value || champ.value.trim() === '';
    });

    if (champManquant) {
      console.log(`❌ Champ manquant: ${champManquant.name}`);
      Alert.alert('Champ obligatoire', `Le champ "${champManquant.name}" est obligatoire.`);
      return;
    }

    console.log('✅ Tous les champs obligatoires sont remplis');

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide.');
      return;
    }

    // Validation de la date
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateNaissance)) {
      Alert.alert('Erreur', 'Veuillez entrer une date valide au format JJ/MM/AAAA.');
      return;
    }

    const datePourBase = convertirDateEnBase(dateNaissance);
    if (!datePourBase) {
      Alert.alert('Erreur', 'Date de naissance invalide.');
      return;
    }

    const [jour, mois, annee] = dateNaissance.split('/');
    const dateObj = new Date(datePourBase);
    if (isNaN(dateObj.getTime())) {
      Alert.alert('Erreur', 'Date de naissance invalide.');
      return;
    }

    // Validation du numéro de téléphone
    if (numero.length < 8) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }

    setLoading(true);

    try {
      // Vérification finale de l'unicité
      const numeroComplet = `${codePays}${numero.replace(/^0+/, '')}`;
      console.log('🔍 Vérification finale des identifiants...');
      
      const verificationResult = await checkUniqueCredentials(email, numeroComplet);
      
      console.log('📊 Résultat vérification finale:', verificationResult);

      // Gérer les erreurs réseau lors de la vérification finale
      if (verificationResult.networkError) {
        Alert.alert(
          'Erreur de connexion', 
          'Impossible de vérifier les identifiants. Vérifiez votre connexion internet et réessayez.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      if (verificationResult.emailExists || verificationResult.numeroExists) {
        if (verificationResult.emailExists) {
          setEmailError(`Cet email est déjà utilisé par un compte ${verificationResult.existingUserType}`);
        }
        if (verificationResult.numeroExists) {
          setNumeroError(`Ce numéro est déjà utilisé par un compte ${verificationResult.existingUserType}`);
        }
        Alert.alert('Erreur', 'Certains identifiants sont déjà utilisés. Veuillez corriger les erreurs.');
        setLoading(false);
        return;
      }

      // Si tout est bon, continuer avec les données (y compris les champs optionnels)
      const prestataireData = {
        email,
        password,
        prenom,
        nom,
        genre,
        date_naissance: datePourBase,
        adresse: adresse || null, // Champ optionnel
        ville: ville || null,     // Champ optionnel
        code_postal: codePostal || null, // Champ optionnel
        pays: pays || null,       // Champ optionnel
        numero: numeroComplet,
      };

      console.log('✅ Toutes les vérifications passées, navigation vers étape 2');
      console.log('📋 Données envoyées:', prestataireData);
      navigation.navigate('EntrepriseInfoSignup', { prestataireData });

    } catch (error) {
      console.error('Erreur lors de la vérification finale:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue lors de la vérification des identifiants. Vérifiez votre connexion et réessayez.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Devenir Prestataire</Text>
        <Text style={styles.subtitle}>Étape 1/2 : Vos informations personnelles</Text>
        
        <View style={styles.formContainer}>
          {/* Informations personnelles */}
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre prénom"
            placeholderTextColor="#999"
            value={prenom}
            onChangeText={setPrenom}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre nom"
            placeholderTextColor="#999"
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Genre *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowGenreModal(true)}
          >
            <Text style={genre ? styles.selectorSelectedText : styles.selectorPlaceholder}>
              {genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Choisissez votre genre'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Date de naissance *</Text>
          <TextInput
            style={styles.input}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#999"
            value={dateNaissance}
            onChangeText={(text) => setDateNaissance(formaterDateSaisie(text))}
            keyboardType="numeric"
            maxLength={10}
          />
          <Text style={styles.hint}>Format: JJ/MM/AAAA</Text>

          {/* Informations de contact */}
          <Text style={styles.sectionTitle}>Informations de contact</Text>

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="votre@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <Text style={styles.label}>Mot de passe *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre mot de passe"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Numéro de téléphone *</Text>
          <View style={styles.phoneContainer}>
            <TouchableOpacity 
              style={styles.codeSelector}
              onPress={() => setShowCodeModal(true)}
            >
              <Text style={styles.codeText}>{getCodePaysDisplay()}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.phoneInput, numeroError ? styles.inputError : null]}
              placeholder="6 12 34 56 78"
              placeholderTextColor="#999"
              value={numero}
              onChangeText={handleNumeroChange}
              keyboardType="phone-pad"
            />
          </View>
          {numeroError ? <Text style={styles.errorText}>{numeroError}</Text> : null}
          <Text style={styles.hint}>Le premier 0 sera automatiquement supprimé</Text>

          {/* Adresse - CHAMPS OPTIONNELS */}
          <Text style={styles.sectionTitle}>Adresse (informations supplémentaires)</Text>

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre adresse complète (optionnel)"
            placeholderTextColor="#999"
            value={adresse}
            onChangeText={setAdresse}
          />

          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre ville (optionnel)"
            placeholderTextColor="#999"
            value={ville}
            onChangeText={setVille}
          />

          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            placeholder="Code postal (optionnel)"
            placeholderTextColor="#999"
            value={codePostal}
            onChangeText={setCodePostal}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Pays</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowPaysModal(true)}
          >
            <Text style={pays ? styles.selectorSelectedText : styles.selectorPlaceholder}>
              {pays || 'Choisissez votre pays (optionnel)'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.nextButton, loading ? styles.nextButtonDisabled : null]}
            onPress={handleNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>Continuer vers l'entreprise</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginLinkText}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal pour sélectionner le genre */}
      <Modal
        visible={showGenreModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenreModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGenreModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choisissez votre genre</Text>
                {genres.map((genreItem) => (
                  <TouchableOpacity
                    key={genreItem}
                    style={[
                      styles.option,
                      genre === genreItem && styles.optionSelected
                    ]}
                    onPress={() => handleGenreSelect(genreItem)}
                  >
                    <Text style={[
                      styles.optionText,
                      genre === genreItem && styles.optionTextSelected
                    ]}>
                      {genreItem.charAt(0).toUpperCase() + genreItem.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal pour sélectionner le pays */}
      <Modal
        visible={showPaysModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaysModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPaysModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, styles.modalContentLarge]}>
                <Text style={styles.modalTitle}>Choisissez votre pays</Text>
                <ScrollView style={styles.scrollModal}>
                  {paysListe.map((paysItem) => (
                    <TouchableOpacity
                      key={paysItem}
                      style={[
                        styles.option,
                        pays === paysItem && styles.optionSelected
                      ]}
                      onPress={() => handlePaysSelect(paysItem)}
                    >
                      <Text style={[
                        styles.optionText,
                        pays === paysItem && styles.optionTextSelected
                      ]}>
                        {paysItem}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal pour sélectionner le code pays */}
      <Modal
        visible={showCodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCodeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, styles.modalContentLarge]}>
                <Text style={styles.modalTitle}>Choisissez votre indicatif</Text>
                <ScrollView style={styles.scrollModal}>
                  {codesPays.map((codeItem) => (
                    <TouchableOpacity
                      key={codeItem.code}
                      style={[
                        styles.option,
                        codePays === codeItem.code && styles.optionSelected
                      ]}
                      onPress={() => handleCodeSelect(codeItem)}
                    >
                      <Text style={styles.optionText}>
                        <Text style={styles.optionEmoji}>{codeItem.drapeau}</Text>
                        {'  '}
                        <Text style={[
                          styles.optionText,
                          codePays === codeItem.code && styles.optionTextSelected
                        ]}>
                          {codeItem.code} - {codeItem.pays}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  inputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fffafa',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -5,
  },
  selector: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  selectorSelectedText: {
    fontSize: 16,
    color: '#152747',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#152747',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  codeSelector: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  codeText: {
    fontSize: 16,
    color: '#152747',
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#152747',
    backgroundColor: '#fafafa',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  nextButton: {
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
  nextButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#152747',
    fontWeight: 'bold',
  },
  // Styles pour les modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalContentLarge: {
    maxHeight: '70%',
  },
  scrollModal: {
    maxHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
    marginBottom: 15,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#E8EDFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#152747',
    fontWeight: 'bold',
  },
  optionEmoji: {
    fontSize: 16,
  },
});

export default PrestataireSignupScreen;