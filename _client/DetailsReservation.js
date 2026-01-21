import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const DetailsReservation = ({ route, navigation }) => {
  const { reservation } = route.params;
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategorie, setIsLoadingCategorie] = useState(true);
  const [prestationCategorie, setPrestationCategorie] = useState('');
  
  // États pour la modification
  const [selectedPrestations, setSelectedPrestations] = useState([
    {
      id_prestation: reservation.prestation?.id || reservation.id_prestation,
      titre: reservation.prestation?.titre || 'Prestation',
      prix: reservation.prestation?.prix || 0,
      temps: reservation.prestation?.temps || 30,
      categorie: '',
      description: reservation.prestation?.description,
      intervenant: {
        id: reservation.intervenant?.id || (reservation.employe ? reservation.employe.id : reservation.prestataire?.id),
        prenom: reservation.intervenant?.prenom || (reservation.employe ? reservation.employe.prenom : reservation.prestataire?.prenom),
        nom: reservation.intervenant?.nom || (reservation.employe ? reservation.employe.nom : reservation.prestataire?.nom),
        type: reservation.employe ? 'employe' : 'prestataire'
      },
      selectedDate: new Date(reservation.date),
      selectedTime: {
        start: reservation.heureDebut || reservation.heure_debut,
        end: reservation.heureFin || reservation.heure_fin
      },
      availableTimes: []
    }
  ]);

  // CALENDRIER AVANCÉ
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState([]);
  const [joursFermes, setJoursFermes] = useState([]);
  const [rawHoraires, setRawHoraires] = useState([]);
  const [currentEditingPrestationIndex, setCurrentEditingPrestationIndex] = useState(0);

  // INTERVENANTS - MODIFIÉ SELON LA NOUVELLE REQUÊTE SQL
  const [showIntervenantModal, setShowIntervenantModal] = useState(false);
  const [intervenants, setIntervenants] = useState([]);
  const [filteredIntervenants, setFilteredIntervenants] = useState([]);
  const [isLoadingIntervenants, setIsLoadingIntervenants] = useState(false);
  const [disponibilitesIntervenants, setDisponibilitesIntervenants] = useState({});

  // AJOUTER PRESTATIONS
  const [showAjouterPrestation, setShowAjouterPrestation] = useState(false);
  const [categories, setCategories] = useState([]);
  const [prestationsParCategorie, setPrestationsParCategorie] = useState({});
  const [categoriesExpanded, setCategoriesExpanded] = useState({});
  const [loadingPrestations, setLoadingPrestations] = useState(false);

  // Récupérer l'ID prestataire
  const id_prestataire = reservation.entreprise?.id_prestataire || 
                        reservation.prestataire?.id || 
                        (route.params.prestataireId ? route.params.prestataireId.toString() : null);

  useEffect(() => {
    const initialiserDonnees = async () => {
      try {
        setIsLoadingCategorie(true);
        
        let prestationId = null;
        
        if (reservation.prestation?.id) {
          prestationId = reservation.prestation.id;
        } else if (reservation.id_prestation) {
          prestationId = reservation.id_prestation;
        }
        
        let intervenantInitial = {
          id: reservation.intervenant?.id || (reservation.employe ? reservation.employe.id : reservation.prestataire?.id),
          prenom: reservation.intervenant?.prenom || (reservation.employe ? reservation.employe.prenom : reservation.prestataire?.prenom),
          nom: reservation.intervenant?.nom || (reservation.employe ? reservation.employe.nom : reservation.prestataire?.nom),
          type: reservation.employe ? 'employe' : 'prestataire'
        };
        
        if (!intervenantInitial.id || intervenantInitial.id === undefined) {
          const intervenantAPI = await fetchIntervenantFromReservation();
          if (intervenantAPI && intervenantAPI.id) {
            intervenantInitial.id = intervenantAPI.id;
            intervenantInitial.type = intervenantAPI.type;
          }
        }
        
        const prestationInitiale = {
          id_prestation: prestationId,
          titre: reservation.prestation?.titre || 'Prestation',
          prix: reservation.prestation?.prix || 0,
          temps: reservation.prestation?.temps || 30,
          categorie: '',
          description: reservation.prestation?.description,
          intervenant: intervenantInitial,
          selectedDate: new Date(reservation.date),
          selectedTime: {
            start: reservation.heureDebut || reservation.heure_debut || '09:00',
            end: reservation.heureFin || reservation.heure_fin || '09:30'
          },
          availableTimes: []
        };
        
        setSelectedPrestations([prestationInitiale]);
        
        if (prestationId) {
          const response = await fetch(
            `http://192.168.1.68:3000/api/prestation/modif?id=${prestationId}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.prestation) {
              const categorie = data.categorie_enum || data.categorie || data.prestation.nom_categorie || '';
              setPrestationCategorie(categorie);
              
              setSelectedPrestations(prev => prev.map((presta, index) => 
                index === 0 ? {
                  ...presta,
                  categorie: categorie
                } : presta
              ));
            }
          }
        }
      } catch (error) {
        // Gestion silencieuse de l'erreur
      } finally {
        setIsLoadingCategorie(false);
      }
    };

    initialiserDonnees();
  }, [reservation]);

  // Fonction pour mettre à jour la catégorie dans selectedPrestations
  const updateSelectedPrestationsCategorie = (categorie) => {
    setSelectedPrestations(prev => prev.map((presta, index) => 
      index === 0 ? {
        ...presta,
        categorie: categorie
      } : presta
    ));
  };

  // ==================== FONCTIONS DE BASE ====================
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatHeure = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getStatusColor = (statut, annule) => {
    // Utiliser annulee si annule n'est pas défini
    const estAnnule = annule === 1 || annule === true || 
                     reservation.annulee === 1 || reservation.annulee === true;
    
    if (estAnnule) return '#FF6B6B';
    if (statut === 'reservé' || statut === 'confirmé') return '#4ECDC4';
    if (statut === 'terminé') return '#95E1D3';
    return '#FFD166';
  };

  const getStatusText = (statut, annule) => {
    // Utiliser annulee si annule n'est pas défini
    const estAnnule = annule === 1 || annule === true || 
                     reservation.annulee === 1 || reservation.annulee === true;
    
    if (estAnnule) return 'Annulé';
    if (statut === 'reservé' || statut === 'confirmé') return 'Confirmé';
    if (statut === 'terminé') return 'Terminé';
    return 'En attente';
  };

  const formatTempsEnHeures = (minutes) => {
    if (!minutes) return '0h';
    if (minutes < 60) return `${minutes}min`;
    
    const heures = Math.floor(minutes / 60);
    const minutesRestantes = minutes % 60;
    
    if (minutesRestantes === 0) {
      return `${heures}h`;
    } else {
      return `${heures}h${minutesRestantes.toString().padStart(2, '0')}`;
    }
  };

  const calculerDuree = (heureDebut, heureFin) => {
    if (!heureDebut || !heureFin) return 'Non spécifiée';
    
    const debut = new Date(`2000-01-01T${heureDebut}`);
    const fin = new Date(`2000-01-01T${heureFin}`);
    const diffMs = fin - debut;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const heures = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${heures}h${minutes}` : `${heures}h`;
    }
  };

  const estPasse = () => {
    const maintenant = new Date();
    const dateReservation = new Date(reservation.date);
    const heureReservation = reservation.heureDebut ? new Date(`2000-01-01T${reservation.heureDebut}`) : null;
    
    if (dateReservation < new Date(maintenant.toDateString())) {
      return true;
    }
    
    if (dateReservation.toDateString() === maintenant.toDateString() && heureReservation) {
      const maintenantHeure = new Date(`2000-01-01T${maintenant.toTimeString().substring(0, 8)}`);
      return heureReservation < maintenantHeure;
    }
    
    return false;
  };

  const fetchIntervenantFromReservation = async () => {
    try {
      const reservationId = reservation.id;
      
      const response = await fetch(
        `http://192.168.1.68:3000/api/reservations/${reservationId}/details`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        let intervenantTrouve = null;
        
        if (data.employe && data.employe.id) {
          intervenantTrouve = {
            id: data.employe.id.toString(),
            nom: data.employe.nom,
            prenom: data.employe.prenom,
            type: 'employe'
          };
        } else if (data.prestataire && data.prestataire.id) {
          intervenantTrouve = {
            id: data.prestataire.id.toString(),
            nom: data.prestataire.nom,
            prenom: data.prestataire.prenom,
            type: 'prestataire'
          };
        }
        
        if (intervenantTrouve) {
          setSelectedPrestations(prev => prev.map((presta, index) => 
            index === 0 ? {
              ...presta,
              intervenant: intervenantTrouve
            } : presta
          ));
          
          return intervenantTrouve;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

const goToPreviousMonth = () => {
  const newMonth = new Date(selectedMonth);
  newMonth.setMonth(newMonth.getMonth() - 1);
  setSelectedMonth(newMonth);
  generateCalendarWithAvailability(newMonth, currentEditingPrestationIndex);
};

const goToNextMonth = () => {
  const newMonth = new Date(selectedMonth);
  newMonth.setMonth(newMonth.getMonth() + 1);
  setSelectedMonth(newMonth);
  generateCalendarWithAvailability(newMonth, currentEditingPrestationIndex);
};

  const generateBasicCalendar = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    const firstDayOfWeek = firstDay.getDay();
    const startingEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = 0; i < startingEmptyDays; i++) {
      calendar.push({ isEmpty: true });
    }
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month, day));
      const dateString = currentDate.toISOString().split('T')[0];
      const jourSemaine = getJourSemaineComplet(currentDate);
      
      const dateSelectionnee = new Date(currentDate);
      dateSelectionnee.setHours(0, 0, 0, 0);
      
      let status = 'normal';
      if (dateSelectionnee < aujourdhui) {
        status = 'indisponible';
      }
      
      calendar.push({
        date: currentDate,
        dateString,
        jourSemaine,
        status,
        isFerme: false,
        isOpen: true,
        isToday: isSameDay(currentDate, new Date())
      });
    }
    
    setCalendarDates(calendar);
  };

  const peutModifier = () => {
    // Vérifier si la réservation est annulée (utiliser les deux propriétés possibles)
    const estAnnulee = reservation.annulee === 1 || reservation.annulee === true ||
                      reservation.annule === 1 || reservation.annule === true;
    
    // Ne pas permettre la modification si annulée, passée, ou terminée
    if (estAnnulee) {
      return false;
    }
    
    return !estPasse() && reservation.statut !== 'terminé';
  };

  // ==================== FONCTIONS CALENDRIER AVEC VÉRIFICATIONS ====================
  const getJourSemaineComplet = (date) => {
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return jours[date.getDay()];
  };

const fetchJoursFermes = async (prestataireId) => {
  try {
    const response = await fetch(`http://192.168.1.68:3000/api/jours-fermes/${prestataireId}`);
    if (response.ok) {
      const joursFermesData = await response.json();
      const joursFermesList = joursFermesData
        .filter(jour => jour.is_ferme === 1)
        .map(jour => jour.jour_semaine.toLowerCase());
      
      return joursFermesList;
    }
    return [];
  } catch (error) {
    return [];
  }
};

const fetchHorairesSalon = async () => {
  try {
    const response = await fetch(`http://192.168.1.68:3000/api/horaires/${id_prestataire}`);
    if (response.ok) {
      const horaires = await response.json();
      return horaires;
    }
    return [];
  } catch (error) {
    return [];
  }
};

const verifierDisponibiliteIntervenantPourDate = async (intervenant, date) => {
  try {
    let intervenantId = intervenant.id;
    
    if (!intervenantId || intervenantId === 'undefined' || intervenantId === '') {
      const intervenantTrouve = intervenants.find(int => 
        int && 
        int.prenom === intervenant.prenom && 
        int.nom === intervenant.nom
      );
      
      if (intervenantTrouve && intervenantTrouve.id) {
        intervenantId = intervenantTrouve.id;
      } else {
        const intervenantAPI = await fetchIntervenantFromReservation();
        if (intervenantAPI && intervenantAPI.id) {
          intervenantId = intervenantAPI.id;
        } else {
          return false;
        }
      }
    }

    if (!date || isNaN(date.getTime())) {
      return false;
    }

    const dateNormalisee = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    const datePourAPI = dateNormalisee.toISOString().split('T')[0];
    
    const currentPrestation = selectedPrestations[currentEditingPrestationIndex] || selectedPrestations[0];
    const dureeMinutes = currentPrestation?.temps || 30;

    let employeIdParam = '';
    if (intervenant.type === 'prestataire') {
      employeIdParam = 'prestataire';
    } else {
      employeIdParam = intervenantId.toString();
    }

    const queryParams = new URLSearchParams({
      prestataire_id: id_prestataire,
      employe_id: employeIdParam,
      date: datePourAPI,
      duree_minutes: dureeMinutes.toString()
    });

    if (prestationCategorie) {
      queryParams.append('categorie', prestationCategorie);
    }

    const url = `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${queryParams}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    return data.status === 'disponible';
    
  } catch (error) {
    return false;
  }
};

  const fetchDisponibilitesIntervenantSpecifique = async (intervenantId, intervenantType, date, dureeMinutes) => {
    try {
      const dateNormalisee = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
      const datePourAPI = dateNormalisee.toISOString().split('T')[0];

      let employeIdParam = '';
      if (intervenantType === 'prestataire') {
        employeIdParam = 'prestataire';
      } else {
        employeIdParam = intervenantId;
      }

      const queryParams = new URLSearchParams({
        prestataire_id: id_prestataire,
        employe_id: employeIdParam,
        date: datePourAPI,
        duree_minutes: dureeMinutes
      });

      const url = `http://192.168.1.68:3000/api/disponibilites-intervenant?${queryParams}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      return data.disponibilites || [];
      
    } catch (error) {
      return [];
    }
  };

const generateCalendarWithAvailability = async (monthDate, prestationIndex) => {
  try {
    setIsLoading(true);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const tempCalendar = [];
    const firstDayOfWeek = firstDay.getDay();
    const startingEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = 0; i < startingEmptyDays; i++) {
      tempCalendar.push({ isEmpty: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month, day));
      tempCalendar.push({
        date: currentDate,
        dateString: currentDate.toISOString().split('T')[0],
        jourSemaine: getJourSemaineComplet(currentDate),
        status: 'loading',
        isFerme: false,
        isOpen: true,
        isToday: isSameDay(currentDate, new Date())
      });
    }
    
    setCalendarDates(tempCalendar);
    
    const [joursFermesList, horaires] = await Promise.all([
      fetchJoursFermes(id_prestataire),
      fetchHorairesSalon()
    ]);
    
    setJoursFermes(joursFermesList);
    setRawHoraires(horaires);
    
    const calendar = [];
    for (let i = 0; i < startingEmptyDays; i++) {
      calendar.push({ isEmpty: true });
    }
    
    const prestation = selectedPrestations[prestationIndex] || selectedPrestations[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month, day));
      const dateString = currentDate.toISOString().split('T')[0];
      const jourSemaine = getJourSemaineComplet(currentDate);
      
      const isFermeSalon = joursFermesList.includes(jourSemaine.toLowerCase());
      const isOpen = !isFermeSalon && isJourOuvertInternal(jourSemaine, horaires);
      
      let status = 'normal';
      
      if (isFermeSalon || !isOpen) {
        status = 'ferme';
      } else {
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        const dateSelectionnee = new Date(currentDate);
        dateSelectionnee.setHours(0, 0, 0, 0);
        
        if (dateSelectionnee < aujourdhui) {
          status = 'indisponible';
        } else if (prestation?.intervenant) {
          const estDisponible = await verifierDisponibiliteIntervenantPourDate(
            prestation.intervenant, 
            currentDate
          );
          status = estDisponible ? 'disponible' : 'indisponible_intervenant';
        } else {
          const intervenantsPourCategorie = getIntervenantsFiltresParCategorie(prestation?.categorie || prestationCategorie);
          
          if (intervenantsPourCategorie.length > 0) {
            const estDisponible = await verifierDisponibiliteIntervenantPourDate(
              intervenantsPourCategorie[0], 
              currentDate
            );
            status = estDisponible ? 'disponible' : 'indisponible';
          } else {
            status = 'indisponible';
          }
        }
      }
      
      calendar.push({
        date: currentDate,
        dateString,
        jourSemaine,
        status,
        isFerme: isFermeSalon || !isOpen,
        isOpen,
        isToday: isSameDay(currentDate, new Date())
      });
    }
    
    setCalendarDates(calendar);
    
  } catch (error) {
    generateBasicCalendar(monthDate);
  } finally {
    setIsLoading(false);
  }
};


  const isJourOuvertInternal = (jourSemaine, horaires) => {
    if (!horaires || horaires.length === 0) return true;
    
    const horaireJour = horaires.find(h => h.jour === jourSemaine);
    return horaireJour && !horaireJour.is_ferme;
  };

  const isSameDay = (date1, date2) => {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
  };

  const isDateSelectable = (day) => {
    if (!day || day.isEmpty) return false;
    if (day.isFerme) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(day.date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) return false;
    
    return day.status === 'disponible';
  };

  const loadIntervenants = async () => {
    try {
      setIsLoadingIntervenants(true);
      
      if (!id_prestataire) {
        Alert.alert('Erreur', 'ID prestataire non disponible');
        return;
      }

      const reservationId = reservation.id;
      const response = await fetch(
        `http://192.168.1.68:3000/api/intervenants-par-reservation?id_reservation=${reservationId}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.intervenants && Array.isArray(data.intervenants)) {
        const intervenantsValides = data.intervenants.filter(intervenant => 
          intervenant && typeof intervenant === 'object' && intervenant.id && intervenant.prenom && intervenant.nom
        );
        
        const intervenantsFormates = intervenantsValides.map(intervenant => {
          const type = (intervenant.type === 'prestataire') ? 'prestataire' : 'employe';
          
          const idFormate = intervenant.id ? intervenant.id.toString() : '';
          
          let categoriesNormalisees = [];
          
          return {
            id: idFormate,
            nom: intervenant.nom || '',
            prenom: intervenant.prenom || '',
            type: type,
            categories: categoriesNormalisees,
            categories_raw: intervenant.categorie,
            id_prestataire: intervenant.id_prestataire
          };
        }).filter(intervenant => intervenant !== null && intervenant.id !== '');
        
        setIntervenants(intervenantsFormates);
        
        const currentIntervenant = selectedPrestations[0]?.intervenant;
        if (currentIntervenant && (!currentIntervenant.id || currentIntervenant.id === undefined)) {
          const intervenantTrouve = intervenantsFormates.find(int => 
            int.prenom === currentIntervenant.prenom && 
            int.nom === currentIntervenant.nom
          );
          
          if (intervenantTrouve && intervenantTrouve.id) {
            setSelectedPrestations(prev => prev.map((presta, index) => 
              index === 0 ? {
                ...presta,
                intervenant: {
                  ...presta.intervenant,
                  id: intervenantTrouve.id
                }
              } : presta
            ));
          }
        }
        
        if (data.categorie_prestation) {
          const categorieTrouvee = data.categorie_prestation.toString().trim();
          setPrestationCategorie(categorieTrouvee);
          updateSelectedPrestationsCategorie(categorieTrouvee);
          setIsLoadingCategorie(false);
        }
      }
    } catch (error) {
      // Gestion silencieuse de l'erreur
    } finally {
      setIsLoadingIntervenants(false);
    }
  };

  const getIntervenantsFiltresParCategorie = (categorie) => {
    if (!Array.isArray(intervenants) || intervenants.length === 0) {
      return [];
    }
    
    if (!categorie || categorie.trim() === '') {
      return intervenants.filter(int => int && int.prenom && int.nom);
    }
    
    const categorieRecherchee = categorie.toLowerCase().trim();
    
    const intervenantsFiltres = intervenants.filter(intervenant => {
      if (!intervenant || !intervenant.prenom || !intervenant.nom) {
        return false;
      }
      
      if (!intervenant.categories || !Array.isArray(intervenant.categories) || intervenant.categories.length === 0) {
        return true;
      }
      
      const correspond = intervenant.categories.some(cat => {
        if (!cat) return false;
        
        const categorieNormalisee = cat.toString().toLowerCase().trim();
        
        if (categorieNormalisee === categorieRecherchee) {
          return true;
        }
        
        if (categorieRecherchee.includes(categorieNormalisee) || categorieNormalisee.includes(categorieRecherchee)) {
          return true;
        }
        
        return false;
      });
      
      return correspond;
    });
    
    return intervenantsFiltres;
  };

  // ==================== FONCTIONS PRESTATIONS ====================
  const loadCategoriesEtPrestations = async () => {
    try {
      setLoadingPrestations(true);
      
      const response = await fetch(
        `http://192.168.1.68:3000/api/prestations-confirmation?id_prestataire=${id_prestataire}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const prestationsGrouped = {};
      const categoriesUniques = new Set();

      data.prestations.forEach(presta => {
        const categorie = presta.categorie || 'Sans catégorie';
        categoriesUniques.add(categorie);
        
        if (!prestationsGrouped[categorie]) {
          prestationsGrouped[categorie] = [];
        }
        
        prestationsGrouped[categorie].push(presta);
      });

      setCategories(Array.from(categoriesUniques));
      setPrestationsParCategorie(prestationsGrouped);
      
      const initialExpanded = {};
      Array.from(categoriesUniques).forEach(cat => {
        initialExpanded[cat] = false;
      });
      setCategoriesExpanded(initialExpanded);

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les prestations supplémentaires');
    } finally {
      setLoadingPrestations(false);
    }
  };

  const toggleCategorie = (categorie) => {
    setCategoriesExpanded(prev => ({
      ...prev,
      [categorie]: !prev[categorie]
    }));
  };

  const ajouterPrestation = (nouvellePrestation) => {
    const existeDeja = selectedPrestations.some(
      presta => presta.id_prestation === nouvellePrestation.id_prestation
    );

    if (existeDeja) {
      Alert.alert('Information', 'Cette prestation est déjà sélectionnée');
      return;
    }

    setSelectedPrestations(prev => [
      ...prev,
      {
        ...nouvellePrestation,
        intervenant: null,
        selectedDate: null,
        selectedTime: null,
        availableTimes: []
      }
    ]);

    Alert.alert('Succès', 'Prestation ajoutée à votre sélection');
  };

  const supprimerPrestation = (index) => {
    if (selectedPrestations.length <= 1) {
      Alert.alert('Information', 'Vous devez avoir au moins une prestation');
      return;
    }

    setSelectedPrestations(prev => prev.filter((_, i) => i !== index));
  };

  // ==================== GESTION DES MODALS ====================
  const handleCancelIntervenant = () => {
    setShowIntervenantModal(false);
    setTimeout(() => {
      setShowModifyModal(true);
    }, 300);
  };

  const handleCancelCalendar = () => {
    setShowCalendarModal(false);
    setTimeout(() => {
      setShowModifyModal(true);
    }, 300);
  };

const openCalendar = async (prestationIndex) => {
  setShowModifyModal(false);
  setShowIntervenantModal(false);
  setShowAjouterPrestation(false);
  
  setIsLoading(true);
  
  try {
    setCurrentEditingPrestationIndex(prestationIndex);
    
    const [joursFermesList, horaires] = await Promise.all([
      fetchJoursFermes(id_prestataire),
      fetchHorairesSalon()
    ]);
    
    setJoursFermes(joursFermesList);
    setRawHoraires(horaires);
    
    const currentDate = new Date();
    setSelectedMonth(currentDate);
    
    await generateCalendarWithAvailability(currentDate, prestationIndex);
    
    setShowCalendarModal(true);
    
  } catch (error) {
    const currentDate = new Date();
    setSelectedMonth(currentDate);
    generateBasicCalendar(currentDate);
    setShowCalendarModal(true);
  } finally {
    setIsLoading(false);
  }
};

  const openIntervenantModal = async (prestationIndex) => {
    setCurrentEditingPrestationIndex(prestationIndex);
    
    const prestation = selectedPrestations[prestationIndex] || selectedPrestations[0];
    
    if (prestation.intervenant && (!prestation.intervenant.id || prestation.intervenant.id === undefined)) {
      const intervenantAPI = await fetchIntervenantFromReservation();
      if (intervenantAPI) {
        const updatedPrestations = [...selectedPrestations];
        updatedPrestations[prestationIndex] = {
          ...prestation,
          intervenant: {
            ...prestation.intervenant,
            id: intervenantAPI.id,
            type: intervenantAPI.type
          }
        };
        setSelectedPrestations(updatedPrestations);
      }
    }
    
    const categorieAFiltrer = prestation.categorie || prestationCategorie || '';
    
    if (intervenants.length === 0) {
      await loadIntervenants();
    }
    
    let intervenantsFiltres = [];
    
    if (categorieAFiltrer && categorieAFiltrer.trim() !== '') {
      intervenantsFiltres = getIntervenantsFiltresParCategorie(categorieAFiltrer);
      
      if (intervenantsFiltres.length === 0) {
        intervenantsFiltres = getIntervenantsFiltresParCategorie('');
      }
    } else {
      intervenantsFiltres = getIntervenantsFiltresParCategorie('');
    }
    
    setShowCalendarModal(false);
    setShowModifyModal(false);
    setShowAjouterPrestation(false);
    
    setFilteredIntervenants(intervenantsFiltres);
    setShowIntervenantModal(true);
  };

  // ==================== GESTION DES SÉLECTIONS ====================
  const handleIntervenantSelect = (intervenant) => {
    const updatedPrestations = [...selectedPrestations];
    const index = currentEditingPrestationIndex;
    
    updatedPrestations[index] = {
      ...updatedPrestations[index],
      intervenant: {
        id: intervenant.id,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        type: intervenant.type
      }
    };
    
    setSelectedPrestations(updatedPrestations);
    setShowIntervenantModal(false);
    
    setTimeout(() => {
      setShowModifyModal(true);
    }, 300);
  };

  const handleDateSelection = async (day, prestationIndex) => {
    if (!day.isOpen) {
      Alert.alert('Jour fermé', 'Ce jour est fermé, veuillez choisir une autre date.');
      return;
    }
    
    const nouvellesPrestations = [...selectedPrestations];
    const prestation = nouvellesPrestations[prestationIndex];
    
    nouvellesPrestations[prestationIndex] = {
      ...prestation,
      selectedDate: new Date(day.date),
      selectedTime: null,
      availableTimes: []
    };
    
    setSelectedPrestations(nouvellesPrestations);
    
    setIsLoading(true);
    try {
      let disponibilites = [];
      
      if (prestation.intervenant) {
        disponibilites = await fetchDisponibilitesIntervenantSpecifique(
          prestation.intervenant.id,
          prestation.intervenant.type,
          new Date(day.date),
          prestation.temps
        );
      }
      
      const timeSlots = generateTimeSlotsFromDisponibilites(disponibilites, prestation.temps);
      
      nouvellesPrestations[prestationIndex] = {
        ...nouvellesPrestations[prestationIndex],
        availableTimes: timeSlots
      };
      
      setSelectedPrestations(nouvellesPrestations);
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les créneaux disponibles');
    } finally {
      setIsLoading(false);
    }
    
    setShowCalendarModal(false);
    
    setTimeout(() => {
      setShowModifyModal(true);
    }, 300);
  };

  const generateTimeSlotsFromDisponibilites = (disponibilites, dureeMinutes) => {
    if (!disponibilites || disponibilites.length === 0) return [];
    
    const creneauxUniques = new Set();
    const timeSlots = [];
    
    disponibilites.forEach(creneau => {
      const cle = `${creneau.heure}-${creneau.heure_fin}`;
      
      if (!creneauxUniques.has(cle)) {
        creneauxUniques.add(cle);
        timeSlots.push({
          start: creneau.heure,
          end: creneau.heure_fin,
          isAvailable: true
        });
      }
    });
    
    return timeSlots;
  };

  const handleTimeSelect = (timeSlot, prestationIndex) => {
    if (!timeSlot.isAvailable) return;
    
    const nouvellesPrestations = [...selectedPrestations];
    nouvellesPrestations[prestationIndex] = {
      ...nouvellesPrestations[prestationIndex],
      selectedTime: timeSlot
    };
    
    setSelectedPrestations(nouvellesPrestations);
  };

  // ==================== MODIFICATION DE LA RÉSERVATION ====================
  const handleConfirmationModification = async () => {
    const toutesPrestationsCompletes = selectedPrestations.every(p => 
      p.intervenant && p.selectedDate && p.selectedTime
    );
    
    if (!toutesPrestationsCompletes) {
      Alert.alert('Information', 'Veuillez sélectionner un intervenant, une date et un créneau pour chaque prestation');
      return;
    }

    try {
      setIsLoading(true);
      
      const prestation = selectedPrestations[0];
      
      let idPrestation = prestation.id_prestation;
      
      if (!idPrestation) {
        try {
          const response = await fetch(
            `http://192.168.1.68:3000/api/reservations/${reservation.id}/details`
          );
          
          if (response.ok) {
            const data = await response.json();
            idPrestation = data.prestation?.id;
          }
        } catch (apiError) {
          // Gestion silencieuse de l'erreur
        }
        
        if (!idPrestation) {
          if (prestation.titre && prestation.titre.toLowerCase().includes('teinture')) {
            idPrestation = 22;
          } else {
            Alert.alert(
              'Erreur',
              'Impossible de trouver la prestation. Veuillez réessayer ou contacter le support.',
              [{ text: 'OK' }]
            );
            setIsLoading(false);
            return;
          }
        }
      }
      
      if (!idPrestation || isNaN(parseInt(idPrestation))) {
        Alert.alert('Erreur', 'ID de prestation invalide');
        setIsLoading(false);
        return;
      }
      
      idPrestation = parseInt(idPrestation);
      
      const dateFormatted = prestation.selectedDate.toISOString().split('T')[0];
      const dateTime = `${dateFormatted} ${prestation.selectedTime.start}:00`;
      
      let employeIdParam = '';
      
      if (prestation.intervenant.type === 'prestataire') {
        employeIdParam = 'prestataire';
      } else {
        employeIdParam = prestation.intervenant.id;
      }
      
      const verificationQuery = new URLSearchParams({
        prestataire_id: id_prestataire,
        employe_id: employeIdParam,
        date: dateFormatted,
        duree_minutes: prestation.temps.toString()
      });
      
      const verificationResponse = await fetch(
        `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${verificationQuery}`
      );

      if (!verificationResponse.ok) {
        throw new Error('Erreur de vérification de disponibilité');
      }

      const verificationData = await verificationResponse.json();
      
      if (verificationData.status !== 'disponible') {
        Alert.alert(
          'Indisponible', 
          verificationData.message || 'Le créneau sélectionné n\'est plus disponible. Veuillez choisir un autre créneau.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const modificationData = {
        id_reservation: reservation.id,
        id_prestation: idPrestation,
        date_reservation: dateTime,
        heure_debut: prestation.selectedTime.start,
        heure_fin: prestation.selectedTime.end,
        statut: 'reservé',
        annulee: 0,
        id_client: reservation.id_client || null,
        id_prestataire: id_prestataire,
        id_employe: prestation.intervenant.type === 'employe' ? prestation.intervenant.id : null,
        commentaire: null
      };
      
      if (prestation.intervenant.type === 'prestataire') {
        modificationData.id_employe = null;
        modificationData.id_prestataire = prestation.intervenant.id;
      }
      
      const response = await fetch(`http://192.168.1.68:3000/api/reservations/modifier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationData)
      });

      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Réponse invalide du serveur' };
      }
      
      if (response.ok && responseData.success) {
        Alert.alert(
          'Succès',
          'Votre rendez-vous a été modifié avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowModifyModal(false);
                setShowCalendarModal(false);
                setShowIntervenantModal(false);
                navigation.navigate('MesRendezVous', { refresh: true });
              }
            }
          ]
        );
      } else {
        throw new Error(responseData.error || responseData.message || `Erreur ${response.status}`);
      }
      
    } catch (error) {
      Alert.alert(
        'Erreur', 
        `Impossible de modifier le rendez-vous: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== RENDU DES COMPOSANTS ====================
  const renderCalendarModal = () => {
    if (!showCalendarModal) return null;
    
    const currentPrestation = selectedPrestations[currentEditingPrestationIndex];
    
    return (
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelCalendar}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Choisir une date</Text>
              </View>
              <TouchableOpacity 
                onPress={handleCancelCalendar}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                onPress={goToPreviousMonth}
                style={styles.monthNavButton}
              >
                <Ionicons name="chevron-back" size={24} color="#152747" />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthTitle}>
                {selectedMonth.toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              
              <TouchableOpacity 
                onPress={goToNextMonth}
                style={styles.monthNavButton}
              >
                <Ionicons name="chevron-forward" size={24} color="#152747" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              <View style={styles.calendarDaysHeader}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                  <Text key={`header-${index}`} style={styles.calendarDayHeader}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarDaysGrid}>
                {calendarDates.map((day, index) => {
                  if (day.isEmpty) {
                    return <View key={`empty-${index}`} style={styles.calendarEmptyDay} />;
                  }

                  const isSelectable = isDateSelectable(day);
                  
                  return (
                    <TouchableOpacity
                      key={`day-${index}`}
                      style={[
                        styles.calendarDay,
                        day.isToday && styles.calendarToday,
                        day.isFerme && styles.calendarDayFerme,
                        day.status === 'indisponible' && styles.calendarDayIndisponible,
                        day.status === 'indisponible_intervenant' && styles.calendarDayIndisponibleIntervenant,
                        day.status === 'disponible' && styles.calendarDayDisponible,
                        !isSelectable && styles.calendarDayDisabled
                      ]}
                      onPress={() => {
                        if (isSelectable) {
                          handleDateSelection(day, currentEditingPrestationIndex);
                        }
                      }}
                      disabled={!isSelectable}
                      activeOpacity={isSelectable ? 0.7 : 1}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        (day.isFerme || !isSelectable) && styles.calendarDayTextDisabled,
                        day.isToday && styles.calendarTodayText
                      ]}>
                        {day.date.getDate()}
                      </Text>
                      
                      {day.isFerme ? (
                        <Ionicons name="close-circle" size={10} color="#FF6B6B" />
                      ) : day.status === 'disponible' ? (
                        <Ionicons name="checkmark-circle" size={10} color="#4ECDC4" />
                      ) : day.status === 'indisponible_intervenant' ? (
                        <Ionicons name="person-remove" size={10} color="#FFA500" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, styles.legendDisponible]} />
                <Text style={styles.legendText}>Disponible</Text>
              </View>

              {currentPrestation?.intervenant && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, styles.legendIndisponibleIntervenant]} />
                  <Text style={styles.legendText}>Intervenant indisponible</Text>
                </View>
              )}
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, styles.legendFerme]} />
                <Text style={styles.legendText}>Fermé</Text>
              </View>
            </View>

            <View style={styles.calendarButtons}>
              <TouchableOpacity 
                style={styles.cancelCalendarButton}
                onPress={handleCancelCalendar}
              >
                <Text style={styles.cancelCalendarButtonText}>Retour à la modification</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderIntervenantModal = () => {
    if (!showIntervenantModal) return null;
    
    const currentPrestation = selectedPrestations[currentEditingPrestationIndex];
    const currentIntervenant = currentPrestation?.intervenant;
    
    let intervenantsAAfficher = [...filteredIntervenants || []];
    
    if (currentIntervenant && currentIntervenant.prenom && currentIntervenant.nom) {
      const alreadyInList = intervenantsAAfficher.some(
        int => int.prenom === currentIntervenant.prenom && int.nom === currentIntervenant.nom
      );
      
      if (!alreadyInList) {
        intervenantsAAfficher = [
          {
            id: currentIntervenant.id,
            nom: currentIntervenant.nom,
            prenom: currentIntervenant.prenom,
            type: currentIntervenant.type,
            categories: [prestationCategorie].filter(Boolean),
            isCurrent: true
          },
          ...intervenantsAAfficher
        ];
      } else {
        intervenantsAAfficher = intervenantsAAfficher.map(int => ({
          ...int,
          isCurrent: int.prenom === currentIntervenant.prenom && int.nom === currentIntervenant.nom
        }));
        
        intervenantsAAfficher.sort((a, b) => {
          if (a.isCurrent) return -1;
          if (b.isCurrent) return 1;
          return 0;
        });
      }
    }
    
    return (
      <Modal
        visible={showIntervenantModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelIntervenant}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.intervenantModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Choisir un intervenant</Text>
              </View>
              <TouchableOpacity 
                onPress={handleCancelIntervenant}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {isLoadingIntervenants ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#152747" />
                  <Text style={styles.modalLoadingText}>
                    Chargement des intervenants...
                  </Text>
                </View>
              ) : intervenantsAAfficher.length === 0 ? (
                <View style={styles.noIntervenantsContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                  <Text style={styles.noIntervenantsTitle}>
                    Aucun intervenant trouvé
                  </Text>
                  <Text style={styles.noIntervenantsText}>
                    {prestationCategorie 
                      ? `Aucun intervenant n'a la catégorie "${prestationCategorie}"`
                      : 'Aucun intervenant disponible'}
                  </Text>
                </View>
              ) : (
                intervenantsAAfficher.map((intervenant, index) => (
                  <TouchableOpacity
                    key={`intervenant-${intervenant.id || intervenant.prenom}-${index}`}
                    style={[
                      styles.intervenantOption,
                      intervenant.isCurrent && styles.currentIntervenantOption
                    ]}
                    onPress={() => handleIntervenantSelect(intervenant)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.intervenantOptionContent}>
                      <View style={styles.intervenantMainInfo}>
                        <View style={[
                          styles.intervenantNumber,
                          intervenant.isCurrent && styles.currentIntervenantNumber
                        ]}>
                          <Text style={[
                            styles.intervenantNumberText,
                            intervenant.isCurrent && styles.currentIntervenantNumberText
                          ]}>
                            {intervenant.isCurrent ? '✓' : (index + 1)}
                          </Text>
                        </View>
                        <View style={styles.intervenantDetails}>
                          <Text style={[
                            styles.intervenantName,
                            intervenant.isCurrent && styles.currentIntervenantName
                          ]}>
                            {intervenant.prenom} {intervenant.nom}
                          </Text>
                          {intervenant.isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Actuel</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {intervenant.categories && intervenant.categories.length > 0 && (
                        <View style={styles.intervenantCategories}>
                          <Ionicons name="pricetags-outline" size={12} color="#666" />
                          <Text style={styles.intervenantCategoriesText}>
                            {intervenant.categories.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelIntervenantModalButton}
                onPress={handleCancelIntervenant}
              >
                <Text style={styles.cancelIntervenantModalText}>Retour à la modification</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAjouterPrestationSection = () => {
    if (!showAjouterPrestation) return null;

    return (
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Prestations disponibles</Text>
        
        {loadingPrestations ? (
          <View style={styles.loadingPrestations}>
            <ActivityIndicator size="small" color="#152747" />
            <Text style={styles.loadingPrestationsText}>Chargement des prestations...</Text>
          </View>
        ) : categories.length === 0 ? (
          <Text style={styles.noPrestationsText}>Aucune prestation disponible</Text>
        ) : (
          categories.map(categorie => (
            <View key={categorie} style={styles.categorieSection}>
              <TouchableOpacity 
                style={styles.categorieHeader}
                onPress={() => toggleCategorie(categorie)}
              >
                <Text style={styles.categorieHeaderText}>{categorie}</Text>
                <Ionicons 
                  name={categoriesExpanded[categorie] ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {categoriesExpanded[categorie] && (
                <View style={styles.prestationsList}>
                  {prestationsParCategorie[categorie]?.map(presta => (
                    <View key={presta.id_prestation} style={styles.prestationAjoutItem}>
                      <View style={styles.prestationAjoutInfo}>
                        <Text style={styles.prestationAjoutTitle}>{presta.titre}</Text>
                        <Text style={styles.prestationAjoutDetails}>
                          {presta.prix} € • {formatTempsEnHeures(presta.temps)}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.ajouterButton}
                        onPress={() => ajouterPrestation(presta)}
                      >
                        <Text style={styles.ajouterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderPrestationItem = (presta, index) => (
    <View key={index} style={styles.prestationItem}>
      <View style={styles.prestationInfo}>
        <View style={styles.prestationHeader}>
          <Text style={styles.prestationTitle}>{presta.titre}</Text>
          {selectedPrestations.length > 1 && (
            <TouchableOpacity onPress={() => supprimerPrestation(index)}>
              <Ionicons name="close" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.prestationDetails}>
          {presta.prix} € • {formatTempsEnHeures(presta.temps)}
        </Text>

        <TouchableOpacity 
          style={[
            styles.intervenantSelection,
            !presta.intervenant && styles.intervenantNotSelected
          ]}
          onPress={() => openIntervenantModal(index)}
          activeOpacity={0.7}
        >
          {presta.intervenant ? (
            <View style={styles.intervenantSelected}>
              <View style={styles.intervenantInfo}>
                <Ionicons name="person" size={14} color="#152747" />
                <Text style={styles.intervenantSelectedText}>
                  {presta.intervenant.prenom} {presta.intervenant.nom}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.intervenantNotSelected}>
              <Ionicons name="person-add" size={14} color="#152747" />
              <Text style={styles.intervenantNotSelectedText}>Choisir un intervenant</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => openCalendar(index)}
        >
          <Ionicons name="calendar" size={20} color="#152747" />
          <Text style={styles.calendarButtonText}>
            {presta.selectedDate 
              ? presta.selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Sélectionner une date'
            }
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>

        {presta.selectedDate && presta.availableTimes.length > 0 && (
          <View style={styles.timeSlotsSection}>
            <Text style={styles.timeSlotsTitle}>Créneaux disponibles</Text>
            <View style={styles.timeSlotsGrid}>
              {presta.availableTimes.map((timeSlot, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.timeSlotButton,
                    presta.selectedTime?.start === timeSlot.start && styles.timeSlotSelected,
                    !timeSlot.isAvailable && styles.timeSlotDisabled
                  ]}
                  onPress={() => handleTimeSelect(timeSlot, index)}
                  disabled={!timeSlot.isAvailable}
                >
                  <Text style={[
                    styles.timeSlotText,
                    presta.selectedTime?.start === timeSlot.start && styles.timeSlotTextSelected,
                    !timeSlot.isAvailable && styles.timeSlotTextDisabled
                  ]}>
                    {timeSlot.start}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderModifyModal = () => (
    <Modal
      visible={showModifyModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowModifyModal(false)}
    >
      <View style={styles.modifyModalOverlay}>
        <View style={styles.modifyModal}>
          <View style={styles.modifyModalHeader}>
            <Text style={styles.modifyModalTitle}>Modifier le rendez-vous</Text>
            <TouchableOpacity onPress={() => setShowModifyModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modifyModalContent}>
            <View style={styles.modifySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vos prestations</Text>
                <TouchableOpacity 
                  style={styles.ajouterPrestationButton}
                  onPress={() => {
                    setShowAjouterPrestation(!showAjouterPrestation);
                    if (!showAjouterPrestation) {
                      loadCategoriesEtPrestations();
                    }
                  }}
                >
                  <Ionicons 
                    name={showAjouterPrestation ? "remove" : "add"} 
                    size={16} 
                    color="#152747" 
                  />
                  <Text style={styles.ajouterPrestationButtonText}>
                    {showAjouterPrestation ? 'Masquer' : 'Ajouter une prestation'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.prestationsList}>
                {selectedPrestations.map((presta, index) => renderPrestationItem(presta, index))}
              </View>

              {renderAjouterPrestationSection()}
            </View>
          </ScrollView>

          <View style={styles.modifyModalFooter}>
            <TouchableOpacity 
              style={[styles.modifyButton, styles.cancelModifyButton]}
              onPress={() => setShowModifyModal(false)}
            >
              <Text style={styles.cancelModifyButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modifyButton, 
                styles.confirmModifyButton,
                (!selectedPrestations.every(p => p.intervenant && p.selectedDate && p.selectedTime)) && styles.buttonDisabled
              ]}
              onPress={handleConfirmationModification}
              disabled={!selectedPrestations.every(p => p.intervenant && p.selectedDate && p.selectedTime)}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmModifyButtonText}>
                  Confirmer les modifications
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ==================== RENDU PRINCIPAL ====================
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du rendez-vous</Text>
        
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.prestationTitle}>
              {reservation.prestation?.titre || 'Prestation non spécifiée'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(reservation.statut, reservation.annule) }
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(reservation.statut, reservation.annule)}
              </Text>
            </View>
          </View>
          
          {reservation.prestation?.description && (
            <Text style={styles.prestationDescription}>
              {reservation.prestation.description}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du rendez-vous</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#007BFF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(reservation.date)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#007BFF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Horaires</Text>
                <Text style={styles.infoValue}>
                  {formatHeure(reservation.heureDebut)} - {formatHeure(reservation.heureFin)}
                </Text>
                <Text style={styles.infoSubtext}>
                  Durée : {calculerDuree(reservation.heureDebut, reservation.heureFin)}
                </Text>
              </View>
            </View>

            {reservation.prestation?.prix && (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={20} color="#007BFF" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Prix</Text>
                  <Text style={styles.priceValue}>
                    {parseFloat(reservation.prestation.prix).toFixed(2)} €
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

{/* Section Intervenant - Gère tous les cas possibles */}
{(() => {
  // Déterminer quel intervenant afficher
  const intervenant = reservation.employe || reservation.prestataire || reservation.intervenant;
  
  if (!intervenant) {
    return null; // Ne rien afficher si pas d'intervenant
  }
  
  const type = reservation.employe ? 'Employé' : 
               reservation.prestataire ? 'Employé' : 
               'Intervenant';
  
  const nomComplet = intervenant.prenom && intervenant.nom
    ? `${intervenant.prenom} ${intervenant.nom}`
    : 'Non spécifié';
    
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Votre intervenant</Text>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#FF6B6B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{type}</Text>
            <Text style={styles.infoValue}>{nomComplet}</Text>
          </View>
        </View>
      </View>
    </View>
  );
})()}

        {/* AFFICHER LE BOUTON SEULEMENT SI ON PEUT MODIFIER (pas annulé, pas passé, pas terminé) */}
        {peutModifier() && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.modifyButtonBottom}
              onPress={() => {
                setShowModifyModal(true);
                loadIntervenants();
                fetchJoursFermes(id_prestataire);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FFF" />
              <Text style={styles.modifyButtonBottomText}>Modifier ce rendez-vous</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderModifyModal()}
      {renderCalendarModal()}
      {renderIntervenantModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 0,
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152747',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  prestationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  prestationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 16,
    paddingHorizontal: 4,
    letterSpacing: -0.3,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152747',
  },
  modifyButtonBottom: {
    backgroundColor: '#152747',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  modifyButtonBottomText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modifyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modifyModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modifyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modifyModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modifyModalContent: {
    padding: 20,
  },
  modifySection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ajouterPrestationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#152747',
  },
  ajouterPrestationButtonText: {
    marginLeft: 6,
    color: '#152747',
    fontWeight: '600',
    fontSize: 14,
  },
  prestationsList: {
    marginBottom: 15,
  },
  prestationItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 15,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  prestationInfo: {
    flex: 1,
  },
  prestationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  prestationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  intervenantSelection: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  intervenantNotSelected: {
    borderColor: '#152747',
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FA',
  },
  intervenantSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intervenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  intervenantSelectedText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#152747',
    fontWeight: '500',
    flex: 1,
  },
  intervenantNotSelectedText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#152747',
    fontStyle: 'italic',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    marginTop: 15,
  },
  calendarButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#152747',
    fontWeight: '500',
  },
  timeSlotsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 10,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  timeSlotButton: {
    width: '48%',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSlotSelected: {
    backgroundColor: '#152747',
    borderColor: '#152747',
  },
  timeSlotDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  timeSlotTextSelected: {
    color: '#FFF',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  categoriesContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 18,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 15,
  },
  loadingPrestations: {
    alignItems: 'center',
    padding: 20,
  },
  loadingPrestationsText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  noPrestationsText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: 20,
  },
  categorieSection: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categorieHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#152747',
  },
  prestationAjoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  prestationAjoutInfo: {
    flex: 1,
  },
  prestationAjoutTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    fontWeight: '500',
  },
  prestationAjoutDetails: {
    fontSize: 12,
    color: '#666',
  },
  ajouterButton: {
    backgroundColor: '#152747',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  ajouterButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modifyModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  modifyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModifyButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  cancelModifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmModifyButton: {
    backgroundColor: '#152747',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.6,
  },
  confirmModifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    padding: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthNavButton: {
    padding: 8,
  },
  calendarGrid: {
    marginBottom: 15,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDayHeader: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarToday: {
    borderColor: '#007BFF',
    borderWidth: 2,
  },
  calendarDayFerme: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF6B6B',
  },
  calendarDayIndisponible: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  calendarDayIndisponibleIntervenant: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFD166',
  },
  calendarDayDisponible: {
    backgroundColor: '#D4EDDA',
    borderColor: '#28A745',
  },
  calendarDayDisabled: {
    opacity: 0.5,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarDayTextDisabled: {
    color: '#999',
  },
  calendarTodayText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  calendarEmptyDay: {
    width: 40,
    height: 50,
    margin: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
    borderWidth: 1,
  },
  legendDisponible: {
    backgroundColor: '#D4EDDA',
    borderColor: '#28A745',
  },
  legendIndisponible: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  legendIndisponibleIntervenant: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFD166',
  },
  legendFerme: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF6B6B',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  calendarButtons: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cancelCalendarButton: {
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelCalendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  intervenantModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalContent: {
    maxHeight: 400,
    padding: 15,
  },
  modalLoading: {
    alignItems: 'center',
    padding: 60,
  },
  modalLoadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  noIntervenantsContainer: {
    alignItems: 'center',
    padding: 60,
  },
  noIntervenantsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152747',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  noIntervenantsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  intervenantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  intervenantOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  intervenantMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  intervenantNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#152747',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  intervenantNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  intervenantDetails: {
    flex: 1,
  },
  intervenantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  currentIntervenantOption: {
    backgroundColor: '#F8FAFF',
    borderLeftWidth: 3,
    borderLeftColor: '#152747',
  },
  currentIntervenantNumber: {
    backgroundColor: '#152747',
  },
  currentIntervenantNumberText: {
    fontSize: 14,
  },
  currentIntervenantName: {
    color: '#152747',
  },
  currentBadge: {
    backgroundColor: '#152747',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  intervenantCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  intervenantCategoriesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelIntervenantModalButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelIntervenantModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    letterSpacing: -0.3,
  },
});

export default DetailsReservation;