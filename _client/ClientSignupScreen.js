import React, { useState } from 'react';
import {
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

const ClientSignupScreen = ({ navigation }) => {
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

  const handleSignup = async () => {
    // Vérification que tous les champs sont remplis
    if (!prenom || !nom || !email || !password || !genre || !dateNaissance || !adresse || !ville || !codePostal || !pays || !numero) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

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

    // Validation du code postal
    if (codePostal.length < 4) {
      Alert.alert('Erreur', 'Veuillez entrer un code postal valide.');
      return;
    }

    // Validation du numéro de téléphone
    if (numero.length < 8) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    // Préparer le numéro complet avec code pays
    const numeroComplet = `${codePays}${numero.replace(/^0+/, '')}`;

    const clientData = {
      email,
      password,
      prenom,
      nom,
      genre,
      date_naissance: datePourBase,
      adresse,
      ville,
      code_postal: codePostal,
      pays,
      numero: numeroComplet,
    };

    console.log('Données envoyées :', JSON.stringify(clientData));

    try {
      const response = await fetch('http://192.168.1.68:3000/signup/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Succès', 'Inscription réussie!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Erreur', data.error || 'Une erreur est survenue lors de l\'inscription.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Connexion au serveur impossible. Vérifiez votre connexion internet.');
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Inscription </Text>
        
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
            style={styles.input}
            placeholder="votre@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

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
              style={styles.phoneInput}
              placeholder="6 12 34 56 78"
              placeholderTextColor="#999"
              value={numero}
              onChangeText={setNumero}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.hint}>Le premier 0 sera automatiquement supprimé</Text>

          {/* Adresse */}
          <Text style={styles.sectionTitle}>Adresse</Text>

          <Text style={styles.label}>Adresse *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre adresse complète"
            placeholderTextColor="#999"
            value={adresse}
            onChangeText={setAdresse}
          />

          <Text style={styles.label}>Ville *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre ville"
            placeholderTextColor="#999"
            value={ville}
            onChangeText={setVille}
          />

          <Text style={styles.label}>Code postal *</Text>
          <TextInput
            style={styles.input}
            placeholder="Code postal"
            placeholderTextColor="#999"
            value={codePostal}
            onChangeText={setCodePostal}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Pays *</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowPaysModal(true)}
          >
            <Text style={pays ? styles.selectorSelectedText : styles.selectorPlaceholder}>
              {pays || 'Choisissez votre pays'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupButton}
            onPress={handleSignup}
          >
            <Text style={styles.signupButtonText}>S'inscrire</Text>
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
    marginBottom: 30,
    color: '#152747',
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

export default ClientSignupScreen;