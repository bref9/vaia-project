import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Navbar from '../_index/Navbar';

export default function SalonPresta({ navigation }) {
  
  // ==============================
  // ÉTATS DU COMPOSANT
  // ==============================
  const [tempState, setTempState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prestations, setPrestations] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("prestations");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingPresta, setEditingPresta] = useState(null);
  const [newPresta, setNewPresta] = useState({
    titre: '', prix: '', temps: '', categorie: '', nom_categorie: '', description: '',
  });
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [newEmploye, setNewEmploye] = useState({
    nom: '', prenom: '', mail: '', numero: '', genre: '', 
    adresse: '', code_postal: '', ville: '', pays: '', date_naissance: '', 
    mot_de_passe: '', 
    disponibilites: {} 
  });
  const [isEditingInfos, setIsEditingInfos] = useState(false);
  const [userSession, setUserSession] = useState({
    entreprise: {
      nom: '',
      adresse: '',
      ville: '',
      code_postal: '',
      numero: '',
      informations: '',
      horaires: {}
    },
    avis: []
  });
  const [editedInfos, setEditedInfos] = useState({
    adresse: '',
    ville: '',
    code_postal: '',
    numero: '',
    informations: ''
  });
  const [reponseText, setReponseText] = useState('');
  const [selectedAvisId, setSelectedAvisId] = useState(null);
  const [responses, setResponses] = useState({});
  const [showInputs, setShowInputs] = useState({});
  const [categoriesDispo, setCategoriesDispo] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [motDePasse, setMotDePasse] = useState('');

  // ==============================
  // GESTION DES INFORMATIONS DE L'ENTREPRISE
  // ==============================
  
  // Annuler les modifications des informations
  const handleCancel = () => {
    if (userSession?.entreprise) {
      setEditedInfos({
        nom: userSession.entreprise.nom || '',
        adresse: userSession.entreprise.adresse || '',
        ville: userSession.entreprise.ville || '',
        code_postal: userSession.entreprise.code_postal || '',
        numero: userSession.entreprise.numero || '',
        informations: userSession.entreprise.informations || '',
        horaires: userSession.entreprise.horaires || {}
      });
    }
    setIsEditingInfos(false);
  };

  // Sauvegarder les modifications des informations
  const handleSave = async () => {
    try {
      if (!userSession?.entreprise?.id_entreprise) {
        throw new Error("ID entreprise manquant");
      }

      // Mise à jour des informations de base de l'entreprise
      const entrepriseData = {
        id_entreprise: userSession.entreprise.id_entreprise,
        nom: editedInfos.nom || '',
        adresse: editedInfos.adresse || '',
        ville: editedInfos.ville || '',
        code_postal: editedInfos.code_postal || '',
        numero: editedInfos.numero || '',
        informations: editedInfos.informations || ''
      };

      const entrepriseResponse = await fetch('http://192.168.1.68:3000/salonpresta/entreprise', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(entrepriseData)
      });

      if (!entrepriseResponse.ok) {
        throw new Error('Erreur lors de la mise à jour des informations');
      }

      await entrepriseResponse.json();

      // Mise à jour des horaires
      const horairesData = {
        id_entreprise: userSession.entreprise.id_entreprise,
        horaires: editedInfos.horaires
      };

      const horairesResponse = await fetch('http://192.168.1.68:3000/salonpresta/entreprise/horaires', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(horairesData)
      });

      if (!horairesResponse.ok) {
        throw new Error('Erreur lors de la mise à jour des horaires');
      }

      await horairesResponse.json();

      // Rafraîchir les données
      const updatedResponse = await fetch(`http://192.168.1.68:3000/salonpresta/entreprise?id_prestataire=${userSession.id}`);
      
      if (!updatedResponse.ok) {
        throw new Error('Erreur lors du rafraîchissement');
      }

      const updatedData = await updatedResponse.json();

      setUserSession(prev => ({
        ...prev,
        entreprise: updatedData
      }));

      setIsEditingInfos(false);
      // Message de succès retiré
      
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // Gérer le changement d'horaire
  const handleHoraireChange = (jour, field, value) => {
    setEditedInfos(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [jour]: {
          ...prev.horaires[jour],
          [field]: value
        }
      }
    }));
  };

  // Gérer le changement de pause
  const handlePauseChange = (jour, index, field, value) => {
    setEditedInfos(prev => {
      const newHoraires = { ...prev.horaires };
      const newPauses = [...newHoraires[jour].pauses];
      newPauses[index][field] = value;
      newHoraires[jour].pauses = newPauses;
      
      return {
        ...prev,
        horaires: newHoraires
      };
    });
  };

  // Ajouter une pause
  const addPause = (jour) => {
    setEditedInfos(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [jour]: {
          ...prev.horaires[jour],
          pauses: [...(prev.horaires[jour].pauses || []), { 
            heure_debut: '12:00', 
            heure_fin: '14:00' 
          }]
        }
      }
    }));
  };

  // Supprimer une pause
  const removePause = (jour, index) => {
    setEditedInfos(prev => {
      const newHoraires = { ...prev.horaires };
      const newPauses = [...newHoraires[jour].pauses];
      newPauses.splice(index, 1);
      newHoraires[jour].pauses = newPauses;
      
      return {
        ...prev,
        horaires: newHoraires
      };
    });
  };

  // ==============================
  // EFFET POUR CHARGER LES DONNÉES INITIALES
  // ==============================
  useEffect(() => {
    const fetchSessionAndData = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
          const parsedSession = JSON.parse(session);
          
          if (parsedSession?.id) {
            // Chargement parallèle de toutes les données
            const [
              entrepriseResponse,
              prestationsResponse,
              employesResponse,
              avisResponse
            ] = await Promise.all([
              fetch(`http://192.168.1.68:3000/salonpresta/entreprise?id_prestataire=${parsedSession.id}`),
              fetch(`http://192.168.1.68:3000/salonpresta?id_prestataire=${parsedSession.id}`),
              fetch(`http://192.168.1.68:3000/employes?id_prestataire=${parsedSession.id}`),
              fetch(`http://192.168.1.68:3000/avis?id_prestataire=${parsedSession.id}`)
            ]);

            const [
              entrepriseData,
              prestationsData,
              employesData,
              avisData
            ] = await Promise.all([
              entrepriseResponse.json(),
              prestationsResponse.json(),
              employesResponse.json(),
              avisResponse.json()
            ]);

            // Mise à jour de l'état de session
            setUserSession({
              ...parsedSession,
              entreprise: entrepriseData || {
                nom: '',
                adresse: '',
                ville: '',
                code_postal: '',
                numero: '',
                informations: '',
                horaires: {}
              },
              avis: Array.isArray(avisData) ? avisData : []
            });

            setPrestations(Array.isArray(prestationsData) ? prestationsData : []);
            
            const employesArray = Array.isArray(employesData?.employes) ? employesData.employes : [];
            const categoriesArray = Array.isArray(employesData?.categoriesDisponibles) 
              ? employesData.categoriesDisponibles 
              : [];
            
            setEmployes(employesArray);
            setCategoriesDispo(categoriesArray);
            setCategories(categoriesArray);

            setEditedInfos({
              nom: entrepriseData?.nom || '',
              adresse: entrepriseData?.adresse || '',
              ville: entrepriseData?.ville || '',
              code_postal: entrepriseData?.code_postal || '',
              numero: entrepriseData?.numero || '',
              informations: entrepriseData?.informations || '',
              horaires: entrepriseData?.horaires || '',
            });
          }
        }
      } catch (error) {
        setError('Erreur lors de la récupération des données: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionAndData();
  }, []);

  // ==============================
  // GESTION DES PRESTATIONS
  // ==============================
  
  // Grouper les prestations par catégorie
  const groupedByCategory = prestations.reduce((acc, item) => {
    if (!acc[item.categorie]) acc[item.categorie] = [];
    acc[item.categorie].push(item);
    return acc;
  }, {});

  // Initialiser l'état des catégories dépliées
  useEffect(() => {
    const initialExpanded = {};
    Object.keys(groupedByCategory).forEach(cat => {
      initialExpanded[cat] = false;
    });
    setExpandedCategories(initialExpanded);
  }, [prestations]);

  // Basculer l'affichage d'une catégorie
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
    setEditingPresta(null);
    setShowAddForm(false);
  };

  // Ajouter une prestation
const handleAddPrestation = async () => {
  if (!userSession?.id) return setError("Session utilisateur introuvable.");

  try {
    // Valider les champs avant l'envoi
    if (!newPresta.titre.trim() || !newPresta.categorie.trim() || 
        !newPresta.prix || !newPresta.temps) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const prixNum = parseFloat(newPresta.prix);
    const tempsNum = parseInt(newPresta.temps);

    if (isNaN(prixNum) || isNaN(tempsNum) || prixNum <= 0 || tempsNum <= 0) {
      setError("Veuillez entrer des valeurs numériques valides");
      return;
    }

    const bodyData = {
      titre: newPresta.titre,
      prix: prixNum,
      temps: tempsNum,
      categorie: newPresta.categorie,
      nom_categorie: newPresta.categorie,
      description: newPresta.description || '', // Toujours envoyer une chaîne
      id_prestataire: userSession.id
    };


    const response = await fetch(`http://192.168.1.68:3000/ajouterPrestation/${userSession.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    
    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Réponse serveur invalide");
    }
    
    if (!response.ok) {
      throw new Error(result.error || result.message || "Erreur lors de l'ajout");
    }

    // Succès
    setPrestations([...prestations, { ...bodyData, id: result.id || Date.now() }]);
    setNewPresta({ titre: '', prix: '', temps: '', categorie: '', description: '' });
    setShowAddForm(false);
    setError(null);
    
  } catch (err) {
    console.error('Erreur ajout:', err);
    setError("Erreur lors de l'ajout: " + err.message);
  }
};


  // Mettre à jour une prestation
const handleUpdatePrestation = async () => {
  if (!editingPresta?.id) {
    setError("L'ID de la prestation est manquant.");
    return;
  }

  try {
    // S'assurer que tous les champs requis sont présents
    const updatedData = {
      titre: editingPresta.titre || '',
      prix: parseFloat(editingPresta.prix || 0),
      temps: parseInt(editingPresta.temps || 0),
      categorie: editingPresta.categorie || '',
      nom_categorie: editingPresta.categorie || '',
      description: editingPresta.description || '' // Toujours envoyer une chaîne, même vide
    };

    // Validation des champs obligatoires
    if (!updatedData.titre.trim() || !updatedData.categorie.trim() || 
        isNaN(updatedData.prix) || isNaN(updatedData.temps) || 
        updatedData.prix <= 0 || updatedData.temps <= 0) {
      setError("Veuillez remplir tous les champs obligatoires avec des valeurs valides");
      return;
    }


    const response = await fetch(`http://192.168.1.68:3000/modifierPrestation/${editingPresta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    const responseText = await response.text(); 

    let result;
    try {
      result = JSON.parse(responseText); 
    } catch (parseError) {
      throw new Error("Réponse serveur invalide");
    }

    if (!response.ok) {
      throw new Error(result.message || result.error || "Erreur de mise à jour.");
    }

    // Mise à jour réussie
    setPrestations(prev =>
      prev.map(item => 
        item.id === editingPresta.id ? { ...item, ...updatedData } : item
      )
    );
    setEditingPresta(null);
    setError(null);
    
  } catch (err) {
    console.error('Erreur complète:', err);
    setError("Erreur lors de la mise à jour: " + err.message);
  }
};


  // Rendre un élément de prestation
  const renderPrestationItem = (prestation) => {
    return (
      <View key={`prestation-${prestation.id}`} style={styles.prestationRow}>
        <View style={styles.prestationInfo}>
          <Text style={styles.prestationTitle}>{prestation.titre}</Text>
          <Text style={styles.prestationDetails}>
            {prestation.prix} € • {prestation.temps}min
          </Text>
          <Text style={styles.prestationDescription}>{prestation.description}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => {
              const prestaUpdated = prestations.find(p => p.id === prestation.id) || prestation;
              setEditingPresta(prestaUpdated);
              setShowAddForm(false);
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleDeletePrestation(prestation.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Rendre le formulaire de prestation
  const renderPrestaForm = (isEdit = false) => {
    const formData = isEdit ? editingPresta : newPresta;
    const setFormData = isEdit ? setEditingPresta : setNewPresta;
    const onSubmit = isEdit ? handleUpdatePrestation : handleAddPrestation;

    return (
      <View style={styles.addForm}>
        <Text style={styles.sectionTitle}>{isEdit ? 'Modifier' : 'Ajouter'} une prestation</Text>
        
{['titre', 'prix', 'temps', 'categorie', 'description'].map(field => (
  <View key={`field-${field}`} style={styles.inputGroup}>
    <Text style={styles.label}>
      {field.charAt(0).toUpperCase() + field.slice(1)}
      {field !== 'description' && ' *'}
    </Text>
    <TextInput
      style={styles.input}
      placeholder={`Entrer ${field}${field !== 'description' ? ' (obligatoire)' : ' (optionnel)'}`}
      value={formData?.[field]?.toString() || ''}
      onChangeText={text => {
        // Pour les champs numériques, valider l'entrée
        if (field === 'prix' || field === 'temps') {
          // Accepter seulement les nombres
          const numericValue = text.replace(/[^0-9.]/g, '');
          setFormData({ ...formData, [field]: numericValue });
        } else {
          setFormData({ ...formData, [field]: text });
        }
      }}
      keyboardType={field === 'prix' || field === 'temps' ? 'numeric' : 'default'}
    />
  </View>
))}        
        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.validateButton} onPress={onSubmit}>
            <Text style={styles.validateButtonText}>Valider</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setEditingPresta(null);
              setShowAddForm(false);
              setError(null);
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==============================
  // GESTION DES EMPLOYÉS
  // ==============================
  
  // Récupérer la liste des employés
  const fetchEmployes = async () => {
    if (!userSession?.id) return;
    try {
      const response = await fetch(`http://192.168.1.68:3000/employes?id_prestataire=${userSession.id}`);
      const data = await response.json();
      if (response.ok) {
        setEmployes(Array.isArray(data.employes) ? data.employes : []);
        setCategoriesDispo(Array.isArray(data.categoriesDisponibles) ? data.categoriesDisponibles : []);
        setCategories(Array.isArray(data.categoriesDisponibles) ? data.categoriesDisponibles : []);
      } else {
        setError(data.message || "Erreur lors de la récupération des employés");
      }
    } catch (error) {
      setError("Erreur réseau lors de la récupération des employés");
    }
  };

  // Ajouter un employé
  const handleAddEmploye = async () => {
    if (!userSession?.id) return setError("Session utilisateur introuvable.");

    try {
      const bodyData = {
        ...newEmploye,
        mot_de_passe: motDePasse,
        id_prestataire: userSession.id,
        disponibilite: JSON.stringify(newEmploye.disponibilites),
        categorie: selectedCategories,
        pays: newEmploye.pays || 'France'
      };

      const response = await fetch('http://192.168.1.68:3000/creerEmploye', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchEmployes();
        setNewEmploye({
          nom: '', prenom: '', mail: '', numero: '', genre: '', 
          adresse: '', code_postal: '', ville: '', pays: 'France', date_naissance: '', 
          disponibilites: {}
        });
        setMotDePasse('');
        setSelectedCategories([]);
        setShowAddForm(false);
        setError(null);
        // Message de succès retiré
      } else {
        setError(result.message || "Erreur lors de l'ajout.");
      }
    } catch (err) {
      setError("Erreur lors de l'ajout de l'employé.");
    }
  };

  // Mettre à jour un employé
  const handleUpdateEmploye = async () => {
    if (!editingEmploye?.id_employe) {
      setError("L'ID de l'employé est manquant.");
      return;
    }

    const employeToSend = {
      ...editingEmploye,
      disponibilite: JSON.stringify(editingEmploye.disponibilites || {}),
      categorie: selectedCategories,
      pays: editingEmploye.pays || 'France'
    };

    if (motDePasse) {
      employeToSend.mot_de_passe = motDePasse;
    }

    try {
      const response = await fetch(
        `http://192.168.1.68:3000/modifierEmploye/${editingEmploye.id_employe}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeToSend),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur de mise à jour.');
      }

      if (result.message === 'Employé mis à jour avec succès.') {
        await fetchEmployes();
        setEditingEmploye(null);
        setMotDePasse('');
        setSelectedCategories([]);
        setShowAddForm(false);
        setError(null);
        // Message de succès retiré
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour.');
    }
  };

  // Supprimer un employé (soft delete)
  const handleDeleteEmploye = async (idEmploye) => {
    try {
      const response = await fetch(`http://192.168.1.68:3000/supprimerEmploye/${idEmploye}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supprime: 1 }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error('Erreur de suppression.');
      }
  
      if (result.message === 'Employé supprimé avec succès.') {
        setEmployes(prev => prev.filter(item => item.id_employe !== idEmploye));
        // Message de succès retiré
      } else {
        setError(result.message || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      setError('Erreur lors de la suppression.');
    }
  };

  // Rendre la liste des employés
  const renderEmployes = () => (
    <View style={styles.employeContainer}>
      <Text style={styles.heading}>Liste des employés</Text>
      
      {!editingEmploye && (
        <TouchableOpacity
          onPress={() => {
            setEditingEmploye(null);
            setSelectedCategories([]);
            setNewEmploye({
              nom: '', prenom: '', mail: '', numero: '', genre: '', 
              adresse: '', code_postal: '', ville: '', date_naissance: '', 
              pays: 'France', disponibilites: {}
            });
            setMotDePasse('');
            setShowAddForm(true);
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Créer un employé</Text>
        </TouchableOpacity>
      )}

      {employes.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#777', marginTop: 20 }}>
          Aucune donnée d'employé disponible.
        </Text>
      ) : (
        employes.map((employe) => {
          const dateNaissance = new Date(employe.date_naissance).toLocaleDateString(
            'fr-FR',
            {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }
          );
  
          return (
            <View key={`employe-${employe.id_employe}`} style={styles.prestaCard}>
              <Text style={styles.prestaTitle}>
                {employe.nom} {employe.prenom}
              </Text>
              <Text style={styles.prestaInfo}>Email : {employe.mail}</Text>
              <Text style={styles.prestaInfo}>Téléphone : {employe.numero}</Text>
              <Text style={styles.prestaInfo}>Genre : {employe.genre}</Text>
              <Text style={styles.prestaInfo}>Date de naissance : {dateNaissance}</Text>
              <Text style={styles.prestaInfo}>
                Adresse : {employe.adresse}, {employe.code_postal} {employe.ville}
              </Text>
              <Text style={styles.prestaInfo}>Pays : {employe.pays || 'Non spécifié'}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    const employeUpdated = employes.find(e => e.id_employe === employe.id_employe) || employe;
                    const disponibilitesParsees = employeUpdated.disponibilite
                      ? JSON.parse(employeUpdated.disponibilite)
                      : {};
                    let categories = [];
                    try {
                      categories = JSON.parse(employeUpdated.categorie);
                    } catch (e) {
                      categories = [];
                    }
                    setEditingEmploye({ ...employeUpdated, disponibilites: disponibilitesParsees });
                    setSelectedCategories(Array.isArray(categories) ? categories : []);
                    setShowAddForm(false);
                  }}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteEmploye(employe.id_employe)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // Rendre le formulaire d'employé
  const renderEmployeForm = (isEdit = false) => {
    const formData = isEdit ? editingEmploye : newEmploye;
    const setFormData = isEdit ? setEditingEmploye : setNewEmploye;
    const onSubmit = isEdit ? handleUpdateEmploye : handleAddEmploye;

    return (
      <View style={styles.addForm}>
        <Text style={styles.heading}>{isEdit ? 'Modifier' : 'Créer'} un employé</Text>

        {['nom', 'prenom', 'mail', 'numero', 'genre', 'adresse', 'code_postal', 'ville', 'pays'].map(
          (field) => (
            <View key={`field-${field}`} style={styles.inputGroup}>
              <Text style={styles.label}>
                {field === 'pays' ? 'Pays' : field.charAt(0).toUpperCase() + field.slice(1)}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`Entrer ${field === 'pays' ? 'pays' : field}`}
                value={formData?.[field]?.toString() || ''}
                onChangeText={(text) =>
                  setFormData({ ...formData, [field]: text })
                }
                keyboardType={field === 'numero' ? 'phone-pad' : 'default'}
              />
            </View>
          )
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            secureTextEntry
            value={isEdit ? '' : motDePasse}
            onChangeText={setMotDePasse}
          />
          {isEdit && (
            <Text style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
              Laisser vide pour ne pas modifier le mot de passe
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date de naissance (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2000-01-01"
            value={formData?.date_naissance?.toString() || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, date_naissance: text })
            }
          />
        </View>

        <Text style={styles.label}>Catégories</Text>
        {categories.map((cat) => {
          const selected = selectedCategories.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setSelectedCategories(prev =>
                  prev.includes(cat)
                    ? prev.filter(c => c !== cat)
                    : [...prev, cat]
                );
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                marginVertical: 2,
                backgroundColor: selected ? '#cce5ff' : '#eee',
                borderRadius: 6,
              }}
            >
              <Text>{selected ? '✅' : '⬜️'} {cat}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Disponibilités</Text>
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((jour) => {
            const dispo = formData?.disponibilites?.[jour] || { disponible: false, heure_debut: '', heure_fin: '' };

            return (
              <View key={jour} style={styles.dayAvailability}>
                <Text style={styles.label}>{jour}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={{ marginRight: 10 }}>Disponible :</Text>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      const updated = {
                        ...formData.disponibilites,
                        [jour]: {
                          ...dispo,
                          disponible: !dispo.disponible,
                        },
                      };
                      setFormData({ ...formData, disponibilites: updated });
                    }}
                  >
                    <Text style={styles.checkboxText}>{dispo.disponible ? '✅' : '⬜️'}</Text>
                  </TouchableOpacity>
                </View>

                {dispo.disponible && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 5 }]}
                      placeholder="Heure début (HH:MM)"
                      value={dispo.heure_debut}
                      onChangeText={(text) => {
                        const updated = {
                          ...formData.disponibilites,
                          [jour]: { ...dispo, heure_debut: text },
                        };
                        setFormData({ ...formData, disponibilites: updated });
                      }}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Heure fin (HH:MM)"
                      value={dispo.heure_fin}
                      onChangeText={(text) => {
                        const updated = {
                          ...formData.disponibilites,
                          [jour]: { ...dispo, heure_fin: text },
                        };
                        setFormData({ ...formData, disponibilites: updated });
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.validateButton} onPress={onSubmit}>
          <Text style={styles.validateButtonText}>Valider</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setEditingEmploye(null);
            setShowAddForm(false);
            setError(null);
          }}
          style={{ marginTop: 10 }}
        >
          <Text style={{ textAlign: 'center', color: '#888' }}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ==============================
  // GESTION DES AVIS
  // ==============================
  
  const renderAvis = () => {
    const handleChangeText = (index, text) => {
      if (text.length <= 400) {
        setResponses(prev => ({ ...prev, [index]: text }));
      }
    };

    const handleSubmit = async (avisId, index) => {
      try {
        const response = await fetch('http://192.168.1.68:3000/avis/repondre', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_avis: avisId,
            reponse: responses[index],
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'envoi');
        }

        await response.json();
        // Message de succès retiré

        setShowInputs(prev => ({ ...prev, [index]: false }));

        const updatedAvis = [...userSession.avis];
        updatedAvis[index].reponse = responses[index];
        setUserSession(prev => ({
          ...prev,
          avis: updatedAvis,
        }));
      } catch (error) {
        alert('Erreur : ' + error.message);
      }
    };

    const handleDelete = async (avisId, index) => {
      try {
        const response = await fetch('http://192.168.1.68:3000/avis/supprimer-reponse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_avis: avisId }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }

        // Message de succès retiré

        const updatedAvis = [...userSession.avis];
        updatedAvis[index].reponse = null;
        setUserSession(prev => ({
          ...prev,
          avis: updatedAvis,
        }));

        setResponses(prev => ({ ...prev, [index]: '' }));
        setShowInputs(prev => ({ ...prev, [index]: false }));
      } catch (error) {
        alert('Erreur : ' + error.message);
      }
    };

    // Rendre les étoiles pour la note
    const renderStars = (note) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <Icon
            key={i}
            name={i <= note ? 'star' : 'star-o'}
            size={16}
            color={i <= note ? '#FFD700' : '#ccc'}
            style={{ marginRight: 2 }}
          />
        );
      }
      return <View style={{ flexDirection: 'row' }}>{stars}</View>;
    };

    return (
      <View style={styles.avisContainer}>
        <Text style={styles.avisHeading}>Avis des clients</Text>
        
        {userSession?.avis && userSession.avis.length > 0 ? (
          userSession.avis.map((avis, index) => (
            <View key={`avis-${index}`} style={styles.avisCard}>
              <View style={styles.avisHeader}>
                <View>
                  <Text style={styles.avisAuteur}>
                    {avis.prenom} {avis.nom}
                  </Text>
                  <Text style={styles.avisDate}>
                    {new Date(avis.date_avis).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                {renderStars(avis.note)}
              </View>
              
              <Text style={styles.avisTexte}>"{avis.commentaire}"</Text>

              {avis.reponse && !showInputs[index] && (
                <View style={styles.reponseContainer}>
                  <Text style={styles.reponseLabel}>Votre réponse :</Text>
                  <Text style={styles.reponseText}>{avis.reponse}</Text>
                </View>
              )}

              {!showInputs[index] ? (
                <View style={styles.avisActions}>
                  <TouchableOpacity
                    style={[styles.avisButton, styles.avisButtonPrimary]}
                    onPress={() => setShowInputs(prev => ({ ...prev, [index]: true }))}
                  >
                    <Text style={styles.avisButtonText}>
                      {avis.reponse ? 'Modifier la réponse' : 'Répondre'}
                    </Text>
                  </TouchableOpacity>
                  
                  {avis.reponse && (
                    <TouchableOpacity
                      style={[styles.avisButton, styles.avisButtonDanger]}
                      onPress={() => handleDelete(avis.id_avis, index)}
                    >
                      <Text style={styles.avisButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.reponseForm}>
                  <TextInput
                    style={styles.reponseInput}
                    multiline
                    numberOfLines={4}
                    maxLength={400}
                    placeholder="Écrivez votre réponse ici..."
                    value={responses[index] ?? avis.reponse ?? ''}
                    onChangeText={text => handleChangeText(index, text)}
                  />
                  <Text style={styles.charCount}>
                    {(responses[index] ?? avis.reponse ?? '').length}/400 caractères
                  </Text>
                  <View style={styles.reponseFormActions}>
                    <TouchableOpacity
                      style={[styles.avisButton, styles.avisButtonSecondary]}
                      onPress={() => setShowInputs(prev => ({ ...prev, [index]: false }))}
                    >
                      <Text style={styles.avisButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.avisButton, styles.avisButtonSuccess]}
                      onPress={() => handleSubmit(avis.id_avis, index)}
                    >
                      <Text style={styles.avisButtonText}>Envoyer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noAvisContainer}>
            <Icon name="comment-o" size={50} color="#ccc" />
            <Text style={styles.noAvisText}>Aucun avis disponible pour le moment</Text>
          </View>
        )}
      </View>
    );
  };

  // ==============================
  // RENDU DE L'ONGLET "À PROPOS"
  // ==============================
  const renderAPropos = () => {
    if (!userSession?.entreprise) {
      return <Text>Chargement des informations...</Text>;
    }

    const formatTime = (timeString) => {
      if (!timeString) return '';
      return timeString.length >= 5 ? timeString.substring(0, 5) : timeString;
    };

    const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>À propos</Text>

        <View style={styles.infoItem}>
          <Icon name="building" size={16} color="#555" style={styles.infoIcon} />
          <TextInput
            style={styles.editableInput}
            value={editedInfos.nom || userSession.entreprise.nom || ''}
            onChangeText={text => setEditedInfos({...editedInfos, nom: text})}
            editable={isEditingInfos}
            placeholder="Nom du salon"
          />
        </View>

        <View style={styles.infoItem}>
          <Icon name="map-marker" size={16} color="#555" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.editableInput}
              value={editedInfos.adresse || userSession.entreprise.adresse || ''}
              onChangeText={text => setEditedInfos({...editedInfos, adresse: text})}
              editable={isEditingInfos}
              placeholder="Adresse"
            />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TextInput
                style={[styles.editableInput, { flex: 2, marginRight: 5 }]}
                value={editedInfos.code_postal || userSession.entreprise.code_postal || ''}
                onChangeText={text => setEditedInfos({...editedInfos, code_postal: text})}
                editable={isEditingInfos}
                placeholder="Code postal"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.editableInput, { flex: 3 }]}
                value={editedInfos.ville || userSession.entreprise.ville || ''}
                onChangeText={text => setEditedInfos({...editedInfos, ville: text})}
                editable={isEditingInfos}
                placeholder="Ville"
              />
            </View>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="phone" size={16} color="#555" style={styles.infoIcon} />
          <TextInput
            style={styles.editableInput}
            value={editedInfos.numero || userSession.entreprise.numero || ''}
            onChangeText={text => setEditedInfos({...editedInfos, numero: text})}
            editable={isEditingInfos}
            keyboardType="phone-pad"
            placeholder="Numéro de téléphone"
          />
        </View>

        <View style={styles.infoItem}>
          <Icon name="info-circle" size={16} color="#555" style={styles.infoIcon} />
          <TextInput
            style={[styles.editableInput, { height: 100, textAlignVertical: 'top' }]}
            value={editedInfos.informations || userSession.entreprise.informations || ''}
            onChangeText={text => setEditedInfos({...editedInfos, informations: text})}
            editable={isEditingInfos}
            multiline
            placeholder="Informations supplémentaires"
          />
        </View>

        <Text style={styles.subSectionTitle}>Horaires d'ouverture</Text>
        
        {joursSemaine.map(jour => {
          const horaire = editedInfos.horaires?.[jour] || {
            is_ferme: true,
            heure_ouverture: '09:00',
            heure_fermeture: '18:00',
            pauses: []
          };

          return (
            <View key={`horaire-${jour}`} style={styles.horaireContainer}>
              <Text style={styles.horaireJour}>
                {jour.charAt(0).toUpperCase() + jour.slice(1)}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ marginRight: 10 }}>Fermé ce jour :</Text>
                <Switch
                  value={horaire.is_ferme}
                  onValueChange={value => handleHoraireChange(jour, 'is_ferme', value)}
                  disabled={!isEditingInfos}
                />
              </View>

              {!horaire.is_ferme && (
                <>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <TextInput
                      style={[styles.editableInput, { flex: 1, marginRight: 5 }]}
                      value={formatTime(horaire.heure_ouverture)}
                      onChangeText={text => handleHoraireChange(jour, 'heure_ouverture', text)}
                      editable={isEditingInfos}
                      placeholder="09:00"
                    />
                    <TextInput
                      style={[styles.editableInput, { flex: 1 }]}
                      value={formatTime(horaire.heure_fermeture)}
                      onChangeText={text => handleHoraireChange(jour, 'heure_fermeture', text)}
                      editable={isEditingInfos}
                      placeholder="18:00"
                    />
                  </View>

                  <Text style={{ marginBottom: 5 }}>Pauses :</Text>
                  {horaire.pauses?.map((pause, index) => (
                    <View key={`pause-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <TextInput
                        style={[styles.editableInput, { flex: 1, marginRight: 5 }]}
                        value={formatTime(pause.heure_debut)}
                        onChangeText={text => handlePauseChange(jour, index, 'heure_debut', text)}
                        editable={isEditingInfos}
                        placeholder="12:00"
                      />
                      <TextInput
                        style={[styles.editableInput, { flex: 1, marginRight: 5 }]}
                        value={formatTime(pause.heure_fin)}
                        onChangeText={text => handlePauseChange(jour, index, 'heure_fin', text)}
                        editable={isEditingInfos}
                        placeholder="14:00"
                      />
                      {isEditingInfos && (
                        <TouchableOpacity onPress={() => removePause(jour, index)}>
                          <Icon name="trash" size={20} color="#dc3545" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {isEditingInfos && (
                    <TouchableOpacity 
                      onPress={() => addPause(jour)}
                      style={{ marginTop: 5 }}
                    >
                      <Text style={{ color: '#007BFF' }}>+ Ajouter une pause</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          );
        })}

        {isEditingInfos ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity 
              onPress={handleSave}
              style={[styles.modifyButton, { backgroundColor: '#28a745' }]}
            >
              <Text style={styles.modifyButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleCancel} 
              style={[styles.modifyButton, { backgroundColor: '#dc3545' }]}
            >
              <Text style={styles.modifyButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => setIsEditingInfos(true)}
            style={[styles.modifyButton, { marginTop: 20 }]}
          >
            <Text style={styles.modifyButtonText}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ==============================
  // RENDU PRINCIPAL
  // ==============================
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Onglets de navigation */}
      <View style={styles.tabsContainer}>
        {['prestations', 'employes', 'avis', 'aPropos'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab === 'prestations' ? 'Prestations' : 
               tab === 'employes' ? 'Employés' : 
               tab === 'avis' ? 'Avis' : 'À propos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu principal */}
      <ScrollView style={styles.content}>
        {selectedTab === "prestations" && (
          <View>
            <View style={styles.header}>
              <Text style={styles.sectionTitle}>Prestations du salon</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                setShowAddForm(!showAddForm);
                setEditingPresta(null);
              }}
              style={styles.centerButton}
            >
              <Text style={styles.addButtonText}>
                {showAddForm ? 'Masquer le formulaire' : 'Ajouter une prestation'}
              </Text>
            </TouchableOpacity>

            {showAddForm && renderPrestaForm(false)}
            {editingPresta && renderPrestaForm(true)}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {Object.entries(groupedByCategory).map(([category, prestations]) => (
              <View key={`category-${category}`} style={styles.categorySection}>
                <TouchableOpacity 
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Icon 
                    name={expandedCategories[category] ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#555" 
                  />
                </TouchableOpacity>
                
                {expandedCategories[category] && (
                  <View style={styles.prestationsList}>
                    {prestations.map(prestation => 
                      prestation.id ? renderPrestationItem(prestation) : null
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {selectedTab === "employes" && (
          <>
            {editingEmploye && renderEmployeForm(true)}
            {showAddForm && !editingEmploye && renderEmployeForm(false)}
            {!editingEmploye && renderEmployes()}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        )}

        {selectedTab === "avis" && renderAvis()}
        {selectedTab === "aPropos" && renderAPropos()}
      </ScrollView>

      {/* Barre de navigation inférieure */}
      <Navbar
        userSession={userSession}
        setUserSession={setUserSession}
        navigation={navigation}
        isLoading={isLoading}
        styles={styles}
      />
    </SafeAreaView>
  );
}

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  activeTab: {
    borderBottomColor: '#152747',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: '#152747',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#152747',
    marginVertical: 20,
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: '#152747',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#152747',
    letterSpacing: 0.2,
  },
  prestationsList: {
    paddingHorizontal: 4,
  },
  prestationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  prestationInfo: {
    flex: 1,
  },
  prestationTitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 4,
    fontWeight: '500',
  },
  prestationDetails: {
    fontSize: 14,
    color: '#152747',
    marginBottom: 6,
    fontWeight: '500',
  },
  prestationDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#152747',
  },
  editButtonText: {
    color: '#152747',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#334155',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  validateButton: {
    backgroundColor: '#152747',
    padding: 14,
    borderRadius: 8,
    flex: 1,
  },
  validateButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
    fontSize: 13,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  employeContainer: {
    marginTop: 8,
  },
  prestaCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  prestaTitle: { 
    fontSize: 18, 
    fontWeight: '600',
    color: '#152747',
    marginBottom: 8,
  },
  prestaInfo: { 
    fontSize: 14, 
    color: '#64748b', 
    marginVertical: 3,
    lineHeight: 20,
  },
  dayAvailability: {
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  checkbox: {
    padding: 4,
  },
  checkboxText: {
    fontSize: 16,
  },
  avisContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  avisHeading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  avisCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reponseLabel: {
    fontWeight: '600',
    fontSize: 13,
    color: '#152747',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reponseContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#152747',
  },
  avisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avisTexte: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'normal',
  },
  avisAuteur: {
    fontWeight: '600',
    fontSize: 16,
    color: '#152747',
  },
  avisDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  reponseText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  avisActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  avisButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  avisButtonPrimary: {
    backgroundColor: '#152747',
  },
  avisButtonSuccess: {
    backgroundColor: '#059669',
  },
  avisButtonDanger: {
    backgroundColor: '#dc2626',
  },
  avisButtonSecondary: {
    backgroundColor: '#64748b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avisButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  reponseForm: {
    marginTop: 12,
  },
  reponseInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
    color: '#334155',
  },
  reponseFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  noAvisContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  noAvisText: {
    marginTop: 16,
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
  tabContent: {
    paddingBottom: 20,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 15,
    marginTop: 4,
    color: '#152747',
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 20,
    color: '#152747',
  },
  horaireContainer: {
    marginBottom: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  horaireJour: {
    fontWeight: '600',
    fontSize: 16,
    color: '#152747',
    marginBottom: 12,
  },
  editableInput: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  modifyButton: {
    backgroundColor: '#152747',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modifyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  centerButton: {
    backgroundColor: '#152747',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 300,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});