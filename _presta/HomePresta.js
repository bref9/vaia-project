import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Navbar from '../_index/Navbar';

// Définition des couleurs
const COLORS = {
  primary: '#152747', // Bleu foncé principal
  primaryLight: '#2a3d66',
  primaryDark: '#0e1a2e',
  secondary: '#e8f4fd',
  accent: '#3498db',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#2c3e50',
  textLight: '#7f8c8d',
  border: '#e1e8ed'
};

export default function HomePresta({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [horairesData, setHorairesData] = useState([]);
  const [error, setError] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [viewMode, setViewMode] = useState('semaine');
  const [startOffset, setStartOffset] = useState(-965);
  const [endOffset, setEndOffset] = useState(965);
  const [monthYear, setMonthYear] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isReservationModalVisible, setIsReservationModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHeure, setSelectedHeure] = useState(null);
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [idPrestataire, setIdPrestataire] = useState('');
  const [idClient, setIdClient] = useState('');
  const [idEmploye, setIdEmploye] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [employes, setEmployes] = useState([]);
  const [prestataire, setPrestataire] = useState({ nom: '', prenom: '' });
  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientMail, setClientMail] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [modifiedDate, setModifiedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrestation, setSelectedPrestation] = useState('');
  const [addedPrestations, setAddedPrestations] = useState([]);
  const [showAddPrestation, setShowAddPrestation] = useState(false);
  const [showPrestataireSection, setShowPrestataireSection] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPrestationModal, setShowPrestationModal] = useState(false);
  const [showIntervenantModal, setShowIntervenantModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evenementsSemaine, setEvenementsSemaine] = useState([]);
  const [showAddReservationButton, setShowAddReservationButton] = useState(true);
  const [selectedPrestationDetails, setSelectedPrestationDetails] = useState(null);
  const [intervenantDisponibilites, setIntervenantDisponibilites] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
const [calendarDates, setCalendarDates] = useState([]);
const [selectedMonth, setSelectedMonth] = useState(new Date());
const [joursFermes, setJoursFermes] = useState([]);
const [loadingCalendar, setLoadingCalendar] = useState(false);
const [calendarModalMode, setCalendarModalMode] = useState('form');
const [flowMode, setFlowMode] = useState('prestation-first');
const [disponibilitesParDate, setDisponibilitesParDate] = useState(null);
const [filteredPrestations, setFilteredPrestations] = useState([]);
const [filteredIntervenants, setFilteredIntervenants] = useState([]);
const [selectedDateFromMonth, setSelectedDateFromMonth] = useState(null);
const [isSlotsExpanded, setIsSlotsExpanded] = useState(false);
const [selectionMode, setSelectionMode] = useState('date-first');
const [reservationsDuJour, setReservationsDuJour] = useState([]);
const [selectedReservation, setSelectedReservation] = useState(null);
const [isEditModalVisible, setIsEditModalVisible] = useState(false);
const [selectedReservationForDetail, setSelectedReservationForDetail] = useState(null);
const [showReservationDetail, setShowReservationDetail] = useState(false);
const [editFormData, setEditFormData] = useState({
  heure_debut: '',
  heure_fin: '',
  prestation_titre: '',
  client_prenom: '',
  client_nom: '',
  client_telephone: '',
  client_mail: '',
  commentaire: '',
  statut: ''
});
const [joursStatuts, setJoursStatuts] = useState({});
const [rawHoraires, setRawHoraires] = useState([]);
const [calendarModalMonth, setCalendarModalMonth] = useState(new Date());
const [isCalendarLoading, setIsCalendarLoading] = useState(false);
const [monthDisponibilites, setMonthDisponibilites] = useState({});
const [loadingMonth, setLoadingMonth] = useState(false);

const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '00:00:00') return 0;
  const [heures, minutes] = timeStr.split(':').slice(0, 2).map(Number);
  return heures * 60 + minutes;
};

const getJourSemaineComplet = (date) => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    // CORRECTION : Créer une date locale pour éviter les problèmes UTC
    const localDate = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    );
    
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return jours[localDate.getDay()];
  } catch (error) {
    return '';
  }
};


useEffect(() => {
  if (viewMode === 'semaine' && selectedDateFromMonth) {
    // Attendre que les jours de la semaine soient chargés
    if (joursAvecHoraires.length > 0) {
      
      // Trouver le jour correspondant dans la vue semaine
      const jourSemaine = joursAvecHoraires.find(j => {
        if (!j.date) return false;
        const jDate = new Date(j.date);
        jDate.setHours(0, 0, 0, 0);
        return jDate.getTime() === selectedDateFromMonth.getTime();
      });
      
      
      if (jourSemaine) {
        setSelectedDay(jourSemaine);
      } else {
      }
      
      // Réinitialiser après la sélection
      setSelectedDateFromMonth(null);
    }
  }
}, [viewMode, selectedDateFromMonth, joursAvecHoraires]);


  const chargerStatutsJours = useCallback(async (jours) => {
    const statuts = {};
    for (const jour of jours) {
      if (jour && jour.date) {
        const jourSemaine = getJourSemaineComplet(jour.date).toLowerCase();
        
        // Vérifier si fermé
        const isFerme = Array.isArray(joursFermes) && joursFermes.includes(jourSemaine);
        if (isFerme) {
          statuts[jour.date.toISOString().split('T')[0]] = 'ferme';
          continue;
        }
        
        // Vérifier si le salon est ouvert
        const horaireSalon = rawHoraires.find(h => h.jour === jourSemaine);
        if (!horaireSalon || horaireSalon.is_ferme) {
          statuts[jour.date.toISOString().split('T')[0]] = 'ferme';
          continue;
        }
        
        // Vérifier si au moins un intervenant est disponible
        try {
          const estDisponible = await verifierDisponibiliteReelleOptimisee(jour.date);
          statuts[jour.date.toISOString().split('T')[0]] = estDisponible ? 'disponible' : 'indisponible';
        } catch {
          statuts[jour.date.toISOString().split('T')[0]] = 'indisponible';
        }
      }
    }
    setJoursStatuts(statuts);
  }, [joursFermes, rawHoraires]);

  // Utilisez un useEffect pour charger les statuts quand la semaine change
useEffect(() => {
  if (joursAvecHoraires && joursAvecHoraires.length > 0) {
    chargerStatutsJours(joursAvecHoraires);
  }
}, [joursAvecHoraires, chargerStatutsJours, weekOffset]); // Ajoutez weekOffset ici



useEffect(() => {
  // Charger le calendrier au démarrage
  if (idPrestataire && !isCalendarLoading) {
    generateCalendarWithAvailability(selectedMonth);
  }
}, [idPrestataire]);


// Synchronisation améliorée du calendrier modal
useEffect(() => {
  if (showDatePicker && modifiedDate) {
    // Vérifier si le calendrier modal montre le bon mois
    const modifiedMonth = modifiedDate.getMonth();
    const modifiedYear = modifiedDate.getFullYear();
    const currentModalMonth = calendarModalMonth.getMonth();
    const currentModalYear = calendarModalMonth.getFullYear();
    
    if (modifiedMonth !== currentModalMonth || modifiedYear !== currentModalYear) {
      console.log('🔄 Synchronisation calendrier modal avec date modifiée');
      setCalendarModalMonth(new Date(modifiedDate));
    }
  }
}, [showDatePicker, modifiedDate]);


// Remplacer le useEffect actuel par celui-ci :
useEffect(() => {
  // Ne rafraîchir le calendrier que si nécessaire
  const shouldRefresh = idPrestataire && 
    (showDatePicker || selectedPrestationDetails || selectedCategory || idEmploye);
  
  if (shouldRefresh) {
    console.log('🔄 Rafraîchissement calendrier conditionnel:', { 
      idEmploye, 
      hasPrestation: !!selectedPrestationDetails,
      prestationTemps: selectedPrestationDetails?.temps,
      showDatePicker 
    });
    
    // Utiliser setTimeout pour éviter les boucles de rendu
    setTimeout(() => {
      if (selectedMonth && selectedMonth instanceof Date && !isNaN(selectedMonth.getTime())) {
        generateCalendarWithAvailability(selectedMonth);
      }
    }, 100);
  }
}, [selectedMonth, selectedPrestationDetails, selectedCategory, idEmploye, idPrestataire, showDatePicker]);




// Dans la partie où vous générez les jours du mois :
const getCalendarForMonth = () => {
  if (!calendarDates || calendarDates.length === 0) {
    return [];
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return calendarDates.map(day => {
    if (day.isEmpty) {
      return { ...day, isToday: false, isSelected: false };
    }
    
    const isToday = isSameDay(day.date, today);
    const isSelected = selectedDay && isSameDay(day.date, selectedDay.date);
    
    return {
      ...day,
      isToday,
      isSelected,
      nomJour: day.date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      numJour: day.date.getDate()
    };
  });
};


// Fonction pour sécuriser l'affichage des dates du calendrier
const getSafeCalendarDates = () => {
  if (!calendarDates || !Array.isArray(calendarDates)) {
    return [];
  }
  
  return calendarDates;
};
  


// Fonction utilitaire pour sécuriser les dates
const getSafeDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('⚠️ Date invalide détectée, utilisation de la date du jour');
    return new Date();
  }
  return date;
};

const validateTextComponents = (element, path = 'root') => {
  if (!element) return;
  
  if (typeof element === 'string') {
    console.error(`❌ TEXTE NON WRAPPÉ trouvé à: ${path}`, element);
    return false;
  }
  
  if (Array.isArray(element)) {
    element.forEach((child, index) => {
      validateTextComponents(child, `${path}[${index}]`);
    });
  }
  
  return true;
};

const fetchJoursFermes = async (prestataireId) => {
  try {
    const response = await fetch(`http://192.168.1.68:3000/api/jours-fermes/${prestataireId}`);
    if (response.ok) {
      const joursFermesData = await response.json();
      
      // VÉRIFICATION DE SÉCURITÉ
      if (!Array.isArray(joursFermesData)) {
        console.error('❌ Données jours fermés invalides:', joursFermesData);
        setJoursFermes([]);
        return [];
      }
      
      const joursFermesList = joursFermesData
        .filter(jour => jour && jour.is_ferme === 1 && jour.jour_semaine)
        .map(jour => jour.jour_semaine.toLowerCase())
        .filter(Boolean); // Supprimer les valeurs vides
      
      setJoursFermes(joursFermesList);
      return joursFermesList;
    }
    return [];
  } catch (error) {
    console.error('Erreur récupération jours fermés:', error);
    setJoursFermes([]);
    return [];
  }
};


const calculerDisponibilitesMois = async () => {
  if (!idPrestataire || !rawHoraires.length) return;
  
  setLoadingMonth(true);
  const { year, month } = monthYear;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const disponibilites = {};

  // Pour chaque jour du mois
  for (let day = 1; day <= lastDay; day++) {
    // Utiliser l'heure locale, pas UTC
    const date = new Date(year, month, day);
    date.setHours(12, 0, 0, 0); // Fixer à midi pour éviter les problèmes de fuseau horaire
    
    const dateStr = date.toISOString().split('T')[0];
    const jourSemaine = getJourSemaineComplet(date);
    
    // 1. Vérifier si le salon est fermé ce jour
    const horaireJour = rawHoraires.find(h => h.jour === jourSemaine);
    const isFermeSalon = joursFermes.includes(jourSemaine) || !horaireJour || horaireJour.is_ferme;
    
    if (isFermeSalon) {
      disponibilites[dateStr] = { status: 'ferme', reason: 'Salon fermé' };
      continue;
    }
    
    // 2. Vérifier si au moins un intervenant est disponible
    let estDisponible = false;
    let intervenantTrouve = null;
    
    // Liste de tous les intervenants
    const tousIntervenants = [
      { 
        ...prestataire, 
        type: 'prestataire',
        id: 'prestataire'
      },
      ...(employes.map(emp => ({ 
        ...emp, 
        type: 'employe',
        id: emp.id_employe || emp.id 
      })) || [])
    ];
    
    // Vérifier chaque intervenant
    for (const intervenant of tousIntervenants) {
      try {
        // Appel API pour les disponibilités de l'intervenant
        const response = await fetch(
          intervenant.type === 'prestataire'
            ? `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?prestataire_id=${idPrestataire}`
            : `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?employe_id=${intervenant.id}&prestataire_id=${idPrestataire}`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const disponibilitesIntervenant = data.disponibilites || {};
        const dispoJour = disponibilitesIntervenant[jourSemaine];
        
        if (!dispoJour || !dispoJour.debut || !dispoJour.fin) continue;
        
        // Calculer l'intersection
        const ouvertureSalon = timeToMinutes(horaireJour.heure_ouverture);
        const fermetureSalon = timeToMinutes(horaireJour.heure_fermeture);
        const debutIntervenant = timeToMinutes(dispoJour.debut);
        const finIntervenant = timeToMinutes(dispoJour.fin);
        
        const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
        const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
        
        if (ouvertureEffective >= fermetureEffective) continue;
        
        // Prendre en compte la pause
        const pauseDebut = horaireJour.pause_debut ? timeToMinutes(horaireJour.pause_debut) : null;
        const pauseFin = horaireJour.pause_fin ? timeToMinutes(horaireJour.pause_fin) : null;
        
        if (pauseDebut && pauseFin) {
          // Vérifier créneau avant pause
          if (ouvertureEffective < pauseDebut) {
            const finAvantPause = Math.min(pauseDebut, fermetureEffective);
            if (ouvertureEffective < finAvantPause) {
              estDisponible = true;
              intervenantTrouve = intervenant;
              break;
            }
          }
          
          // Vérifier créneau après pause
          if (pauseFin < fermetureEffective) {
            const debutApresPause = Math.max(pauseFin, ouvertureEffective);
            if (debutApresPause < fermetureEffective) {
              estDisponible = true;
              intervenantTrouve = intervenant;
              break;
            }
          }
        } else {
          // Pas de pause
          estDisponible = true;
          intervenantTrouve = intervenant;
          break;
        }
        
      } catch (error) {
        continue;
      }
    }
    
    if (estDisponible) {
      disponibilites[dateStr] = { 
        status: 'disponible', 
        reason: 'Intervenant disponible',
        intervenant: intervenantTrouve
      };
    } else {
      disponibilites[dateStr] = { 
        status: 'indisponible', 
        reason: 'Aucun intervenant disponible'
      };
    }
  }
  
  setMonthDisponibilites(disponibilites);
  setLoadingMonth(false);
};



useEffect(() => {
  if (rawHoraires.length > 0 && idPrestataire) {
    calculerDisponibilitesMois();
  }
}, [monthYear, rawHoraires, idPrestataire, prestataire, employes]);

// Fonction vérification intersection d'un intervenant (silencieuse)
const verifierIntersectionIntervenantSilencieux = async (intervenant, horaireSalon, jourSemaine) => {
  try {
    const response = await fetch(
      intervenant.type === 'prestataire'
        ? `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?prestataire_id=${idPrestataire}`
        : `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?employe_id=${intervenant.id}&prestataire_id=${idPrestataire}`
    );
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const disponibilites = data.disponibilites || {};
    const dispoJour = disponibilites[jourSemaine];
    
    if (!dispoJour || !dispoJour.debut || !dispoJour.fin) return false;
    
    // Calcul intersection
    const ouvertureSalon = timeToMinutes(horaireSalon.heure_ouverture);
    const fermetureSalon = timeToMinutes(horaireSalon.heure_fermeture);
    const debutIntervenant = timeToMinutes(dispoJour.debut);
    const finIntervenant = timeToMinutes(dispoJour.fin);
    
    const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
    const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
    
    if (ouvertureEffective >= fermetureEffective) return false;
    
    // Prendre en compte pause
    const pauseDebut = horaireSalon.pause_debut ? timeToMinutes(horaireSalon.pause_debut) : null;
    const pauseFin = horaireSalon.pause_fin ? timeToMinutes(horaireSalon.pause_fin) : null;
    
    if (pauseDebut && pauseFin) {
      // Avant pause
      if (ouvertureEffective < pauseDebut) {
        const finAvantPause = Math.min(pauseDebut, fermetureEffective);
        if (ouvertureEffective < finAvantPause) return true;
      }
      
      // Après pause
      if (pauseFin < fermetureEffective) {
        const debutApresPause = Math.max(pauseFin, ouvertureEffective);
        if (debutApresPause < fermetureEffective) return true;
      }
    } else {
      // Pas de pause
      return ouvertureEffective < fermetureEffective;
    }
    
    return false;
    
  } catch {
    return false;
  }
};



// Fonction pour charger tous les intervenants (sans filtre de date)
const loadAllIntervenants = async () => {
  try {
    if (!idPrestataire || !selectedCategory) return;
    
    const response = await fetch(
      `http://192.168.1.68:3000/api/employes?id_prestataire=${idPrestataire}&categorie=${encodeURIComponent(selectedCategory)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // Récupérer tous les intervenants
      const allIntervenants = [
        { 
          ...data.prestataire, 
          type: 'prestataire',
          id: 'prestataire'
        },
        ...(data.employes?.map(emp => ({ 
          ...emp, 
          type: 'employe',
          id: emp.id_employe || emp.id 
        })) || [])
      ];
      
      setFilteredIntervenants(allIntervenants);
    }
  } catch (error) {
    console.error('Erreur chargement tous les intervenants:', error);
  }
};


const fetchDisponibilitesParDate = async (date) => {
  try {
    setIsLoading(true);
    const response = await fetch(
      `http://192.168.1.68:3000/api/disponibilites-par-date?prestataire_id=${idPrestataire}&date=${date.toISOString().split('T')[0]}`
    );
    
    if (response.ok) {
      const data = await response.json();
      setDisponibilitesParDate(data);
      
      // Filtrer les prestations et intervenants disponibles
      if (flowMode === 'date-first') {
        setFilteredPrestations(data.prestations);
        setFilteredIntervenants(data.intervenants);
      }
    }
  } catch (error) {
    console.error('Erreur chargement disponibilités:', error);
  } finally {
    setIsLoading(false);
  }
};

// Réinitialiser la vue détail quand on change de mode d'affichage
useEffect(() => {
  if (viewMode === 'mois') {
    setShowReservationDetail(false);
    setSelectedReservationForDetail(null);
  }
}, [viewMode]);
// Ajouter cet effet
useEffect(() => {
  console.log('🔄 Mise à jour calendrier suite aux changements:', {
    selectedPrestationDetails: !!selectedPrestationDetails,
    selectedCategory,
    idEmploye,
    selectionMode,
    modifiedDate: modifiedDate?.toLocaleDateString('fr-FR')
  });
  
  if (selectedPrestationDetails) {
    // Si une prestation est sélectionnée, recalculer les disponibilités
    generateCalendarWithAvailability(selectedMonth);
  }
}, [selectedPrestationDetails, selectedCategory, idEmploye, selectionMode]);


// AJOUTEZ CETTE NOUVELLE FONCTION - Utilise vos données locales sans appeler une API qui n'existe pas
const verifierReservationsIntervenant = async (intervenantId, date) => {
  try {
    console.log('🔍 Vérification réservations intervenant localement...');
    console.log('👤 Intervenant:', intervenantId);
    console.log('📅 Date:', date.toLocaleDateString('fr-FR'));
    
    // Normaliser la date
    const dateNormalisee = new Date(date);
    dateNormalisee.setHours(0, 0, 0, 0);
    const datePourRecherche = dateNormalisee.toISOString().split('T')[0];
    
    console.log('📅 Date normalisée pour recherche:', datePourRecherche);
    
    // Récupérer les réservations du jour depuis l'état existant
    const reservationsDuJour = await fetchReservationsDuJour(date);
    
    console.log('📋 Toutes les réservations du jour:', reservationsDuJour.length);
    
    // Filtrer pour cet intervenant spécifique
    const reservationsIntervenant = reservationsDuJour.filter(reservation => {
      if (intervenantId === "prestataire") {
        // Si c'est le prestataire lui-même
        return reservation.intervenant_type === 'prestataire';
      } else {
        // Si c'est un employé
        return reservation.id_employe?.toString() === intervenantId.toString();
      }
    });
    
    console.log(`📅 Réservations trouvées pour cet intervenant: ${reservationsIntervenant.length}`);
    
    // Format des réservations pour le traitement
    const reservationsFormatees = reservationsIntervenant.map(res => ({
      heure_debut: res.heure_debut,
      heure_fin: res.heure_fin,
      prestation_titre: res.prestation_titre,
      prestation_temps: res.prestation_temps || 0
    }));
    
    console.log('📋 Réservations formatées:', reservationsFormatees);
    
    return reservationsFormatees;
    
  } catch (error) {
    console.error('❌ Erreur vérification réservations:', error);
    return [];
  }
};


// Fonction pour vérifier si un intervenant est disponible un jour donné (pour le calendrier)
const isIntervenantDisponibleCeJour = (disponibilites, jourSemaine) => {
  console.log('🔍 Vérification disponibilité:', { disponibilites, jourSemaine });
  
  // Si pas de disponibilités définies, considérer comme disponible
  if (!disponibilites || Object.keys(disponibilites).length === 0) {
    console.log('ℹ️ Aucune disponibilité définie - considéré comme disponible');
    return true;
  }
  
  // Si le jour n'est pas dans les disponibilités, considérer comme disponible
  // (c'est la correction principale)
  if (!disponibilites[jourSemaine]) {
    console.log('ℹ️ Jour non défini dans les disponibilités - considéré comme disponible');
    return true;
  }
  
  // Si le jour est explicitement défini à null, considérer comme non disponible
  if (disponibilites[jourSemaine] === null) {
    console.log('❌ Jour explicitement défini comme non disponible');
    return false;
  }
  
  const horairesJour = disponibilites[jourSemaine];
const estDisponible = dispoJour && 
                     dispoJour.debut && 
                     dispoJour.fin && 
                     dispoJour.debut !== '00:00' && 
                     dispoJour.fin !== '00:00';
  
  console.log('📊 Résultat disponibilité:', { horairesJour, estDisponible });
  
  return estDisponible;
};



// Fonction pour convertir le format des disponibilités des employés
const convertirDisponibilitesEmploye = (rawDisponibilites) => {
  console.log('🔄 Conversion format employé:', rawDisponibilites);
  
  if (!rawDisponibilites) return {};
  
  // Si c'est déjà le format standard, retourner tel quel
  if (rawDisponibilites.lundi && rawDisponibilites.lundi.debut) {
    return rawDisponibilites;
  }
  
  const disponibilitesConverties = {};
  const joursMapping = {
    'lundi': 'Lundi', 'mardi': 'Mardi', 'mercredi': 'Mercredi',
    'jeudi': 'Jeudi', 'vendredi': 'Vendredi', 'samedi': 'Samedi', 'dimanche': 'Dimanche'
  };
  
  Object.keys(joursMapping).forEach(jourFr => {
    const jourKey = joursMapping[jourFr];
    
    if (rawDisponibilites[jourKey] && rawDisponibilites[jourKey].disponible) {
      const dispo = rawDisponibilites[jourKey];
      
      // Conversion des heures (ex: "9" → "09:00")
      const heureDebut = dispo.heure_debut ? 
        `${dispo.heure_debut.toString().padStart(2, '0')}:00` : null;
      const heureFin = dispo.heure_fin ? 
        `${dispo.heure_fin.toString().padStart(2, '0')}:00` : null;
      
      if (heureDebut && heureFin) {
        disponibilitesConverties[jourFr] = {
          debut: heureDebut,
          fin: heureFin
        };
      }
    }
  });
  
  console.log('📋 Disponibilités converties:', disponibilitesConverties);
  return disponibilitesConverties;
};


// Fonction pour vérifier la disponibilité globale (au moins un intervenant disponible)
const checkDisponibiliteGlobale = async (dateString, dureeMinutes, categorie) => {
  try {
    const queryParams = new URLSearchParams({
      prestataire_id: idPrestataire,
      date: dateString,
      duree_minutes: dureeMinutes,
      ...(categorie && { categorie: categorie })
    });

    const response = await fetch(
      `http://192.168.1.68:3000/api/verifier-disponibilite-globale?${queryParams}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.status; // 'disponible' ou 'indisponible'
    }
    return 'indisponible';
  } catch (error) {
    console.error('Erreur vérification globale:', error);
    return 'erreur';
  }
};

// Fonction pour vérifier la disponibilité réelle avec intersection complète
const verifierDisponibiliteReelle = async (date) => {
  if (!idPrestataire) return false;
  
  const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
  
  try {
    // 1. Vérifier si le salon est ouvert ce jour
    const horaireSalonResponse = await fetch(
      `http://192.168.1.68:3000/api/horaires/${idPrestataire}`
    );
    const horairesSalon = await horaireSalonResponse.json();
    
    const horaireJour = horairesSalon.find(h => h.jour === jourSemaine);
    if (!horaireJour || horaireJour.is_ferme) {
      console.log(`❌ Salon fermé le ${jourSemaine}`);
      return false;
    }

    // 2. Récupérer tous les intervenants
    const intervenantsResponse = await fetch(
      `http://192.168.1.68:3000/api/employes?id_prestataire=${idPrestataire}`
    );
    const intervenantsData = await intervenantsResponse.json();
    
    // Liste de tous les intervenants (prestataire + employés)
    const tousIntervenants = [
      { 
        ...intervenantsData.prestataire, 
        type: 'prestataire',
        id: 'prestataire'
      },
      ...(intervenantsData.employes?.map(emp => ({ 
        ...emp, 
        type: 'employe',
        id: emp.id_employe || emp.id 
      })) || [])
    ];

    // 3. Pour chaque intervenant, vérifier s'il est disponible ce jour
    let auMoinsUnIntervenantDisponible = false;
    
    for (const intervenant of tousIntervenants) {
      // Récupérer les disponibilités de l'intervenant
      const disponibilitesResponse = await fetch(
        intervenant.type === 'prestataire'
          ? `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?prestataire_id=${idPrestataire}`
          : `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?employe_id=${intervenant.id}&prestataire_id=${idPrestataire}`
      );
      
      if (!disponibilitesResponse.ok) continue;
      
      const disponibilitesData = await disponibilitesResponse.json();
      const disponibilitesIntervenant = disponibilitesData.disponibilites || {};
      
      const dispoJour = disponibilitesIntervenant[jourSemaine];
      
      // Si l'intervenant n'a pas de disponibilité définie pour ce jour, passer au suivant
      if (!dispoJour || !dispoJour.debut || !dispoJour.fin) {
        continue;
      }

      // 4. Calculer l'intersection entre les horaires du salon et de l'intervenant
      const ouvertureSalon = convertirHeureEnMinutes(horaireJour.heure_ouverture);
      const fermetureSalon = convertirHeureEnMinutes(horaireJour.heure_fermeture);
      const debutIntervenant = convertirHeureEnMinutes(dispoJour.debut);
      const finIntervenant = convertirHeureEnMinutes(dispoJour.fin);
      
      const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
      const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
      
      // 5. Prendre en compte la pause du salon
      const pauseDebut = horaireJour.pause_debut ? convertirHeureEnMinutes(horaireJour.pause_debut) : null;
      const pauseFin = horaireJour.pause_fin ? convertirHeureEnMinutes(horaireJour.pause_fin) : null;
      
      let intersectionReelle = false;
      
      // Si pas de pause, vérifier simplement l'intersection
      if (!pauseDebut || !pauseFin) {
        intersectionReelle = ouvertureEffective < fermetureEffective;
      } else {
        // Vérifier s'il y a une intersection hors pause
        
        // Intersection avant la pause
        if (ouvertureEffective < pauseDebut) {
          const finAvantPause = Math.min(pauseDebut, fermetureEffective);
          if (ouvertureEffective < finAvantPause) {
            intersectionReelle = true;
          }
        }
        
        // Intersection après la pause
        if (pauseFin < fermetureEffective && !intersectionReelle) {
          const debutApresPause = Math.max(pauseFin, ouvertureEffective);
          if (debutApresPause < fermetureEffective) {
            intersectionReelle = true;
          }
        }
      }
      
      if (intersectionReelle) {
        console.log(`✅ ${intervenant.prenom} ${intervenant.nom} disponible le ${jourSemaine}`);
        auMoinsUnIntervenantDisponible = true;
        break; // Un intervenant disponible suffit
      }
    }
    
    return auMoinsUnIntervenantDisponible;
    
  } catch (error) {
    console.error('Erreur vérification disponibilité réelle:', error);
    return false;
  }
};

// Fonction optimisée pour vérifier la disponibilité
const verifierDisponibiliteReelleOptimisee = async (date) => {
  try {
    if (!idPrestataire) return false;
    
    const jourSemaine = getJourSemaineComplet(date);
    const horaireJour = rawHoraires.find(h => h.jour === jourSemaine);
    
    if (!horaireJour || horaireJour.is_ferme) return false;
    
    // Vérifier rapidement le prestataire d'abord
    const prestataireDispo = await verifierIntersectionIntervenantSilencieux(
      { type: 'prestataire', id: 'prestataire' },
      horaireJour,
      jourSemaine
    );
    
    if (prestataireDispo) return true;
    
    // Vérifier les employés si nécessaire
    for (const employe of employes) {
      const employeDispo = await verifierIntersectionIntervenantSilencieux(
        { type: 'employe', id: employe.id_employe || employe.id },
        horaireJour,
        jourSemaine
      );
      
      if (employeDispo) return true;
    }
    
    return false;
    
  } catch {
    return false;
  }
};



// Fonction pour vérifier l'intersection d'un intervenant spécifique
const verifierIntersectionIntervenant = async (intervenant, horaireSalon, jourSemaine) => {
  try {
    // Récupérer les disponibilités de l'intervenant
    const response = await fetch(
      `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?${
        intervenant.type === 'prestataire' 
          ? `prestataire_id=${idPrestataire}` 
          : `employe_id=${intervenant.id}&prestataire_id=${idPrestataire}`
      }`
    );
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const disponibilites = data.disponibilites || {};
    
    const dispoJour = disponibilites[jourSemaine];
    if (!dispoJour || !dispoJour.debut || !dispoJour.fin) return false;
    
    // Calculer l'intersection
    const ouvertureSalon = timeToMinutes(horaireSalon.heure_ouverture);
    const fermetureSalon = timeToMinutes(horaireSalon.heure_fermeture);
    const debutIntervenant = timeToMinutes(dispoJour.debut);
    const finIntervenant = timeToMinutes(dispoJour.fin);
    
    const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
    const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
    
    if (ouvertureEffective >= fermetureEffective) return false;
    
    // Prendre en compte la pause
    const pauseDebut = horaireSalon.pause_debut ? timeToMinutes(horaireSalon.pause_debut) : null;
    const pauseFin = horaireSalon.pause_fin ? timeToMinutes(horaireSalon.pause_fin) : null;
    
    // Vérifier s'il y a un créneau hors pause
    if (pauseDebut && pauseFin) {
      // Créneau avant la pause
      if (ouvertureEffective < pauseDebut) {
        const finAvantPause = Math.min(pauseDebut, fermetureEffective);
        if (ouvertureEffective < finAvantPause) return true;
      }
      
      // Créneau après la pause
      if (pauseFin < fermetureEffective) {
        const debutApresPause = Math.max(pauseFin, ouvertureEffective);
        if (debutApresPause < fermetureEffective) return true;
      }
    } else {
      // Pas de pause
      return ouvertureEffective < fermetureEffective;
    }
    
    return false;
    
  } catch (error) {
    return false;
  }
};



const generateCalendarWithAvailability = async (monthDate) => {
  const safeMonthDate = getSafeDate(monthDate);
  
  if (isCalendarLoading) return;
  setIsCalendarLoading(true);
  
  try {
    const year = safeMonthDate.getFullYear();
    const month = safeMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDay = firstDay.getDay();
    let startingEmptyDays = startDay === 0 ? 6 : startDay - 1;

    const calendar = [];
    
    // Jours vides du début
    for (let i = 0; i < startingEmptyDays; i++) {
      calendar.push({ isEmpty: true });
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day, 12, 0, 0, 0);
      const dateString = currentDate.toISOString().split('T')[0];
      const jourSemaine = getJourSemaineComplet(currentDate);
      
      // Vérifier si fermé
      const isFermeSalon = Array.isArray(joursFermes) && joursFermes.includes(jourSemaine);
      
      let status = 'normal';
      
      if (isFermeSalon) {
        status = 'ferme';
      } else {
        // Vérifier disponibilité (silencieux)
        try {
          const estDisponible = await verifierDisponibiliteReelleOptimisee(currentDate);
          status = estDisponible ? 'disponible' : 'indisponible';
        } catch {
          status = 'indisponible';
        }
      }
      
      calendar.push({
        date: currentDate,
        dateString,
        jourSemaine,
        status,
        isFerme: isFermeSalon,
        isToday: isSameDay(currentDate, new Date()),
        isSelected: modifiedDate && isSameDay(currentDate, modifiedDate),
        isEmpty: false
      });
    }
    
    // Compléter la grille
    const totalCells = calendar.length;
    const remainingEmptyDays = (7 - (totalCells % 7)) % 7;
    
    for (let i = 0; i < remainingEmptyDays; i++) {
      calendar.push({ isEmpty: true });
    }
    
    setCalendarDates(calendar);
    
  } catch (error) {
    // Fallback silencieux
    generateBasicCalendar(monthDate);
  } finally {
    setIsCalendarLoading(false);
  }
};


// NOUVELLE FONCTION : Vérifier disponibilité complète d'un intervenant
const verifierDisponibiliteCompleteIntervenant = async (date, intervenantId, prestationDetails) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const jourSemaine = getJourSemaineComplet(date).toLowerCase();
    
    // 1. Vérifier horaires salon
    const horaireSalon = rawHoraires.find(h => h.jour === jourSemaine);
    if (!horaireSalon || horaireSalon.is_ferme) {
      return { disponible: false, raison: 'Salon fermé' };
    }
    
    // 2. Récupérer disponibilités intervenant
    const response = await fetch(
      `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?${
        intervenantId === "prestataire" 
          ? `prestataire_id=${idPrestataire}` 
          : `employe_id=${intervenantId}&prestataire_id=${idPrestataire}`
      }`
    );
    
    if (!response.ok) return { disponible: false, raison: 'Erreur serveur' };
    
    const data = await response.json();
    const disponibilitesIntervenant = data.disponibilites || {};
    const dispoJour = disponibilitesIntervenant[jourSemaine];
    
    // 3. Vérifier intersection horaires
    if (!dispoJour || !dispoJour.debut || !dispoJour.fin) {
      return { disponible: false, raison: 'Intervenant non disponible' };
    }
    
    // Calcul intersection
    const ouvertureSalon = convertirHeureEnMinutes(horaireSalon.heure_ouverture);
    const fermetureSalon = convertirHeureEnMinutes(horaireSalon.heure_fermeture);
    const debutIntervenant = convertirHeureEnMinutes(dispoJour.debut);
    const finIntervenant = convertirHeureEnMinutes(dispoJour.fin);
    
    const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
    const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
    
    if (ouvertureEffective >= fermetureEffective) {
      return { disponible: false, raison: 'Pas d\'intersection horaire' };
    }
    
    // 4. Vérifier pauses
    const pauseDebut = horaireSalon.pause_debut ? convertirHeureEnMinutes(horaireSalon.pause_debut) : null;
    const pauseFin = horaireSalon.pause_fin ? convertirHeureEnMinutes(horaireSalon.pause_fin) : null;
    
    if (pauseDebut && pauseFin && ouvertureEffective >= pauseDebut && fermetureEffective <= pauseFin) {
      return { disponible: false, raison: 'Pendant la pause' };
    }
    
    // 5. Vérifier créneaux disponibles avec API existante
    const disponibilites = await fetchDisponibilitesIntervenant(
      intervenantId,
      date,
      prestationDetails.temps
    );
    
    return {
      disponible: disponibilites.length > 0,
      raison: disponibilites.length > 0 ? 'Disponible' : 'Aucun créneau',
      creneaux: disponibilites
    };
    
  } catch (error) {
    console.error('Erreur vérification complète:', error);
    return { disponible: false, raison: 'Erreur technique' };
  }
};



// Fonction utilitaire pour comparer les dates sans heure
// Fonction utilitaire pour comparer les dates sans heure
const isSameDay = (date1, date2) => {
  if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) {
    return false;
  }
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // S'assurer que les dates sont valides
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    // Comparer année, mois et jour uniquement
    return d1.getTime() === d2.getTime();
  } catch (error) {
    console.error('Erreur dans isSameDay:', error);
    return false;
  }
};


const renderReservationDetail = () => {
  if (!selectedReservationForDetail) return null;

  const reservation = selectedReservationForDetail;

  return (
    <View style={styles.reservationDetailContainer}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowReservationDetail(false)}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>Détails de la réservation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.detailContent}>
        {/* Informations principales */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Informations réservation</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horaire:</Text>
            <Text style={styles.infoValue}>
              {reservation.heure_debut} - {reservation.heure_fin}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prestation:</Text>
            <Text style={styles.infoValue}>{reservation.prestation_titre}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut:</Text>
            <View style={[
              styles.statusBadge,
              reservation.statut === 'reservé' && styles.statusReserve,
              reservation.statut === 'confirmé' && styles.statusConfirme,
              reservation.statut === 'annulé' && styles.statusAnnule
            ]}>
              <Text style={styles.statusBadgeText}>{reservation.statut}</Text>
            </View>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>
              {reservation.client_prenom} {reservation.client_nom}
            </Text>
          </View>

          {reservation.client_telephone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone:</Text>
              <Text style={styles.infoValue}>{reservation.client_telephone}</Text>
            </View>
          )}

          {reservation.client_mail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{reservation.client_mail}</Text>
            </View>
          )}
        </View>

        {/* Informations intervenant */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Intervenant</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigné à:</Text>
            <Text style={styles.infoValue}>
              {reservation.intervenant_prenom} {reservation.intervenant_nom}
            </Text>
          </View>
        </View>

        {/* Commentaire */}
        {reservation.commentaire && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Commentaire</Text>
            <View style={styles.commentBox}>
              <Text style={styles.commentText}>{reservation.commentaire}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              setSelectedReservation(reservation);
              setEditFormData({
                heure_debut: reservation.heure_debut,
                heure_fin: reservation.heure_fin,
                prestation_titre: reservation.prestation_titre,
                client_prenom: reservation.client_prenom,
                client_nom: reservation.client_nom,
                client_telephone: reservation.client_telephone || '',
                client_mail: reservation.client_mail || '',
                commentaire: reservation.commentaire || '',
                statut: reservation.statut
              });
              setIsEditModalVisible(true);
              setShowReservationDetail(false);
            }}
          >
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              setSelectedReservation(reservation);
              setShowReservationDetail(false);
              // Ouvrir directement la confirmation d'annulation
              handleCancelReservation();
            }}
          >
            <Text style={styles.actionButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};




// Fonction pour gérer le clic sur une réservation
const handleReservationClick = (reservation) => {
  console.log('🎯 Réservation cliquée:', reservation);
  setSelectedReservationForDetail(reservation);
  setShowReservationDetail(true);
  console.log('📱 Affichage de la page de détail');
};

// Fonction pour mettre à jour une réservation
const handleUpdateReservation = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    if (!editFormData.heure_debut || !editFormData.heure_fin || !editFormData.client_prenom || !editFormData.client_nom) {
      alert('Les champs heure début, heure fin, prénom et nom sont obligatoires');
      return;
    }

    const updateData = {
      heure_debut: editFormData.heure_debut,
      heure_fin: editFormData.heure_fin,
      statut: editFormData.statut,
      commentaire: editFormData.commentaire,
      client_prenom: editFormData.client_prenom,
      client_nom: editFormData.client_nom,
      client_telephone: editFormData.client_telephone,
      client_mail: editFormData.client_mail
    };

    const response = await fetch(`http://192.168.1.68:3000/api/reservations/homepresta/${selectedReservation.id_reservation}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la modification de la réservation');
    }

    alert('Réservation modifiée avec succès!');
    
    // Recharger les réservations du jour
    if (selectedDay) {
      const reservations = await fetchReservationsDuJour(selectedDay.date);
      setReservationsDuJour(reservations);
    }
    
    setIsEditModalVisible(false);
    setSelectedReservation(null);

  } catch (error) {
    console.error('Erreur modification réservation:', error);
    alert(error.message || 'Erreur lors de la modification');
  } finally {
    setIsSubmitting(false);
  }
};

// Fonction pour annuler une réservation
const handleCancelReservation = async () => {
  if (isSubmitting) return;
  
  const confirmation = await new Promise((resolve) => {
    Alert.alert(
      'Confirmer l\'annulation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Oui', style: 'destructive', onPress: () => resolve(true) }
      ]
    );
  });

  if (!confirmation) return;

  setIsSubmitting(true);

  try {
    const response = await fetch(`http://192.168.1.68:3000/api/reservations/${selectedReservation.id_reservation}/annuler`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'annulation de la réservation');
    }

    alert('Réservation annulée avec succès!');
    
    // Recharger les réservations du jour
    if (selectedDay) {
      const reservations = await fetchReservationsDuJour(selectedDay.date);
      setReservationsDuJour(reservations);
    }
    
    setIsEditModalVisible(false);
    setSelectedReservation(null);

  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    alert(error.message || 'Erreur lors de l\'annulation');
  } finally {
    setIsSubmitting(false);
  }
};


// Fonction de fallback pour générer un calendrier basique
const generateBasicCalendar = (monthDate) => {
  if (!monthDate || !(monthDate instanceof Date) || isNaN(monthDate.getTime())) {
    console.error('❌ Date de mois invalide dans generateBasicCalendar:', monthDate);
    monthDate = new Date();
  }
  
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  
  try {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay();
    let startingEmptyDays = startDay === 0 ? 6 : startDay - 1;
    
    const calendar = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startingEmptyDays; i++) {
      calendar.push({ isEmpty: true });
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      
      // Vérifier que la date est valide
      if (isNaN(currentDate.getTime())) {
        console.error('❌ Date invalide générée:', year, month, day);
        continue;
      }
      
      const dateNormalisee = new Date(Date.UTC(year, month, day));
      const dateString = dateNormalisee.toISOString().split('T')[0];
      const jourSemaine = getJourSemaineComplet(currentDate);
      
      calendar.push({
        date: currentDate,
        dateString,
        jourSemaine,
        status: 'normal',
        isFerme: false,
        isIntervenantDisponible: true,
        isToday: isSameDay(currentDate, new Date())
      });
    }
    
    // Compléter avec les jours vides de la fin
    const totalCells = calendar.length;
    const remainingEmptyDays = (7 - (totalCells % 7)) % 7;
    
    for (let i = 0; i < remainingEmptyDays; i++) {
      calendar.push({ isEmpty: true });
    }
    
    setCalendarDates(calendar);
    
  } catch (error) {
    console.error('💥 Erreur critique dans generateBasicCalendar:', error);
    // Fallback ultra simple
    setCalendarDates([]);
  }
};



// Fonction pour compléter le calendrier avec les jours vides du début du mois
const getCalendarWithEmptyDays = () => {
  if (calendarDates.length === 0) return [];
  
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
  
  const calendarWithEmptyDays = [];
  
  // Ajouter les jours vides du début
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarWithEmptyDays.push({ isEmpty: true });
  }
  
  // Ajouter les jours du mois
  calendarWithEmptyDays.push(...calendarDates);
  
  return calendarWithEmptyDays;
};

// Fonction utilitaire pour récupérer le nom de l'intervenant
// Fonction utilitaire pour récupérer le nom de l'intervenant
const getIntervenantDisplayName = () => {
  if (!idEmploye) return "Choisir un intervenant";
  
  if (idEmploye === "prestataire") {
    return `${prestataire.prenom || ''} ${prestataire.nom || ''} (Vous)`;
  }
  
  // Recherche dans les employés
  const employeTrouve = employes.find(emp => 
    emp.id_employe?.toString() === idEmploye || emp.id?.toString() === idEmploye
  );
  
  if (employeTrouve) {
    return `${employeTrouve.prenom || ''} ${employeTrouve.nom || ''}`;
  }
  
  return "Intervenant non trouvé";
};



// Appeler cette fonction quand les sélections changent OU quand on ouvre le datepicker
// Recharger le calendrier quand l'intervenant change
useEffect(() => {
  if (idPrestataire && (showDatePicker || selectedPrestationDetails || selectedCategory || idEmploye)) {
    generateCalendarWithAvailability(selectedMonth);
  }
}, [selectedMonth, selectedPrestationDetails, selectedCategory, idEmploye, idPrestataire, showDatePicker]);


// Appeler cette fonction quand les sélections changent OU quand on ouvre le datepicker
// Fonction pour changer de mois
const changeMonth = (direction) => {
  const newMonth = new Date(selectedMonth);
  newMonth.setMonth(selectedMonth.getMonth() + direction);
  setSelectedMonth(newMonth);
};


  const joursDeLaSemaine = useMemo(() => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

const joursAvecHoraires = useMemo(() => {
  return joursDeLaSemaine.map(date => {
    if (!date) return { date, isOpen: false, heures: [], nomJour: '', numJour: 0 };
    
    const dateKey = date.toISOString().split('T')[0];
    const jourData = horairesData.find(j => 
      j.date && j.date.toISOString().split('T')[0] === dateKey
    );
    
    return {
      date: new Date(date), // S'assurer d'avoir un nouvel objet Date
      isOpen: jourData?.heures?.length > 0,
      heures: jourData?.heures || [],
      nomJour: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      numJour: date.getDate()
    };
  });
}, [joursDeLaSemaine, horairesData]);


// Fonction pour vérifier si une date est valide pour la sélection
const isDateSelectable = (day) => {
  if (!day || day.isEmpty || !day.date) return false;
  
  // Vérifier que la date est valide
  if (!(day.date instanceof Date) || isNaN(day.date.getTime())) return false;
  
  // Vérifier si le jour est fermé pour le salon
  if (day.isFerme) return false;
  
  // Vérifier si c'est une date passée
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(day.date);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) return false;
  
  // Les jours "disponible" sont sélectionnables
  return day.status === 'disponible';
};
// Fonction pour récupérer les jours où l'entreprise est ouverte
const fetchJoursOuverts = async (prestataireId) => {
  try {
    const response = await fetch(`http://192.168.1.68:3000/api/jours-ouverts/${prestataireId}`);
    if (response.ok) {
      const data = await response.json();
      return data.jours_ouverts || {};
    }
    return {};
  } catch (error) {
    console.error('Erreur récupération jours ouverts:', error);
    return {};
  }
};

// Fonction pour récupérer les réservations d'un jour spécifique
const fetchReservationsDuJour = async (date) => {
  try {
    // S'assurer que la date est un objet Date valide
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateNormalisee = new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    ));
    const datePourAPI = dateNormalisee.toISOString().split('T')[0];

    console.log('📅 Chargement réservations pour:', datePourAPI);

    const response = await fetch(
      `http://192.168.1.68:3000/api/reservations-du-jour?date=${datePourAPI}&prestataire_id=${idPrestataire}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('📅 Réservations du jour:', data.reservations?.length || 0);
      return data.reservations || [];
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erreur récupération réservations du jour:', error);
    return [];
  }
};

// Nouvelle fonction pour vérifier la disponibilité complète d'un intervenant
const verifierDisponibiliteComplete = async (date, intervenantId, prestationId) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const jourSemaine = getJourSemaineComplet(date).toLowerCase();
    
    // 1. Vérifier si le salon est ouvert ce jour
    const horaireSalon = rawHoraires.find(h => h.jour === jourSemaine);
    
    if (!horaireSalon || horaireSalon.is_ferme) {
      return { disponible: false, raison: 'Salon fermé' };
    }
    
    // 2. Récupérer les disponibilités de l'intervenant
    const response = await fetch(
      `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?${intervenantId === "prestataire" ? 
        `prestataire_id=${idPrestataire}` : 
        `employe_id=${intervenantId}&prestataire_id=${idPrestataire}`
      }`
    );
    
    if (!response.ok) return { disponible: false, raison: 'Erreur serveur' };
    
    const data = await response.json();
    const disponibilitesIntervenant = data.disponibilites || {};
    
    // 3. Vérifier si l'intervenant est disponible ce jour
    const dispoJour = disponibilitesIntervenant[jourSemaine];
    
    if (!dispoJour || !dispoJour.debut || !dispoJour.fin) {
      return { disponible: false, raison: 'Intervenant non disponible ce jour' };
    }
    
    // 4. Calculer l'intersection entre horaires salon et intervenant
    const ouvertureSalon = convertirHeureEnMinutes(horaireSalon.heure_ouverture);
    const fermetureSalon = convertirHeureEnMinutes(horaireSalon.heure_fermeture);
    const debutIntervenant = convertirHeureEnMinutes(dispoJour.debut);
    const finIntervenant = convertirHeureEnMinutes(dispoJour.fin);
    
    const ouvertureEffective = Math.max(ouvertureSalon, debutIntervenant);
    const fermetureEffective = Math.min(fermetureSalon, finIntervenant);
    
    if (ouvertureEffective >= fermetureEffective) {
      return { disponible: false, raison: 'Aucune intersection d\'horaires' };
    }
    
    // 5. Vérifier les pauses du salon
    const pauseDebut = horaireSalon.pause_debut ? convertirHeureEnMinutes(horaireSalon.pause_debut) : null;
    const pauseFin = horaireSalon.pause_fin ? convertirHeureEnMinutes(horaireSalon.pause_fin) : null;
    
    // Si la pause couvre toute la période de disponibilité
    if (pauseDebut && pauseFin && 
        ouvertureEffective >= pauseDebut && fermetureEffective <= pauseFin) {
      return { disponible: false, raison: 'Pendant la pause du salon' };
    }
    
    // 6. Récupérer les créneaux disponibles (avec réservations)
    const prestation = prestations.find(p => p.id_prestation.toString() === prestationId);
    if (!prestation) return { disponible: false, raison: 'Prestation non trouvée' };
    
    const disponibilites = await fetchDisponibilitesIntervenant(
      intervenantId, 
      date, 
      prestation.temps
    );
    
    return {
      disponible: disponibilites.length > 0,
      raison: disponibilites.length > 0 ? 'Créneaux disponibles' : 'Aucun créneau disponible',
      creneaux: disponibilites,
      details: {
        horaireSalon: `${horaireSalon.heure_ouverture}-${horaireSalon.heure_fermeture}`,
        disponibiliteIntervenant: `${dispoJour.debut}-${dispoJour.fin}`,
        intersection: `${convertirMinutesEnHeure(ouvertureEffective)}-${convertirMinutesEnHeure(fermetureEffective)}`
      }
    };
    
  } catch (error) {
    console.error('Erreur vérification complète:', error);
    return { disponible: false, raison: 'Erreur technique' };
  }
};


const fetchIntervenantsDisponiblesPourDate = async (date) => {
  try {
    const dateNormalisee = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    const datePourAPI = dateNormalisee.toISOString().split('T')[0];

    console.log('🔍 Recherche intervenants pour:', datePourAPI);

    // Appeler l'API avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `http://192.168.1.68:3000/api/intervenants-disponibles-par-date-avec-intersection?` +
      `prestataire_id=${idPrestataire}&date=${datePourAPI}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${data.intervenants?.length || 0} intervenant(s) trouvé(s)`);
      
      return data.intervenants?.map(intervenant => ({
        ...intervenant,
        categorie: intervenant.categorie || '',
        id: intervenant.id || 
            (intervenant.type === 'prestataire' ? 'prestataire' : 
             intervenant.id_employe || intervenant.id),
        type: intervenant.type || 'employe'
      })) || [];
    } else {
      console.error('❌ Erreur API intervenants:', response.status);
      return [];
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏱️ Timeout recherche intervenants');
    } else {
      console.error('💥 Erreur récupération intervenants:', error);
    }
    return [];
  }
};


const handleDayPressFromMonth = async (jour) => {
  console.log('🔍 === CLIC CALENDRIER MOIS → SEMAINE ===');
  console.log('📅 Jour cliqué:', jour.date.toLocaleDateString('fr-FR'));
  
  if (!jour || !jour.date || !jour.isDisponible) {
    console.log('❌ Jour non disponible ou invalide - Ignorer');
    return;
  }
  
  // RÉINITIALISER LA VUE DÉTAIL
  setShowReservationDetail(false);
  setSelectedReservationForDetail(null);
  
  // Normaliser la date (supprimer les heures)
  const dateSelectionnee = new Date(jour.date);
  dateSelectionnee.setHours(12, 0, 0, 0);
  
  console.log('📅 Date sélectionnée normalisée:', dateSelectionnee.toLocaleDateString('fr-FR'));
  
  // Calculer l'offset de semaine pour positionner la vue semaine
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDate = new Date(dateSelectionnee);
  selectedDate.setHours(0, 0, 0, 0);
  
  // Calculer le début de la semaine (lundi) pour aujourd'hui et la date sélectionnée
  const getWeekStart = (date) => {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(dateCopy.setDate(diff));
  };
  
  const todayWeekStart = getWeekStart(new Date(today));
  const selectedWeekStart = getWeekStart(new Date(selectedDate));
  
  const diffTime = selectedWeekStart.getTime() - todayWeekStart.getTime();
  const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  console.log('📅 Offset calculé:', diffWeeks, 'semaines');
  
  // Stocker la date sélectionnée pour la synchronisation
  setSelectedDateFromMonth(dateSelectionnee);
  
  // METTRE À JOUR L'OFFSET DE SEMAINE ET PASSER EN VUE SEMAINE
  setWeekOffset(diffWeeks);
  setViewMode('semaine');
  
  console.log('✅ Passage en vue semaine avec offset:', diffWeeks);
  
  // Charger les réservations du jour sélectionné
  try {
    const reservations = await fetchReservationsDuJour(dateSelectionnee);
    setReservationsDuJour(reservations);
    console.log('📅 Réservations chargées:', reservations.length);
  } catch (error) {
    console.error('❌ Erreur chargement réservations:', error);
    setReservationsDuJour([]);
  }
};

const handleDayPress = useCallback(async (jour) => {
  if (!jour || !jour.date) return;
  
  // Si le jour est fermé, ne rien faire
  if (!jour.isOpen) return;
  
  // Basculer la sélection (désélectionner si déjà sélectionné)
  const isAlreadySelected = selectedDay?.date && jour.date && 
    selectedDay.date.getTime() === jour.date.getTime();
  
  if (isAlreadySelected) {
    setSelectedDay(null);
    setReservationsDuJour([]);
    setShowReservationDetail(false);
  } else {
    setSelectedDay(jour);
    setShowReservationDetail(false);
    
    // Charger les réservations du jour sélectionné
    setIsLoading(true);
    try {
      const reservations = await fetchReservationsDuJour(jour.date);
      setReservationsDuJour(reservations);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      setReservationsDuJour([]);
    } finally {
      setIsLoading(false);
    }
  }
}, [selectedDay]);

const renderDayHeader = useCallback((jour, index) => {
  if (!jour) return null;
  
  const isSelected = selectedDay?.date && isSameDay(selectedDay.date, jour.date);
  
  return (
    <TouchableOpacity 
      key={index}
      onPress={() => handleDayPress(jour)}
      style={[
        styles.dayHeader,
        !jour.isOpen && styles.closedDayHeader,
        isSelected && styles.selectedDayHeader
      ]}
    >
      <Text style={[
        styles.dayName,
        !jour.isOpen && styles.closedDayText,
        isSelected && styles.selectedDayText
      ]}>
        {jour.nomJour}
      </Text>
      <Text style={[
        styles.dayNumber,
        !jour.isOpen && styles.closedDayText,
        isSelected && styles.selectedDayText
      ]}>
        {jour.numJour}
      </Text>
      {!jour.isOpen && (
        <Text style={styles.closedDayLabel}>Fermé</Text>
      )}
    </TouchableOpacity>
  );
}, [selectedDay, handleDayPress]);

// Filtrer les intervenants disponibles pour une prestation et date spécifique
const getIntervenantsDisponibles = (prestationId, date) => {
  if (!disponibilitesParDate) return [];
  
  const prestation = disponibilitesParDate.prestations.find(p => p.id_prestation == prestationId);
  if (!prestation) return [];
  
  return disponibilitesParDate.intervenants.filter(intervenant => {
    // Vérifier si l'intervenant a la catégorie de la prestation
    const hasCategory = intervenant.categorie && 
      intervenant.categorie.toLowerCase().includes(prestation.categorie.toLowerCase());
    
    if (!hasCategory) return false;
    
    // Vérifier les réservations existantes
    const reservationsIntervenant = disponibilitesParDate.reservations.filter(
      r => (r.id_employe == intervenant.id || r.id_prestataire == intervenant.id) &&
           r.id_prestation == prestationId
    );
    
    // Logique de vérification de disponibilité temporelle
    return true; // À implémenter
  });
};

// Filtrer les prestations disponibles pour une date
const getPrestationsDisponibles = (date) => {
  if (!disponibilitesParDate) return [];
  return disponibilitesParDate.prestations;
};


// Fonction intelligente pour charger les intervenants
const loadIntervenantsIntelligents = async (date = null) => {
  try {
    if (!idPrestataire) return;
    
    console.log('🤖 Chargement intelligents des intervenants');
    
    const queryParams = new URLSearchParams({
      prestataire_id: idPrestataire,
      mode: 'mixte' // Mode mixte par défaut
    });
    
    // Si une date est spécifiée et que ce n'est pas aujourd'hui
    if (date) {
      const dateObj = new Date(date);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);
      
      // Normaliser la date
      dateObj.setHours(0, 0, 0, 0);
      
      // Si c'est une date future (pas aujourd'hui), on l'ajoute aux paramètres
      if (dateObj.getTime() !== aujourdhui.getTime()) {
        queryParams.append('date', dateObj.toISOString().split('T')[0]);
        console.log('📅 Chargement pour date spécifique:', dateObj.toLocaleDateString('fr-FR'));
      } else {
        console.log('📅 Chargement pour aujourd\'hui');
      }
    } else {
      console.log('📅 Chargement sans date spécifique (mode mixte)');
    }
    
    // Ajouter la catégorie si elle est sélectionnée
    if (selectedCategory) {
      queryParams.append('categorie', selectedCategory);
    }
    
    const response = await fetch(
      `http://192.168.1.68:3000/api/intervenants-disponibles-intelligents?${queryParams}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${data.intervenants?.length || 0} intervenant(s) reçus (mode: ${data.mode})`);
      
      if (data.mode === 'mixte') {
        console.log('📊 Statistiques:', data.stats);
      }
      
      setFilteredIntervenants(data.intervenants || []);
      
      // Retourner les données pour un traitement ultérieur
      return data;
    } else {
      console.error('❌ Erreur API intelligente:', response.status);
      // Fallback : charger tous les intervenants
      await loadAllIntervenantsFallback();
      return null;
    }
    
  } catch (error) {
    console.error('💥 Erreur chargement intelligents:', error);
    // Fallback
    await loadAllIntervenantsFallback();
    return null;
  }
};

// Fonction de fallback
const loadAllIntervenantsFallback = async () => {
  try {
    const response = await fetch(
      `http://192.168.1.68:3000/api/employes?id_prestataire=${idPrestataire}&categorie=${encodeURIComponent(selectedCategory || '')}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      const allIntervenants = [
        { 
          ...data.prestataire, 
          type: 'prestataire',
          id: 'prestataire'
        },
        ...(data.employes?.map(emp => ({ 
          ...emp, 
          type: 'employe',
          id: emp.id_employe || emp.id 
        })) || [])
      ];
      
      setFilteredIntervenants(allIntervenants);
      console.log(`🔄 Fallback: ${allIntervenants.length} intervenant(s) chargés`);
    }
  } catch (error) {
    console.error('❌ Erreur fallback:', error);
    setFilteredIntervenants([]);
  }
};


const handleNewReservation = async () => {
  console.log('🎯 === NOUVELLE RÉSERVATION DÉBUT ===');
  
  // Déterminer la date à utiliser
  let dateToUse;
  
  if (selectedDay && selectedDay.date) {
    dateToUse = new Date(selectedDay.date);
    console.log('📅 Utilisation date sélectionnée:', dateToUse.toLocaleDateString('fr-FR'));
  } else {
    dateToUse = new Date();
    console.log('📅 Utilisation date du jour:', dateToUse.toLocaleDateString('fr-FR'));
  }
  
  // Normaliser la date
  dateToUse.setHours(12, 0, 0, 0);
  
  console.log('🔄 Mise à jour modifiedDate:', dateToUse.toLocaleDateString('fr-FR'));
  setModifiedDate(new Date(dateToUse));
  setSelectedDate(new Date(dateToUse));
  
  // Ouvrir le modal IMMÉDIATEMENT
  setIsReservationModalVisible(true);
  
  // Réinitialiser les autres sélections
  setSelectedHeure('');
  setHeureDebut('');
  setSelectedPrestation('');
  setSelectedCategory('');
  setIdEmploye('');
  setIntervenantDisponibilites([]);
  setAddedPrestations([]);
  
  // IMMÉDIATEMENT charger les catégories ET les intervenants pour cette date
  if (idPrestataire) {
    setIsLoading(true);
    try {
      console.log('🔍 Chargement AUTO des catégories et intervenants pour:', dateToUse.toLocaleDateString('fr-FR'));
      
      // 1. Récupérer les intervenants disponibles pour cette date
      const intervenantsDisponibles = await fetchIntervenantsDisponiblesPourDate(dateToUse);
      
      if (intervenantsDisponibles.length === 0) {
        console.log('⚠️ Aucun intervenant disponible');
        setCategories([]);
        setFilteredIntervenants([]);
        
        // Pas d'alerte automatique, on laisse l'utilisateur voir le modal
      } else {
        setFilteredIntervenants(intervenantsDisponibles);
        console.log(`✅ ${intervenantsDisponibles.length} intervenant(s) chargé(s)`);
        
        // 2. Extraire les catégories des intervenants disponibles
        const categoriesDisponibles = new Set();
        
        intervenantsDisponibles.forEach(intervenant => {
          if (intervenant.categorie) {
            const categoriesIntervenant = parseCategories(intervenant.categorie);
            categoriesIntervenant.forEach(cat => {
              if (cat && cat.trim() !== '') {
                categoriesDisponibles.add(cat.trim());
              }
            });
          }
        });
        
        const categoriesArray = Array.from(categoriesDisponibles);
        console.log('📋 Catégories disponibles:', categoriesArray);
        
        // MAJ de l'état avec les catégories disponibles
        setCategories(categoriesArray);
        
        // Filtrer les prestations pour cette date
        const prestationsFiltrees = prestations.filter(presta => {
          if (!presta.categorie) return false;
          return categoriesArray.some(catDispo => 
            presta.categorie.toLowerCase().includes(catDispo.toLowerCase())
          );
        });
        
        setFilteredPrestations(prestationsFiltrees);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement automatique des catégories:', error);
      // En cas d'erreur, charger toutes les catégories (fallback)
      await loadAllCategoriesFallback();
    } finally {
      setIsLoading(false);
    }
  }
  
  console.log('✅ === NOUVELLE RÉSERVATION TERMINÉE ===');
};




const renderTimeSlots = useCallback((heure, index) => (
  <View key={index} style={styles.agendaRow}>
    <Text style={styles.heureLabel}>{heure}</Text>
    <View style={[styles.heureSlot, styles.slotDisponible]}>
      <Text style={styles.slotText}>Disponible</Text>
    </View>
  </View>
), []);


// Fonction pour changer de mois dans le calendrier modal - CORRIGÉE
const changeCalendarMonth = (direction) => {
  console.log('🔄 === CHANGEMENT DE MOIS DÉBUT ===');
  console.log('📅 Mois actuel:', calendarModalMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  console.log('🎯 Direction:', direction);
  
  const newMonth = new Date(calendarModalMonth);
  newMonth.setMonth(calendarModalMonth.getMonth() + direction);
  
  console.log('📅 Nouveau mois:', newMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  
  // FORCER la mise à jour du state
  setCalendarModalMonth(new Date(newMonth));
  
  // Générer le calendrier avec le nouveau mois
  setTimeout(() => {
    generateCalendarWithAvailability(newMonth);
  }, 0);
  
  console.log('✅ === CHANGEMENT DE MOIS TERMINÉ ===');
};


const checkAndLoadIntervenants = async () => {
  if (modifiedDate && idPrestataire && filteredIntervenants.length === 0) {
    console.log('🔄 Vérification et chargement des intervenants...');
    await fetchIntervenantsDisponiblesPourDate(modifiedDate);
  }
};

// Appeler cette fonction quand le modal s'ouvre
useEffect(() => {
  if (isReservationModalVisible) {
    checkAndLoadIntervenants();
  }
}, [isReservationModalVisible]);


// Charger automatiquement les intervenants quand une date est sélectionnée
useEffect(() => {
  const loadIntervenantsForModifiedDate = async () => {
    if (isReservationModalVisible && modifiedDate && idPrestataire && !idEmploye) {
      console.log('🔍 Chargement automatique intervenants pour modifiedDate');
      
      setIsLoading(true);
      try {
        const intervenantsDisponibles = await fetchIntervenantsDisponiblesPourDate(modifiedDate);
        
        if (intervenantsDisponibles.length === 0) {
          await loadAllIntervenants();
        } else {
          setFilteredIntervenants(intervenantsDisponibles);
        }
        
      } catch (error) {
        console.error('❌ Erreur chargement automatique:', error);
        await loadAllIntervenants();
      } finally {
        setIsLoading(false);
      }
    }
  };

  loadIntervenantsForModifiedDate();
}, [modifiedDate, isReservationModalVisible, idPrestataire]);

// Synchronisation améliorée entre mois et semaine
useEffect(() => {
  const synchronizeDaySelection = async () => {
    if (viewMode === 'semaine' && selectedDateFromMonth && joursAvecHoraires.length > 0) {
      console.log('🔄 Synchronisation jour sélectionné');
      
      // Normaliser la date de comparaison
      const targetDate = new Date(selectedDateFromMonth);
      targetDate.setHours(0, 0, 0, 0);
      
      console.log('🎯 Recherche du jour correspondant:', targetDate.toLocaleDateString('fr-FR'));
      console.log('📅 Jours disponibles:', joursAvecHoraires.map(j => j.date.toLocaleDateString('fr-FR')));
      
      // Trouver le jour correspondant dans la vue semaine
      const jourCorrespondant = joursAvecHoraires.find(j => {
        if (!j.date) return false;
        const jDate = new Date(j.date);
        jDate.setHours(0, 0, 0, 0);
        const isMatch = jDate.getTime() === targetDate.getTime();
        
        if (isMatch) {
          console.log('✅ Jour trouvé:', j.date.toLocaleDateString('fr-FR'));
        }
        
        return isMatch;
      });
      
      if (jourCorrespondant) {
        console.log('🎯 Sélection du jour dans vue semaine');
        setSelectedDay(jourCorrespondant);
        
        // Charger les réservations du jour sélectionné
        try {
          const reservations = await fetchReservationsDuJour(jourCorrespondant.date);
          setReservationsDuJour(reservations);
          console.log('📅 Réservations chargées:', reservations.length);
        } catch (error) {
          console.error('❌ Erreur chargement réservations:', error);
          setReservationsDuJour([]);
        }
      } else {
        console.log('❌ Aucun jour correspondant trouvé');
      }
      
      // Réinitialiser après la sélection
      setSelectedDateFromMonth(null);
    }
  };

  synchronizeDaySelection();
}, [viewMode, selectedDateFromMonth, joursAvecHoraires]);

// Synchronisation FORCÉE du calendrier modal quand il s'ouvre
useEffect(() => {
  if (showDatePicker) {
    console.log('🎯 === OUVERTURE CALENDRIER MODAL ===');
    
    // Déterminer la date à afficher
    let dateToShow;
    if (modifiedDate) {
      dateToShow = new Date(modifiedDate);
      console.log('📅 Utilisation date modifiée:', dateToShow.toLocaleDateString('fr-FR'));
    } else {
      dateToShow = new Date();
      console.log('📅 Utilisation date du jour:', dateToShow.toLocaleDateString('fr-FR'));
    }
    
    // S'assurer qu'on a le bon mois
    dateToShow.setHours(12, 0, 0, 0);
    
    console.log('🔄 Mise à jour calendarModalMonth:', dateToShow.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    
    // FORCER la mise à jour
    setCalendarModalMonth(new Date(dateToShow));
    
    // Générer le calendrier après un court délai
    setTimeout(() => {
      generateCalendarWithAvailability(dateToShow);
    }, 100);
  }
}, [showDatePicker, modifiedDate]);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setEmployes([]);
      setHorairesData([]);
      setPrestataire({ nom: '', prenom: '' });
      setPrestations([]);
      setCategories([]);
      setSelectedCategory('');
      setSelectedPrestation('');
      setModifiedDate(null);

      const sessionString = await AsyncStorage.getItem('userSession');
      if (!sessionString) throw new Error('Aucune session trouvée');

      const session = JSON.parse(sessionString);
      setUserSession(session);

      const prestataireId = session.id_prestataire || session.id;
      if (!prestataireId) throw new Error('ID prestataire manquant');
      setIdPrestataire(prestataireId);

      // Récupérer les jours fermés
      await fetchJoursFermes(prestataireId);

      const [employesResponse, horairesResponse, prestationsResponse] = await Promise.all([
        fetch(`http://192.168.1.68:3000/api/employes?id_prestataire=${prestataireId}`),
        fetch(`http://192.168.1.68:3000/api/horaires/${prestataireId}`),
        fetch(`http://192.168.1.68:3000/api/prestationsreservation?id_prestataire=${prestataireId}`)
      ]);

      if (!employesResponse.ok) throw new Error('Erreur lors du chargement des employés');
      if (!horairesResponse.ok) throw new Error('Erreur lors du chargement des horaires');
      if (!prestationsResponse.ok) throw new Error('Erreur lors du chargement des prestations');

      const employesData = await employesResponse.json();
      if (employesData.prestataire) {
        setPrestataire(employesData.prestataire);
      }
      if (Array.isArray(employesData.employes)) {
        setEmployes(employesData.employes);
      }

      const horairesData = await horairesResponse.json();
      setRawHoraires(horairesData); // ← Ajoutez cette ligne
      const generatedHoraires = generateHoraires(horairesData, startOffset, endOffset);
      setHorairesData(generatedHoraires);

      const prestationsData = await prestationsResponse.json();
      setPrestations(prestationsData.prestations);
      
      const validCategories = prestationsData.categories.filter(cat => cat && cat.trim() !== '');
      setCategories(validCategories);

    } catch (error) {
      console.error('Erreur fetchData:', error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [startOffset, endOffset]);

// Fonction de mock pour tester les créneaux occupés
const generateMockCreneauxWithOccupied = (date, dureeMinutes) => {
  console.log('Génération de créneaux mock avec réservations simulées');
  
  const creneaux = [];
  const startHour = 9;
  const endHour = 18;
  
  // Simuler plusieurs réservations pour tester
  const reservations = [
    { start: 9 * 60, end: 9 * 60 + 20 }, // 9h00-9h20
    { start: 10 * 60 + 30, end: 11 * 60 }, // 10h30-11h00
    { start: 14 * 60, end: 14 * 60 + 45 }, // 14h00-14h45
  ];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) { // Pas de 15 minutes
      const currentTime = hour * 60 + minute;
      const creneauFin = currentTime + dureeMinutes;
      
      if (creneauFin > endHour * 60) continue;
      
      // Vérifier si le créneau chevauche une réservation
      const isOccupied = reservations.some(res => 
        currentTime < res.end && creneauFin > res.start
      );
      
      if (!isOccupied) {
        const heureDebut = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHourActual = Math.floor(creneauFin / 60);
        const endMinuteActual = creneauFin % 60;
        const heureFin = `${endHourActual.toString().padStart(2, '0')}:${endMinuteActual.toString().padStart(2, '0')}`;
        
        creneaux.push({
          heure: heureDebut,
          heure_fin: heureFin,
          decimal: currentTime / 60
        });
      }
    }
  }
  
  console.log('Créneaux mock générés:', creneaux.length);
  return creneaux;
};

const loadDisponibilitesIntervenant = async (intervenantId, date) => {
  if (!selectedPrestationDetails?.temps) {
    console.log('❌ Durée de prestation manquante');
    alert('Veuillez d\'abord sélectionner une prestation');
    return;
  }
  
  setIsLoading(true);
  setIntervenantDisponibilites([]); // Réinitialiser avant de charger
  
  try {
    console.log('📥 Chargement des disponibilités AVEC VÉRIFICATION RÉSERVATIONS...');
    console.log('👤 Intervenant:', intervenantId);
    console.log('📅 Date:', date.toLocaleDateString('fr-FR'));
    console.log('⏱️ Durée prestation:', selectedPrestationDetails.temps);
    
    // Utiliser la nouvelle fonction qui vérifie les réservations existantes
    const disponibilites = await fetchDisponibilitesIntervenant(
      intervenantId, 
      date,
      selectedPrestationDetails.temps
    );
    
    console.log('📋 Créneaux disponibles après vérification réservations:', disponibilites.length);
    
    if (disponibilites.length === 0) {
      console.log('⚠️ Aucun créneau disponible - Intervenant déjà réservé ou salon fermé');
      
      // Récupérer les réservations existantes pour informer l'utilisateur
      const datePourAPI = date.toISOString().split('T')[0];
      
      try {
        const response = await fetch(
          `http://192.168.1.68:3000/api/reservations-intervenant?date=${datePourAPI}&intervenant_id=${intervenantId}&type=${intervenantId === "prestataire" ? 'prestataire' : 'employe'}&prestataire_id=${idPrestataire}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.reservations && data.reservations.length > 0) {
            const reservationsText = data.reservations.map(r => 
              `${r.heure_debut}-${r.heure_fin} (${r.temps} min)`
            ).join(', ');
            
            alert(`Cet intervenant a déjà des réservations ce jour:\n${reservationsText}\n\nVeuillez choisir un autre créneau.`);
          } else {
            // Vérifier si le salon est fermé
            const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
            const horaireSalon = rawHoraires.find(h => h.jour === jourSemaine);
            
            if (horaireSalon?.is_ferme) {
              alert(`Le salon est fermé le ${jourSemaine}`);
            } else {
              alert('Aucun créneau disponible pour cette combinaison date/intervenant/durée');
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur récupération réservations:', error);
        alert('Aucun créneau disponible pour cet intervenant à cette date');
      }
    } else {
      setIntervenantDisponibilites(disponibilites);
      
      // Afficher un message informatif sur le nombre de créneaux disponibles
      if (disponibilites.length > 0) {
        const heureDebut = disponibilites[0].heure;
        const heureFin = disponibilites[disponibilites.length - 1].heure_fin;
        console.log(`📊 Créneaux disponibles de ${heureDebut} à ${heureFin}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    
    // Fallback manuel
    const fallbackCreneaux = generateFallbackCreneaux(selectedPrestationDetails.temps);
    console.log('🔄 Utilisation de fallback:', fallbackCreneaux.length, 'créneaux');
    setIntervenantDisponibilites(fallbackCreneaux);
    
    alert(`Erreur technique. ${fallbackCreneaux.length} créneaux générés manuellement.`);
  } finally {
    setIsLoading(false);
  }
};


// Ajouter cette fonction pour mieux gérer l'affichage des créneaux
const filtrerCreneauxSelonReservations = (creneauxDisponibles, reservationsExistantes, dureeMinutes) => {
  if (!reservationsExistantes || reservationsExistantes.length === 0) {
    return creneauxDisponibles;
  }

  const convertirHeureEnMinutes = (heureStr) => {
    if (!heureStr) return 0;
    const [heures, minutes] = heureStr.split(':').map(Number);
    return heures * 60 + minutes;
  };

  const convertirMinutesEnHeure = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Convertir les réservations en plages occupées
  const plagesOccupees = reservationsExistantes.map(res => ({
    debut: convertirHeureEnMinutes(res.heure_debut),
    fin: convertirHeureEnMinutes(res.heure_fin)
  }));

  // Filtrer les créneaux qui ne chevauchent pas les réservations existantes
  const creneauxFiltres = creneauxDisponibles.filter(creneau => {
    const creneauDebutMin = convertirHeureEnMinutes(creneau.heure);
    const creneauFinMin = creneauDebutMin + dureeMinutes;

    // Vérifier si le créneau chevauche une réservation existante
    const chevauche = plagesOccupees.some(occupe => {
      return (creneauDebutMin < occupe.fin && creneauFinMin > occupe.debut);
    });

    return !chevauche;
  });

  console.log(`🎯 ${creneauxFiltres.length} créneau(x) disponibles après filtration`);
  
  return creneauxFiltres;
};

// Fonction pour récupérer les disponibilités d'un intervenant POUR LE CALENDRIER (jours disponibles)
const fetchDisponibilitesIntervenantCalendrier = async (intervenantId) => {
  try {
    console.log('🔍 === DEBUT fetchDisponibilitesIntervenantCalendrier ===');
    console.log('👤 Intervenant ID:', intervenantId);
    console.log('🏢 ID Prestataire:', idPrestataire);

    let url = `http://192.168.1.68:3000/api/disponibilites-intervenant-calendrier?`;
    
    if (intervenantId === "prestataire") {
      url += `prestataire_id=${idPrestataire}`;
      console.log('🎯 Mode: Prestataire (vous-même)');
    } else {
      url += `employe_id=${intervenantId}&prestataire_id=${idPrestataire}`;
      console.log('🎯 Mode: Employé');
    }
    
    console.log('📅 URL appelée:', url);
    
    const response = await fetch(url, {
      timeout: 10000
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erreur HTTP:', response.status, errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Réponse API calendrier:', data);
    
    return data.disponibilites || {};
    
  } catch (error) {
    console.error('💥 Erreur récupération disponibilités calendrier:', error);
    return {};
  }
};

// REMPLACER la fonction fetchDisponibilitesIntervenant existante par cette version améliorée :
const fetchDisponibilitesIntervenant = async (intervenantId, date, dureeMinutes) => {
  try {
    console.log('🔍 === NOUVELLE VÉRIFICATION DISPONIBILITÉS ===');
    console.log('👤 Intervenant ID:', intervenantId);
    console.log('📅 Date:', date?.toLocaleDateString('fr-FR'));
    console.log('⏱️ Durée prestation:', dureeMinutes);
    console.log('🏢 ID Prestataire:', idPrestataire);

    // Validation des paramètres
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error('❌ Date invalide:', date);
      return [];
    }
    
    if (!idPrestataire) {
      console.error('❌ ID prestataire manquant');
      return [];
    }
    
    if (!dureeMinutes || dureeMinutes <= 0) {
      console.error('❌ Durée invalide:', dureeMinutes);
      return [];
    }

    // Normaliser la date
    const dateNormalisee = new Date(date);
    dateNormalisee.setHours(12, 0, 0, 0);
    const datePourAPI = dateNormalisee.toISOString().split('T')[0];
    
    // 1. Vérifier les horaires du salon pour ce jour
    const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const horaireSalon = rawHoraires.find(h => h.jour === jourSemaine);
    
    if (!horaireSalon || horaireSalon.is_ferme) {
      console.log('❌ Salon fermé ce jour');
      return [];
    }

    console.log('🏪 Horaire salon:', {
      jour: jourSemaine,
      ouverture: horaireSalon.heure_ouverture,
      fermeture: horaireSalon.heure_fermeture,
      pause: horaireSalon.pause_debut ? `${horaireSalon.pause_debut}-${horaireSalon.pause_fin}` : 'Aucune'
    });

    // 2. Récupérer les réservations existantes de cet intervenant pour cette date
    let reservationsQuery = `
      SELECT r.heure_debut, r.heure_fin 
      FROM reservation r
      WHERE r.date_reservation = ? 
        AND r.statut = 'reservé'
        AND r.annulee = 0
        AND r.supprimee = 0
    `;
    
    let params = [datePourAPI];

    if (intervenantId === "prestataire") {
      reservationsQuery += ` AND r.id_prestataire = ?`;
      params.push(idPrestataire);
    } else {
      reservationsQuery += ` AND r.id_employe = ?`;
      params.push(intervenantId);
    }

    console.log('📝 Query réservations existantes:', reservationsQuery);
    console.log('📝 Paramètres:', params);

    // 3. Appeler l'API pour récupérer les réservations existantes
    const reservations = await new Promise((resolve) => {
      // Simuler un appel API (à remplacer par votre vraie requête)
      fetch(`http://192.168.1.68:3000/api/reservations-intervenant?date=${datePourAPI}&intervenant_id=${intervenantId}&type=${intervenantId === "prestataire" ? 'prestataire' : 'employe'}&prestataire_id=${idPrestataire}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          return { reservations: [] };
        })
        .then(data => {
          console.log('📅 Réservations existantes trouvées:', data.reservations?.length || 0);
          console.log('📋 Détails réservations:', data.reservations);
          resolve(data.reservations || []);
        })
        .catch(error => {
          console.error('❌ Erreur récupération réservations:', error);
          resolve([]);
        });
    });

    // 4. Convertir les heures en minutes pour les calculs
    const convertirHeureEnMinutes = (heureStr) => {
      if (!heureStr) return 0;
      const [heures, minutes] = heureStr.split(':').map(Number);
      return heures * 60 + minutes;
    };

    const convertirMinutesEnHeure = (minutes) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const ouvertureSalonMin = convertirHeureEnMinutes(horaireSalon.heure_ouverture);
    const fermetureSalonMin = convertirHeureEnMinutes(horaireSalon.heure_fermeture);
    const pauseDebutMin = horaireSalon.pause_debut ? convertirHeureEnMinutes(horaireSalon.pause_debut) : null;
    const pauseFinMin = horaireSalon.pause_fin ? convertirHeureEnMinutes(horaireSalon.pause_fin) : null;

    console.log('⏰ Horaires en minutes:', {
      ouverture: ouvertureSalonMin,
      fermeture: fermetureSalonMin,
      pauseDebut: pauseDebutMin,
      pauseFin: pauseFinMin
    });

    // 5. Convertir les réservations existantes en plages occupées
    const plagesOccupees = reservations.map(res => ({
      debut: convertirHeureEnMinutes(res.heure_debut),
      fin: convertirHeureEnMinutes(res.heure_fin)
    }));

    console.log('📋 Plages occupées (en minutes):', plagesOccupees);

    // 6. Calculer les créneaux disponibles en évitant les chevauchements
    const creneauxDisponibles = [];
    
    // Définir les périodes de travail (hors pause)
    const periodes = [];
    
    if (pauseDebutMin && pauseFinMin) {
      // Période 1: ouverture → début pause
      if (ouvertureSalonMin < pauseDebutMin) {
        periodes.push({ debut: ouvertureSalonMin, fin: Math.min(pauseDebutMin, fermetureSalonMin) });
      }
      // Période 2: fin pause → fermeture
      if (pauseFinMin < fermetureSalonMin) {
        periodes.push({ debut: Math.max(pauseFinMin, ouvertureSalonMin), fin: fermetureSalonMin });
      }
    } else {
      // Pas de pause
      periodes.push({ debut: ouvertureSalonMin, fin: fermetureSalonMin });
    }

    console.log('⏰ Périodes de travail après pause:', periodes);

    // 7. Générer les créneaux pour chaque période
    periodes.forEach((periode, index) => {
      console.log(`🔄 Période ${index + 1}: ${convertirMinutesEnHeure(periode.debut)} - ${convertirMinutesEnHeure(periode.fin)}`);
      
      // Parcourir chaque minute possible avec un pas de 30 minutes pour plus de précision
      for (let time = periode.debut; time <= periode.fin - dureeMinutes; time += 30) {
        const creneauFin = time + dureeMinutes;
        
        // Vérifier si le créneau dépasse la période
        if (creneauFin > periode.fin) continue;
        
        // Vérifier si le créneau chevauche une réservation existante
        const estOccupe = plagesOccupees.some(occupe => {
          // Le créneau chevauche s'il commence pendant une réservation existante
          // ou s'il termine pendant une réservation existante
          const chevauche = (time >= occupe.debut && time < occupe.fin) || 
                           (creneauFin > occupe.debut && creneauFin <= occupe.fin) ||
                           (time < occupe.debut && creneauFin > occupe.fin);
          
          if (chevauche) {
            console.log(`❌ Créneau ${convertirMinutesEnHeure(time)}-${convertirMinutesEnHeure(creneauFin)} chevauche réservation ${convertirMinutesEnHeure(occupe.debut)}-${convertirMinutesEnHeure(occupe.fin)}`);
          }
          return chevauche;
        });

        if (!estOccupe) {
          // Vérifier aussi que le créneau ne commence pas pendant une pause
          const estPause = pauseDebutMin && pauseFinMin && 
                          time < pauseFinMin && creneauFin > pauseDebutMin;
          
          if (!estPause) {
            creneauxDisponibles.push({
              heure: convertirMinutesEnHeure(time),
              heure_fin: convertirMinutesEnHeure(creneauFin),
              decimal: time / 60,
              duree: dureeMinutes
            });
            
            console.log(`✅ Créneau disponible: ${convertirMinutesEnHeure(time)}-${convertirMinutesEnHeure(creneauFin)}`);
          }
        }
      }
    });

    // Trier les créneaux par heure
    creneauxDisponibles.sort((a, b) => a.decimal - b.decimal);

    console.log(`🎉 ${creneauxDisponibles.length} créneau(x) disponible(s) après vérification des réservations`);
    
    return creneauxDisponibles;

  } catch (error) {
    console.error('💥 Erreur récupération disponibilités avec réservations:', error);
    
    // Fallback: générer des créneaux basiques sans vérification
    const fallbackCreneaux = generateFallbackCreneaux(dureeMinutes);
    console.log('🔄 Utilisation fallback:', fallbackCreneaux.length, 'créneaux');
    
    return fallbackCreneaux;
  }
};

// ⚠️ FONCTION TEMPORAIRE - À SUPPRIMER APRÈS
const generateMockCreneaux = (date, dureeMinutes) => {
  console.log('Génération de créneaux mock pour debug');
  
  const creneaux = [];
  const startHour = 9;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += dureeMinutes) {
      if (hour === 17 && minute + dureeMinutes > 0) break;
      
      const heureDebut = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const endMinute = minute + dureeMinutes;
      const endHourActual = hour + Math.floor(endMinute / 60);
      const endMinuteActual = endMinute % 60;
      
      const heureFin = `${endHourActual.toString().padStart(2, '0')}:${endMinuteActual.toString().padStart(2, '0')}`;
      
      creneaux.push({
        heure: heureDebut,
        heure_fin: heureFin,
        decimal: hour + (minute / 60)
      });
    }
  }
  
  return creneaux;
};


// Effet pour recharger les catégories CHAQUE fois que la date change
useEffect(() => {
  const loadCategoriesForDate = async () => {
    if (isReservationModalVisible && modifiedDate && idPrestataire) {
      console.log('🔄 DATE CHANGÉE - Rechargement des catégories pour:', 
        modifiedDate.toLocaleDateString('fr-FR'));
      
      setIsLoading(true);
      try {
        // 1. Récupérer les intervenants disponibles pour cette NOUVELLE date
        const intervenantsDisponibles = await fetchIntervenantsDisponiblesPourDate(modifiedDate);
        
        // Réinitialiser les sélections liées à l'ancienne date
        setSelectedCategory('');
        setSelectedPrestation('');
        setSelectedPrestationDetails(null);
        setIdEmploye('');
        setIntervenantDisponibilites([]);
        
        if (intervenantsDisponibles.length === 0) {
          // Aucun intervenant disponible
          setCategories([]);
          setFilteredIntervenants([]);
          setFilteredPrestations([]);
        } else {
          // Mettre à jour les intervenants
          setFilteredIntervenants(intervenantsDisponibles);
          
          // 2. Extraire les nouvelles catégories
          const nouvellesCategories = extractCategoriesFromIntervenants(intervenantsDisponibles);
          
          // 3. Filtrer les prestations pour ces nouvelles catégories
          const nouvellesPrestations = prestations.filter(presta => {
            if (!presta.categorie) return false;
            return nouvellesCategories.some(catDispo => 
              presta.categorie.toLowerCase().includes(catDispo.toLowerCase())
            );
          });
          
          // Mettre à jour les états
          setCategories(nouvellesCategories);
          setFilteredPrestations(nouvellesPrestations);
          
          console.log(`🔄 ${nouvellesCategories.length} nouvelle(s) catégorie(s) chargée(s)`);
        }
        
      } catch (error) {
        console.error('❌ Erreur rechargement catégories:', error);
        setCategories([]);
        setFilteredPrestations([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Utiliser un délai pour éviter les appels trop fréquents
  const timer = setTimeout(() => {
    loadCategoriesForDate();
  }, 300);

  return () => clearTimeout(timer);
}, [modifiedDate, isReservationModalVisible, idPrestataire]);

// Fonction utilitaire pour extraire les catégories des intervenants
const extractCategoriesFromIntervenants = (intervenants) => {
  const categoriesSet = new Set();
  
  if (!intervenants || !Array.isArray(intervenants)) {
    return [];
  }
  
  intervenants.forEach(intervenant => {
    if (intervenant.categorie) {
      const categoriesIntervenant = parseCategories(intervenant.categorie);
      categoriesIntervenant.forEach(cat => {
        if (cat && cat.trim() !== '') {
          categoriesSet.add(cat.trim());
        }
      });
    }
  });
  
  return Array.from(categoriesSet);
};

const handleDateSelection = async (date) => {
  try {
    const dateNormalisee = new Date(date);
    dateNormalisee.setHours(12, 0, 0, 0);
    
    const jourSemaine = dateNormalisee.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const horaireJour = rawHoraires.find(h => h.jour === jourSemaine);
    
    if (!horaireJour) {
      alert(`Aucun horaire défini pour le ${jourSemaine}`);
      return;
    }

    if (horaireJour.is_ferme) {
      alert(`Le ${jourSemaine} est un jour fermé`);
      return;
    }

    // Mettre à jour la date
    setModifiedDate(dateNormalisee);
    setCalendarModalMonth(new Date(dateNormalisee));
    setShowDatePicker(false);

    // Réinitialiser les sélections précédentes
    setSelectedCategory('');
    setSelectedPrestation('');
    setSelectedPrestationDetails(null);
    setIdEmploye('');
    setIntervenantDisponibilites([]);
    
    // Afficher le loading
    setIsLoading(true);
    
    console.log('🔍 Recherche des catégories disponibles pour:', dateNormalisee.toLocaleDateString('fr-FR'));
    
    // 1. Récupérer les intervenants disponibles pour cette NOUVELLE date
    const intervenantsDisponibles = await fetchIntervenantsDisponiblesPourDate(dateNormalisee);
    
    if (intervenantsDisponibles.length === 0) {
      // Aucun intervenant disponible pour cette date
      setFilteredIntervenants([]);
      setCategories([]);
      setFilteredPrestations([]);
      
      console.log('⚠️ Aucun intervenant disponible pour cette date');
      
      // Ne pas afficher d'alerte, laisser l'interface montrer l'état
    } else {
      // Mettre à jour les intervenants filtrés
      setFilteredIntervenants(intervenantsDisponibles);
      
      // 2. Extraire les catégories DES INTERVENANTS DISPONIBLES
      const categoriesDisponibles = extractCategoriesFromIntervenants(intervenantsDisponibles);
      
      console.log('📋 Catégories trouvées:', categoriesDisponibles);
      
      // 3. Filtrer les prestations POUR CES CATÉGORIES
      const prestationsFiltrees = prestations.filter(presta => {
        if (!presta.categorie) return false;
        return categoriesDisponibles.some(catDispo => 
          presta.categorie.toLowerCase().includes(catDispo.toLowerCase())
        );
      });
      
      // Mettre à jour les états
      setCategories(categoriesDisponibles);
      setFilteredPrestations(prestationsFiltrees);
      
      console.log(`✅ ${categoriesDisponibles.length} catégorie(s) et ${prestationsFiltrees.length} prestation(s) disponibles`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la sélection de date:', error);
    alert('Erreur lors du chargement des données pour cette date');
    
    // Réinitialiser en cas d'erreur
    setCategories([]);
    setFilteredPrestations([]);
    setFilteredIntervenants([]);
  } finally {
    setIsLoading(false);
  }
};



// Fonction pour récupérer toutes les disponibilités (tous les intervenants)
const fetchDisponibilitesGlobales = async (date, dureeMinutes, categorie) => {
  try {
    const dateNormalisee = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    const datePourAPI = dateNormalisee.toISOString().split('T')[0];

    const queryParams = new URLSearchParams({
      prestataire_id: idPrestataire,
      date: datePourAPI,
      duree_minutes: dureeMinutes,
      ...(categorie && { categorie: categorie })
    });

    const response = await fetch(
      `http://192.168.1.68:3000/api/disponibilites-globales?${queryParams}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.disponibilites || [];
    }
    
    return [];
  } catch (error) {
    console.error('Erreur récupération disponibilités globales:', error);
    return [];
  }
};



const renderReservationsInfo = () => {
  if (!intervenantDisponibilites.length || !selectedPrestationDetails) return null;

  return (
    <View style={styles.reservationsInfo}>
      <Text style={styles.reservationsTitle}>Informations de réservation:</Text>
      <Text style={styles.reservationsText}>
        Prestation: {selectedPrestationDetails.titre} ({selectedPrestationDetails.temps} min)
      </Text>
      <Text style={styles.reservationsText}>
        Intervenant: {idEmploye === "prestataire" 
          ? `${prestataire.prenom} ${prestataire.nom}` 
          : employes.find(e => e.id_employe === idEmploye)?.prenom + " " + employes.find(e => e.id_employe === idEmploye)?.nom}
      </Text>
      <Text style={styles.reservationsText}>
        Date: {modifiedDate?.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </Text>
    </View>
  );
};


// Ajoutez cette fonction pour debugger
const debugHorairesStructure = () => {
  console.log('=== DEBUG HORAIRES STRUCTURE ===');
  console.log('Raw horaires:', rawHoraires);
  
  if (rawHoraires && rawHoraires.length > 0) {
    rawHoraires.forEach((horaire, index) => {
      console.log(`Horaire ${index}:`, horaire);
      console.log(`Jour: ${horaire.jour}, Heures:`, horaire.heures);
      
      if (horaire.heures && horaire.heures.length > 0) {
        horaire.heures.forEach((plage, plageIndex) => {
          console.log(`Plage ${plageIndex}:`, plage);
          console.log('Type:', typeof plage);
          
          if (typeof plage === 'object') {
            console.log('Début:', plage.debut);
            console.log('Fin:', plage.fin);
          }
        });
      }
    });
  } else {
    console.log('Aucun horaire trouvé');
  }
};




useEffect(() => {
  console.log('🔄 === CHANGEMENTS DES SÉLECTIONS ===');
  console.log('📅 modifiedDate:', modifiedDate?.toLocaleDateString('fr-FR'));
  console.log('👤 idEmploye:', idEmploye);
  console.log('💼 selectedPrestationDetails:', selectedPrestationDetails);
  console.log('⏱️ Durée prestation:', selectedPrestationDetails?.temps);
  
  if (modifiedDate && idEmploye && selectedPrestationDetails?.temps) {
    console.log('🎯 Conditions remplies pour charger les disponibilités');
    
    // Charger les disponibilités
    loadDisponibilitesIntervenant(idEmploye, modifiedDate);
  } else {
    console.log('⏳ Conditions non remplies:');
    console.log('- Date?:', !!modifiedDate);
    console.log('- Intervenant?:', !!idEmploye);
    console.log('- Prestation?:', !!selectedPrestationDetails);
    console.log('- Durée?:', selectedPrestationDetails?.temps);
  }
}, [modifiedDate, idEmploye, selectedPrestationDetails]);


// Appelez-la après avoir chargé les horaires
useEffect(() => {
  if (rawHoraires.length > 0) {
    debugHorairesStructure();
  }
}, [rawHoraires]);

const generateCreneauxFromHoraires = (date, dureeMinutes) => {
  try {
    const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const horaireJour = rawHoraires.find(h => 
      h.jour && h.jour.toLowerCase() === jourSemaine
    );
    
    if (!horaireJour) return generateFallbackCreneaux(dureeMinutes);
    
    const creneaux = [];
    const ouvertureMin = convertirHeureEnMinutes(horaireJour.heure_ouverture);
    const fermetureMin = convertirHeureEnMinutes(horaireJour.heure_fermeture);
    
    for (let time = ouvertureMin; time <= fermetureMin - dureeMinutes; time += dureeMinutes) {
      const creneauFin = time + dureeMinutes;
      
      creneaux.push({
        heure: convertirMinutesEnHeure(time),
        heure_fin: convertirMinutesEnHeure(creneauFin),
        decimal: time / 60
      });
    }
    
    return creneaux;
  } catch (error) {
    console.error('Erreur:', error);
    return generateFallbackCreneaux(dureeMinutes);
  }
};

// Ajoutez ces fonctions utilitaires
const convertirHeureEnMinutes = (heureStr) => {
  const [heures, minutes] = heureStr.split(':').map(Number);
  return heures * 60 + minutes;
};

const convertirMinutesEnHeure = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};


const generateFallbackCreneaux = (dureeMinutes) => {
  console.log('🔄 Génération fallback avec durée:', dureeMinutes);
  
  if (!dureeMinutes || dureeMinutes <= 0) {
    console.error('❌ Durée invalide pour fallback:', dureeMinutes);
    return [];
  }
  
  const creneaux = [];
  const startHour = 9; // 9h
  const endHour = 18; // 18h
  
  // Vérifier si on a une date sélectionnée
  if (modifiedDate) {
    const jourSemaine = modifiedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const horaireJour = rawHoraires.find(h => h.jour === jourSemaine);
    
    if (horaireJour && !horaireJour.is_ferme) {
      // Utiliser les vraies heures d'ouverture
      const ouverture = convertirHeureEnMinutes(horaireJour.heure_ouverture);
      const fermeture = convertirHeureEnMinutes(horaireJour.heure_fermeture);
      
      console.log('🏪 Utilisation horaires réels:', {
        ouverture: convertirMinutesEnHeure(ouverture),
        fermeture: convertirMinutesEnHeure(fermeture),
        dureeMinutes
      });
      
      for (let time = ouverture; time <= fermeture - dureeMinutes; time += dureeMinutes) {
        const creneauFin = time + dureeMinutes;
        
        if (creneauFin > fermeture) break;
        
        creneaux.push({
          heure: convertirMinutesEnHeure(time),
          heure_fin: convertirMinutesEnHeure(creneauFin),
          decimal: time / 60,
          isFallback: true // Indicateur que c'est un créneau de fallback
        });
      }
      
      console.log(`🔧 ${creneaux.length} créneaux fallback générés avec horaires réels`);
      return creneaux;
    }
  }
  
  // Fallback générique
  console.log('⚠️ Utilisation du fallback générique');
  
  for (let heure = startHour; heure < endHour; heure++) {
    for (let minute = 0; minute < 60; minute += 15) { // Pas de 15 minutes
      const currentTime = heure * 60 + minute;
      const creneauFin = currentTime + dureeMinutes;
      
      if (creneauFin > endHour * 60) continue;
      
      const heureDebut = `${heure.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHourActual = Math.floor(creneauFin / 60);
      const endMinuteActual = creneauFin % 60;
      const heureFin = `${endHourActual.toString().padStart(2, '0')}:${endMinuteActual.toString().padStart(2, '0')}`;
      
      creneaux.push({
        heure: heureDebut,
        heure_fin: heureFin,
        decimal: currentTime / 60,
        isFallback: true
      });
    }
  }
  
  console.log(`🔧 ${creneaux.length} créneaux fallback générés (générique)`);
  return creneaux;
};



// Fallback modifié pour prendre en compte la durée
const generateFallbackDisponibilites = (dureeMinutes) => {
  console.log('Utilisation du fallback manuel avec durée:', dureeMinutes);
  const creneaux = [];
  const dureeHeures = dureeMinutes / 60;
  
  // Générer des créneaux de 9h à 18h avec l'intervalle spécifié
  for (let heure = 9; heure <= 18 - dureeHeures; heure += dureeHeures) {
    const heureDebutDecimal = heure;
    const heureFinDecimal = heure + dureeHeures;
    
    creneaux.push({
      heure: convertirDecimalEnHeure(heureDebutDecimal),
      decimal: heureDebutDecimal,
      heure_fin: convertirDecimalEnHeure(heureFinDecimal)
    });
  }
  
  return creneaux;
};

// Fonction de conversion utilitaire
const convertirDecimalEnHeure = (decimal) => {
  const heures = Math.floor(decimal);
  const minutes = Math.round((decimal - heures) * 60);
  return `${heures.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};


const fetchEmployes = async (categorie) => {
  try {
    const url = `http://192.168.1.68:3000/api/employes?id_prestataire=${
      userSession.id_prestataire || userSession.id
    }${categorie ? `&categorie=${encodeURIComponent(categorie)}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Erreur lors du chargement des employés');
    
    const data = await response.json();
    
    // NE PAS définir d'intervenant par défaut
    setPrestataire(data.prestataire || { nom: '', prenom: '' });
    setEmployes(data.employes || []);
    
  } catch (error) {
    console.error('Erreur fetchEmployes:', error);
  }
};


  useEffect(() => {
    if (selectedCategory) {
      fetchEmployes(selectedCategory);
      setShowPrestataireSection(true);
    }
  }, [selectedCategory]);

  const searchClient = async (field, value) => {
    try {
      setIsSearchingClient(true);
      
      const response = await fetch(
        `http://192.168.1.68:3000/api/search-client?${field}=${encodeURIComponent(value)}`
      );
      const data = await response.json();

      if (data.client) {
        setClientNom(data.client.nom || clientNom);
        setClientPrenom(data.client.prenom || clientPrenom);
        setClientAdresse(data.client.adresse || clientAdresse);
        setClientMail(data.client.mail || clientMail);
        setClientTelephone(data.client.numero || clientTelephone);
        setIdClient(data.client.id_client || '');
      }
    } catch (error) {
      console.error('Erreur recherche client:', error);
    } finally {
      setIsSearchingClient(false);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

const generateHoraires = (data, startOffset, endOffset) => {
  const today = new Date();
  let dates = [];

  for (let offset = startOffset; offset <= endOffset; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    
    const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const horaire = data.find(h => h.jour && h.jour.toLowerCase() === jourSemaine);

    // CORRECTION : Vérifier si le jour est fermé d'abord
    const isFerme = joursFermes.includes(jourSemaine) || horaire?.is_ferme;
    
    // CORRECTION : isOpen doit être true si le jour n'est pas fermé ET a des horaires valides
    const isOpen = !isFerme && horaire && 
                  horaire.heure_ouverture !== '00:00:00' && 
                  horaire.heure_fermeture !== '00:00:00';

    console.log(`✅ ${jourSemaine}:`, { isFerme, isOpen, horaire });

    dates.push({ 
      date, 
      heures: isFerme ? [] : (horaire?.heures || []),
      isFerme,
      isOpen
    });
  }

  return dates;
};

// Fonction pour convertir le nouveau format en ancien format
const genererHeuresAncienFormat = (horaire) => {
  const heures = [];
  const start = parseInt(horaire.heure_ouverture);
  const end = parseInt(horaire.heure_fermeture);
  
  for (let hour = start; hour < end; hour++) {
    heures.push(`${hour}h00`);
    if (hour + 0.5 < end) {
      heures.push(`${hour}h30`);
    }
  }
  
  return heures;
};


const handleSelectCreneau = (heureDebutCreneau) => {
  setHeureDebut(heureDebutCreneau);
  
  if (selectedPrestationDetails) {
    // Trouver le créneau sélectionné pour avoir l'heure de fin exacte
    const creneauSelectionne = intervenantDisponibilites.find(
      creneau => creneau.heure === heureDebutCreneau
    );
    
    if (creneauSelectionne) {
      setHeureFin(creneauSelectionne.heure_fin);
    } else {
      // Fallback au calcul manuel
      const [heures, minutes] = heureDebutCreneau.split(':').map(Number);
      const dateDebut = new Date();
      dateDebut.setHours(heures, minutes, 0, 0);
      
      const dateFin = new Date(dateDebut);
      dateFin.setMinutes(dateFin.getMinutes() + selectedPrestationDetails.temps);
      
      const heuresFin = dateFin.getHours().toString().padStart(2, '0');
      const minutesFin = dateFin.getMinutes().toString().padStart(2, '0');
      
      setHeureFin(`${heuresFin}:${minutesFin}`);
    }
  }
};




const renderCreneauxDisponibles = () => {
  if (isLoading) {
    return (
      <View style={styles.creneauxContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.creneauxLoadingText}>
          Vérification des disponibilités et des réservations...
        </Text>
      </View>
    );
  }

  // Vérifier si le jour est fermé
  if (modifiedDate) {
    const jourSemaine = modifiedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const horaireJour = rawHoraires.find(h => h.jour === jourSemaine);
    
    if (horaireJour?.is_ferme) {
      return (
        <View style={styles.creneauxContainer}>
          <Text style={styles.creneauxTitle}>Indisponible</Text>
          <Text style={styles.aucunCreneauText}>
            Le salon est fermé le {jourSemaine}s
          </Text>
        </View>
      );
    }
  }

  if (!intervenantDisponibilites.length) {
    return (
      <View style={styles.creneauxContainer}>
        <Text style={styles.creneauxTitle}>
          Créneaux disponibles ({selectedPrestationDetails?.temps} min)
        </Text>
        <Text style={styles.aucunCreneauText}>
          {idEmploye 
            ? 'Aucun créneau disponible pour cet intervenant'
            : 'Aucun créneau disponible'
          }
        </Text>
        {modifiedDate && (
          <Text style={styles.aucunCreneauSubText}>
            {modifiedDate.toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        )}
      </View>
    );
  }

  // Organiser les créneaux en colonnes de 3 (de haut en bas)
  const creneauxParColonne = 3;
  const nombreDeColonnes = Math.ceil(intervenantDisponibilites.length / creneauxParColonne);
  
  // Créer un tableau de colonnes
  const colonnes = [];
  for (let col = 0; col < nombreDeColonnes; col++) {
    const colonne = [];
    for (let i = col; i < intervenantDisponibilites.length; i += nombreDeColonnes) {
      if (intervenantDisponibilites[i]) {
        colonne.push(intervenantDisponibilites[i]);
      }
    }
    colonnes.push(colonne);
  }

  return (
    <View style={styles.creneauxContainer}>
      <Text style={styles.creneauxTitle}>
        Créneaux disponibles ({selectedPrestationDetails?.temps} min)
      </Text>
      
      {/* Indication des réservations existantes */}
      <View style={styles.reservationInfo}>
        <Text style={styles.reservationInfoText}>
          ⚠️ Les créneaux tiennent compte des réservations existantes
        </Text>
        <Text style={styles.reservationInfoSubText}>
          Un créneau ne sera pas proposé si l'intervenant est déjà réservé à ce moment
        </Text>
      </View>

      
      {/* Indication du mode */}
      <View style={styles.modeIndication}>
        <Text style={styles.modeIndicationText}>
          {idEmploye 
            ? `🔍 Créneaux de ${getIntervenantDisplayName()}`
            : '🌐 Tous les créneaux disponibles'
          }
        </Text>
      </View>
      
      {/* Informations sur les horaires */}
      {modifiedDate && (
        <View style={styles.horaireInfo}>
          <Text style={styles.horaireInfoText}>
            {modifiedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
      )}
      
      {/* Liste des créneaux en colonnes de 3 */}
      <ScrollView style={styles.creneauxList}>
        <View style={styles.creneauxColumnsContainer}>
          {colonnes.map((colonne, colIndex) => (
            <View key={colIndex} style={styles.creneauColumn}>
              {colonne.map((item, index) => (
                <TouchableOpacity
                  key={`${colIndex}-${index}`}
                  style={[
                    styles.creneauButton,
                    heureDebut === item.heure && styles.creneauButtonSelected
                  ]}
                  onPress={() => handleSelectCreneau(item.heure)}
                >
                  <Text style={styles.creneauText}>{item.heure}</Text>
                  <Text style={styles.creneauHeureFin}>à {item.heure_fin}</Text>
                  {/* Indication de l'intervenant si mode global */}
                  {!idEmploye && item.intervenant_nom && (
                    <Text style={styles.creneauIntervenant}>
                      {item.intervenant_prenom} {item.intervenant_nom}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Créneau sélectionné */}
      {heureDebut && (
        <View style={styles.creneauSelectionne}>
          <Text style={styles.creneauSelectionneText}>
            Sélectionné: {heureDebut} - {heureFin}
            {!idEmploye && intervenantDisponibilites.find(item => item.heure === heureDebut)?.intervenant_nom && (
              <Text style={styles.creneauSelectionneIntervenant}>
                {' '}avec {intervenantDisponibilites.find(item => item.heure === heureDebut)?.intervenant_prenom}
              </Text>
            )}
          </Text>
        </View>
      )}
    </View>
  );
};



  const handleResetSession = async () => {
    await AsyncStorage.removeItem('userSession');
    setUserSession(null);
    console.log('Session supprimée');
  };

const handleReservation = (date, heure) => {
  setSelectedDate(date);
  setModifiedDate(date);
  setSelectedHeure(heure || '');
  setHeureDebut(heure || '');
  setIsReservationModalVisible(true);
  
  // Réinitialiser les sélections dans le modal
  setSelectedPrestation('');
  setSelectedCategory('');
  setIdEmploye('');
  setIntervenantDisponibilites([]);
  setAddedPrestations([]);
};

const handlePrevMonth = () => {
  const newMonth = new Date(selectedMonth);
  newMonth.setMonth(selectedMonth.getMonth() - 1);
  setSelectedMonth(newMonth);
  setMonthYear({ year: newMonth.getFullYear(), month: newMonth.getMonth() });
  
  // Recharger immédiatement
  generateCalendarWithAvailability(newMonth);
};


const handleNextMonth = () => {
  const newMonth = new Date(selectedMonth);
  newMonth.setMonth(selectedMonth.getMonth() + 1);
  setSelectedMonth(newMonth);
  setMonthYear({ year: newMonth.getFullYear(), month: newMonth.getMonth() });
  
  // Recharger immédiatement
  generateCalendarWithAvailability(newMonth);
};

const renderMonthView = () => {
  const { year, month } = monthYear;
  const dateForTitle = new Date(year, month, 1);
  const monthYearTitle = dateForTitle.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Définir les jours de la semaine
  const joursSemaine = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Calcul des jours vides du début
  let startDay = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
  let startingEmptyDays = startDay === 0 ? 6 : startDay - 1;

  let calendarDays = [];
  
    if (isCalendarLoading) {
    return (
      <View style={styles.monthViewContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  // Ajouter les jours vides du début
  for (let i = 0; i < startingEmptyDays; i++) {
    calendarDays.push(null);
  }
  
  // Ajouter les jours du mois
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    date.setHours(12, 0, 0, 0); // Normaliser l'heure
    calendarDays.push(date);
  }

  // Création des semaines avec exactement 7 jours par ligne
  const weeks = [];
  
  for (let i = 0; i < calendarDays.length; i += 7) {
    const week = calendarDays.slice(i, i + 7);
    
    // Compléter la dernière semaine avec des jours vides si nécessaire
    while (week.length < 7) {
      week.push(null);
    }
    
    weeks.push(week);
  }

  // Fonction pour obtenir les données du jour
  const getJourData = (date) => {
    if (!date) return null;

    const dateStr = date.toISOString().split('T')[0];
    const jourDispo = monthDisponibilites[dateStr];
    
    let status = 'indisponible';
    let isDisponible = false;
    let isFerme = false;
    
    if (jourDispo) {
      status = jourDispo.status;
      isDisponible = status === 'disponible';
      isFerme = status === 'ferme';
    } else {
      // Si pas encore calculé dans monthDisponibilites, vérifier basiquement
      const jourSemaine = getJourSemaineComplet(date);
      const horaireJour = rawHoraires.find(h => h.jour === jourSemaine);
      const isFermeSalon = joursFermes.includes(jourSemaine) || !horaireJour || horaireJour.is_ferme;
      
      if (isFermeSalon) {
        status = 'ferme';
        isFerme = true;
      } else {
        status = 'indisponible';
      }
    }
    
    return {
      date,
      status,
      isDisponible,
      isFerme,
      nomJour: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      numJour: date.getDate()
    };
  };

  return (
    <View style={styles.monthViewContainer}>
      {/* Navigation du mois */}
      <View style={styles.monthNavContainer}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Text style={styles.navArrow}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthYearTitle.charAt(0).toUpperCase() + monthYearTitle.slice(1)}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Text style={styles.navArrow}>➡️</Text>
        </TouchableOpacity>
      </View>

      {/* Calendrier */}
      <View style={styles.calendarContainer}>
        {/* En-têtes des jours de la semaine */}
        <View style={styles.calendarHeader}>
          {joursSemaine.map((jour, index) => (
            <View key={index} style={styles.calendarHeaderCell}>
              <Text style={styles.calendarHeaderText}>{jour}</Text>
            </View>
          ))}
        </View>

        {/* Grille du calendrier */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((date, dayIndex) => {
                const jour = getJourData(date);
                
                if (!jour) {
                  return (
                    <View 
                      key={`${weekIndex}-${dayIndex}`} 
                      style={styles.calendarCellEmpty} 
                    />
                  );
                }

                return (
<TouchableOpacity
  key={`${weekIndex}-${dayIndex}`}
  style={styles.calendarCellContainer}
  onPress={() => handleDayPressFromMonth(jour)}
  disabled={!jour.isDisponible} // ← Désactiver si pas disponible
>

                    <View
                      style={[
                        styles.calendarCell,
                        jour.status === 'ferme' && styles.calendarCellFerme,
                        jour.status === 'indisponible' && styles.calendarCellIndisponible,
                        jour.status === 'disponible' && styles.calendarCellDisponible,
                        isSameDay(jour.date, new Date()) && styles.calendarToday,
                        selectedDay && isSameDay(jour.date, selectedDay.date) && styles.calendarDaySelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDateText,
                          jour.status === 'ferme' && styles.calendarCellFermeText,
                          jour.status === 'indisponible' && styles.calendarCellIndisponibleText,
                          jour.status === 'disponible' && styles.calendarCellDisponibleText,
                          isSameDay(jour.date, new Date()) && styles.calendarTodayText
                        ]}
                      >
                        {jour.numJour}
                      </Text>
                      
                      {/* Indicateurs visuels */}
                      {jour.status === 'ferme' && (
                        <Text style={styles.indicatorIcon}>🚫</Text>
                      )}
                      {jour.status === 'indisponible' && (
                        <Text style={styles.indicatorIcon}>⏸️</Text>
                      )}
                      {jour.status === 'disponible' && (
                        <Text style={styles.indicatorIcon}>✅</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Légende */}
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendDisponible]} />
          <Text style={styles.legendText}>✅ Salon ouvert avec intervenant(s)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendIndisponible]} />
          <Text style={styles.legendText}>⏸️ Salon ouvert, aucun intervenant</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendFerme]} />
          <Text style={styles.legendText}>🚫 Salon fermé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendToday]} />
          <Text style={styles.legendText}>📍 Aujourd'hui</Text>
        </View>
      </View>
    </View>
  );
};

// Dans la fonction renderWeekView(), modifiez la partie qui affiche les jours de la semaine :

  const renderWeekView = () => {
    // Vérification de sécurité
    if (!joursAvecHoraires || !Array.isArray(joursAvecHoraires)) {
      return (
        <View style={styles.weekViewContainers}>
          <Text style={styles.errorText}>Erreur de chargement des données</Text>
        </View>
      );
    }

    return (    
      <View style={styles.weekViewContainers}>
        {/* Header de la semaine - FIXE */}
        <View style={styles.weekViewHeader}>
          <View style={styles.weekNavContainer}>
            <TouchableOpacity onPress={() => setWeekOffset(prev => prev - 1)}>
              <Text style={styles.navArrow}>◀</Text>
            </TouchableOpacity>
            
            <View style={styles.monthYearContainer}>
              <Text style={styles.monthYearText}>
                {joursDeLaSemaine[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            
            <TouchableOpacity onPress={() => setWeekOffset(prev => prev + 1)}>
              <Text style={styles.navArrow}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {joursAvecHoraires.map((jour, index) => {
              const dateKey = jour.date?.toISOString().split('T')[0];
              const statut = joursStatuts[dateKey] || 'indisponible';
              const isSelected = selectedDay?.date && isSameDay(selectedDay.date, jour.date);
              
              // Couleurs selon le statut
              let backgroundColor = COLORS.surface;
              let borderColor = COLORS.border;
              let textColor = COLORS.text;
              let indicator = null;
              
              switch (statut) {
                case 'disponible':
                  backgroundColor = '#f0f9ff';
                  borderColor = '#bae6fd';
                  textColor = COLORS.primary;
                  indicator = '✅';
                  break;
                case 'indisponible':
                  backgroundColor = '#fffbeb';
                  borderColor = '#fed7aa';
                  textColor = '#f59e0b';
                  indicator = '⏸️';
                  break;
                case 'ferme':
                  backgroundColor = '#fef2f2';
                  borderColor = '#fecaca';
                  textColor = '#dc2626';
                  indicator = '🚫';
                  break;
              }
              
              // Si sélectionné, priorité à la sélection
              if (isSelected) {
                backgroundColor = COLORS.primary;
                borderColor = COLORS.primary;
                textColor = COLORS.surface;
                indicator = '📍';
              }
              
              return (
                <TouchableOpacity 
                  key={index}
                  onPress={() => {
                    if (statut === 'disponible' || isSelected) {
                      handleDayPress(jour);
                    }
                  }}
                  style={[
                    styles.dayHeaderContainer,
                    {
                      backgroundColor,
                      borderColor,
                      opacity: (statut === 'disponible' || isSelected) ? 1 : 0.7
                    },
                    isSelected && styles.selectedDayHeaderContainer
                  ]}
                  disabled={statut !== 'disponible' && !isSelected}
                >
                  <View style={styles.dayHeaderContent}>
                    <Text style={[
                      styles.dayNameLarge,
                      { color: textColor }
                    ]}>
                      {jour.nomJour.charAt(0)}
                    </Text>
                    <Text style={[
                      styles.dayNumberLarge,
                      { color: textColor }
                    ]}>
                      {jour.numJour}
                    </Text>
                    
                    {/* Indicateur de statut */}
                    {indicator && (
                      <Text style={[
                        styles.dayStatutIndicator,
                        { color: textColor }
                      ]}>
                        {indicator}
                      </Text>
                    )}
                  </View>
                  
                  {isSelected && (
                    <View style={styles.selectedDayIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Légende sous la semaine */}
        <View style={styles.weekLegend}>
          <View style={styles.weekLegendItem}>
            <View style={[styles.weekLegendColor, styles.legendDisponible]} />
            <Text style={styles.weekLegendText}>✅ Salon ouvert avec intervenant(s)</Text>
          </View>
          <View style={styles.weekLegendItem}>
            <View style={[styles.weekLegendColor, styles.legendIndisponible]} />
            <Text style={styles.weekLegendText}>⏸️ Salon ouvert, aucun intervenant</Text>
          </View>
          <View style={styles.weekLegendItem}>
            <View style={[styles.weekLegendColor, styles.legendFerme]} />
            <Text style={styles.weekLegendText}>🚫 Salon fermé</Text>
          </View>
          <View style={styles.weekLegendItem}>
            <View style={[styles.weekLegendColor, styles.legendToday]} />
            <Text style={styles.weekLegendText}>📍 Jour sélectionné</Text>
          </View>
        </View>

        {/* Contenu scrollable */}
        <ScrollView 
          style={styles.weekScrollContent}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.weekScrollContainer}
        >
          {/* Bouton nouvelle réservation */}
          {showAddReservationButton && !isReservationModalVisible && (
            <TouchableOpacity 
              style={styles.addReservationButton}
              onPress={handleNewReservation}
            >
              <Text style={styles.addReservationButtonText}>+ Nouvelle réservation</Text>
            </TouchableOpacity>
          )}

          {/* AFFICHAGE DES RÉSERVATIONS DU JOUR SÉLECTIONNÉ */}
          {selectedDay && selectedDay.date && selectedDay.isOpen && !showReservationDetail && (
            <View style={styles.daySlotsContainer}>
              <Text style={styles.selectedDayTitle}>
                {selectedDay.date.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </Text>
              
              {/* Indication du statut du jour sélectionné */}
              {(() => {
                const dateKey = selectedDay.date.toISOString().split('T')[0];
                const statut = joursStatuts[dateKey];
                
                let statutMessage = '';
                let statutColor = COLORS.text;
                
                switch (statut) {
                  case 'disponible':
                    statutMessage = '✅ Salon ouvert avec intervenant(s) disponible(s)';
                    statutColor = COLORS.success;
                    break;
                  case 'indisponible':
                    statutMessage = '⏸️ Salon ouvert mais aucun intervenant disponible';
                    statutColor = '#f59e0b';
                    break;
                  case 'ferme':
                    statutMessage = '🚫 Salon fermé ce jour';
                    statutColor = COLORS.error;
                    break;
                }
                
                if (statutMessage) {
                  return (
                    <View style={[
                      styles.dayStatutBanner,
                      { backgroundColor: statut === 'disponible' ? '#f0f9ff' : 
                                       statut === 'indisponible' ? '#fffbeb' : 
                                       '#fef2f2',
                        borderColor: statut === 'disponible' ? '#bae6fd' : 
                                    statut === 'indisponible' ? '#fed7aa' : 
                                    '#fecaca'
                      }
                    ]}>
                      <Text style={[styles.dayStatutMessage, { color: statutColor }]}>
                        {statutMessage}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
              
              {/* Section Créneaux réservés */}
              <View style={styles.reservationsSection}>
                <Text style={styles.sectionTitle}>Créneaux réservés</Text>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Chargement des réservations...</Text>
                  </View>
                ) : reservationsDuJour.length === 0 ? (
                  <View style={styles.noReservationsContainer}>
                    <Text style={styles.noReservationsText}>Aucun créneau réservé</Text>
                    <Text style={styles.noReservationsSubText}>
                      Aucune réservation pour cette date
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reservationsList}>
                    {reservationsDuJour.map((reservation, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.reservationItem}
                        onPress={() => handleReservationClick(reservation)}
                      >
                        <View style={styles.reservationTime}>
                          <Text style={styles.reservationHeure}>
                            {reservation.heure_debut}
                          </Text>
                          <Text style={styles.reservationHeureFin}>
                            à {reservation.heure_fin}
                          </Text>
                        </View>
                        <View style={styles.reservationDetails}>
                          <Text style={styles.reservationClient}>
                            {reservation.client_prenom} {reservation.client_nom}
                          </Text>
                          <Text style={styles.reservationPrestation}>
                            {reservation.prestation_titre}
                          </Text>
                          <Text style={styles.reservationIntervenant}>
                            👤 {reservation.intervenant_prenom} {reservation.intervenant_nom}
                          </Text>
                          {reservation.commentaire && (
                            <Text style={styles.reservationCommentaire}>
                              💬 {reservation.commentaire}
                            </Text>
                          )}
                        </View>
                        <View style={[
                          styles.reservationStatus,
                          reservation.statut === 'reservé' && styles.statusReserve,
                          reservation.statut === 'confirmé' && styles.statusConfirme,
                          reservation.statut === 'annulé' && styles.statusAnnule
                        ]}>
                          <Text style={styles.reservationStatusText}>
                            {reservation.statut}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Espace en bas pour permettre un scroll confortable */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {showReservationDetail && renderReservationDetail()}
      </View>
    );
  };


  const handleAddPrestation = () => {
    const prestationToAdd = prestations.find(
      p => p.id_prestation.toString() === selectedPrestation
    );
    
    if (prestationToAdd) {
      setAddedPrestations([...addedPrestations, prestationToAdd]);
      setSelectedPrestation('');
      setShowAddPrestation(false);
    }
  };

  const removeAddedPrestation = (index) => {
    setAddedPrestations(addedPrestations.filter((_, i) => i !== index));
  };

  const handleConfirmReservation = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!clientNom || !clientPrenom || (!idClient && !clientTelephone)) {
        alert('Nom, prénom et téléphone sont obligatoires pour le client');
        return;
      }

      if (!selectedPrestation && addedPrestations.length === 0) {
        alert('Veuillez sélectionner au moins une prestation');
        return;
      }
          // NOUVELLE VALIDATION : Vérifier qu'un intervenant est sélectionné
    if (!idEmploye) {
      alert('Veuillez sélectionner un intervenant');
      return;
    }

      const prestationReference = prestations.find(
        p => p.id_prestation.toString() === selectedPrestation
      ) || addedPrestations[0];
      
      const [hours, minutes] = heureDebut.includes('h') 
        ? heureDebut.split('h').map(Number)
        : heureDebut.split(':').map(Number);
      
      const heureDebutFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      const startTime = new Date(modifiedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + prestationReference.temps);
      const heureFinFormatted = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`;

      const reservationData = {
        id_prestation: selectedPrestation || addedPrestations[0].id_prestation,
        id_employe: idEmploye === "prestataire" ? null : idEmploye,
        id_prestataire: idEmploye === "prestataire" ? idPrestataire : null,
        date_reservation: modifiedDate.toISOString().split('T')[0],
        heure_debut: heureDebutFormatted,
        heure_fin: heureFinFormatted,
        mode_paiement: modePaiement || 'en ligne',
        statut: 'reservé',
        commentaire: commentaire || null,
        client_nom: clientNom,
        client_prenom: clientPrenom,
        client_mail: clientMail || null,
        client_numero: clientTelephone,
        client_adresse: clientAdresse || null,
        ...(idClient && { id_client: idClient })
      };

      const response = await fetch('http://192.168.1.68:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.error || 'Cette réservation existe déjà');
        }
        throw new Error(data.error || data.details || 'Erreur lors de la création de la réservation');
      }

      if (addedPrestations.length > 0) {
        for (const prestation of addedPrestations) {
          const resaSupplementaire = {
            ...reservationData,
            id_prestation: prestation.id_prestation,
            client_nom: undefined,
            client_prenom: undefined,
            client_mail: undefined,
            client_numero: undefined,
            client_adresse: undefined,
            id_client: data.clientId
          };
          
          await fetch('http://192.168.1.68:3000/api/reservations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resaSupplementaire),
          });
        }
      }

      let successMessage = 'Réservation créée avec succès!';
      if (data.isNewClient) {
        successMessage += '\nNouveau client enregistré.';
      }
      if (addedPrestations.length > 0) {
        successMessage += `\n${addedPrestations.length} prestation(s) supplémentaire(s) ajoutée(s).`;
      }

      alert(successMessage);
      setIsReservationModalVisible(false);
      resetForm();

    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Erreur serveur')) {
        errorMessage = 'Une erreur technique est survenue. Veuillez réessayer.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

const resetForm = () => {
  setSelectedPrestation('');
  setSelectedCategory('');
  setHeureDebut('');
  setModePaiement('en ligne');
  setCommentaire('');
  setClientNom('');
  setClientPrenom('');
  setClientAdresse('');
  setClientMail('');
  setClientTelephone('');
  setAddedPrestations([]);
  setShowAddPrestation(false);
  setShowPrestataireSection(false);
  setIdClient('');
  setIdEmploye(''); 
};


  const parseCategories = (categoryData) => {
    if (!categoryData) return [];
    
    try {
      if (Array.isArray(categoryData)) return categoryData;
      
      if (typeof categoryData === 'string') {
        const cleaned = categoryData
          .replace(/'/g, '"')
          .replace(/\\/g, '');
        
        return JSON.parse(cleaned);
      }
      
      return [categoryData];
    } catch (e) {
      console.error('Erreur parsing categories:', e);
      return [categoryData];
    }
  };

const getFilteredIntervenants = () => {
  if (selectionMode === 'intervenant-first') {
    // Mode intervenant-first : Tous les intervenants de la catégorie
    const intervenants = [];
    const categorieRecherchee = selectedCategory ? selectedCategory.toLowerCase().trim() : null;
    
    // Si une catégorie est sélectionnée
    if (categorieRecherchee) {
      // Prestataire
      if (prestataire?.id) {
        const categoriesPrestataire = parseCategories(prestataire.categorie);
        if (categoriesPrestataire.some(cat => 
          cat?.toLowerCase().trim() === categorieRecherchee
        )) {
          intervenants.push({
            id: 'prestataire',
            nom: prestataire.nom,
            prenom: prestataire.prenom,
            categorie: prestataire.categorie,
            isPrestataire: true,
            type: 'prestataire'
          });
        }
      }

      // Employés
      const employesFiltres = employes.filter(emp => {
        const categoriesEmploye = parseCategories(emp.categorie);
        return categoriesEmploye.some(cat => 
          cat?.toLowerCase().trim() === categorieRecherchee
        );
      });

      intervenants.push(...employesFiltres.map(emp => ({
        ...emp,
        type: 'employe',
        id: emp.id_employe || emp.id
      })));
    } else {
      // Si pas de catégorie sélectionnée, montrer tous les intervenants
      if (prestataire?.id) {
        intervenants.push({
          id: 'prestataire',
          nom: prestataire.nom,
          prenom: prestataire.prenom,
          categorie: prestataire.categorie,
          isPrestataire: true,
          type: 'prestataire'
        });
      }
      
      intervenants.push(...employes.map(emp => ({
        ...emp,
        type: 'employe',
        id: emp.id_employe || emp.id
      })));
    }
    
    return intervenants;
  }

  // Mode date-first : on utilise filteredIntervenants (déjà filtrés par date)
  return filteredIntervenants;
};

  const tryParseJson = (str) => {
    try {
      return JSON.parse(str.replace(/'/g, '"'));
    } catch (e) {
      return null;
    }
  };

const renderContent = () => {
  if (viewMode === 'semaine') {
    return renderWeekView();
  }
  
  if (viewMode === 'mois') {
    return (
      <View style={styles.monthViewWrapper}>
        {renderMonthView()}
      </View>
    );
  }
  
  return null;
};

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

return (
  <SafeAreaView style={styles.container}>
    {/* Navbar avec icônes notifications et dashboard */}
    <View style={styles.navbar}>
      <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.logo} />
      <View style={styles.navbarIcons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('ClientsManagement')}
        >
          <Text style={styles.icon}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.icon}>📊</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.modeSwitcher}>
      {['semaine', 'mois'].map(mode => (
        <TouchableOpacity 
          key={mode} 
          onPress={() => setViewMode(mode)}
          style={[
            { 
              backgroundColor: viewMode === mode ? COLORS.primary : 'transparent' 
            },
            { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }
          ]}
        >
          <Text
            style={[
              styles.switcherText,
              { 
                color: viewMode === mode ? COLORS.surface : COLORS.textLight,
                textDecorationLine: viewMode === mode ? 'underline' : 'none'
              }
            ]}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

<View style={styles.mainContent}>
  {error ? (
    <Text style={styles.errorText}>{error}</Text>
  ) : viewMode === 'semaine' ? (
    renderWeekView()
  ) : (
    <ScrollView 
      style={styles.monthScrollView}
      contentContainerStyle={styles.monthScrollContent}
      showsVerticalScrollIndicator={true}
    >
      {renderMonthView()}
    </ScrollView>
  )}
</View>

{isReservationModalVisible && (
  <View style={styles.modalOverlay}>

    <View style={[styles.formContainer, styles.responsiveForm]}>
      
      {/* Conteneur principal avec défilement */}
      <ScrollView 
        contentContainerStyle={styles.responsiveScrollContent}
        style={styles.responsiveScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.modalTitle}>Nouvelle Réservation</Text>
                
        {/* Section Date - Toujours disponible */}
{/* Section Date - CORRIGÉE */}
<View style={styles.formSection}>
  <Text style={styles.formSectionTitle}>Date et Horaire</Text>
  
  <Text style={styles.formLabel}>Date</Text>
<TouchableOpacity 
  style={styles.formSelection}
  onPress={() => {
    setShowDatePicker(true);
    setCalendarModalMode('form');
    
    // Utiliser la date modifiée si elle existe, sinon la date du jour
    const dateToUse = modifiedDate || new Date();
    setCalendarModalMonth(new Date(dateToUse));
    
    // Générer le calendrier avec la bonne date
    if (idPrestataire) {
      generateCalendarWithAvailability(new Date(dateToUse));
    }
  }}
>
  
      <View style={styles.formSelectionContent}>
      <Text style={modifiedDate ? styles.formSelectionText : styles.formSelectionPlaceholder}>
        {modifiedDate?.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) || 'Choisir une date'}
      </Text>
      {modifiedDate && (
        <Text style={styles.datePreselectedBadge}>📅 Présélectionnée</Text>
      )}
    </View>
    <Text style={styles.selectionButtonIcon}>▼</Text>
  </TouchableOpacity>

     {/* Section Créneaux - SÉPARÉE du ScrollView principal */}
        {selectedPrestation && idEmploye && modifiedDate && (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>
              Créneaux disponibles ({selectedPrestationDetails?.temps} min) :
            </Text>
            {renderCreneauxDisponibles()}
          </View>
        )}

{/* Section Prestation - Toujours disponible */}
{/* Section Prestation avec indicateur de chargement */}
<View style={styles.formSection}>
  <Text style={styles.formSectionTitle}>Prestation</Text>
  
  <Text style={styles.formLabel}>Catégorie</Text>
  <TouchableOpacity 
    style={styles.formSelection}
    onPress={() => {
      if (!modifiedDate) {
        alert('Veuillez d\'abord sélectionner une date');
        return;
      }
      
      if (isLoading) {
        alert('Chargement des catégories en cours...');
        return;
      }
      
      setShowCategoryModal(true);
    }}
  >
    <View style={styles.formSelectionContent}>
      {isLoading ? (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <>
          <Text style={selectedCategory ? styles.formSelectionText : styles.formSelectionPlaceholder}>
            {selectedCategory || "Choisir une catégorie"}
          </Text>
          {modifiedDate && (
            <Text style={styles.dateFilterBadge}>
              📅 {modifiedDate.getDate()}/{modifiedDate.getMonth()+1}
            </Text>
          )}
        </>
      )}
    </View>
    <Text style={styles.selectionButtonIcon}>▼</Text>
  </TouchableOpacity>
  
  {isLoading ? (
    <View style={styles.loadingMessage}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.loadingMessageText}>Recherche des catégories disponibles...</Text>
    </View>
  ) : !modifiedDate ? (
    <Text style={styles.infoMessageText}>
      ⚠️ Sélectionnez d'abord une date pour voir les catégories disponibles
    </Text>
  ) : categories.length === 0 ? (
    <View style={styles.noCategoriesInfo}>
      <Text style={styles.warningMessageText}>
        ⚠️ Aucune catégorie disponible pour cette date
      </Text>
      <TouchableOpacity 
        style={styles.changeDateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.changeDateButtonText}>Changer de date</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Text style={styles.categoriesInfoText}>
      ✅ {categories.length} catégorie(s) disponible(s) pour cette date
    </Text>
  )}


  {selectedCategory && (
    <>
      <Text style={styles.formLabel}>Prestation</Text>
      <TouchableOpacity 
        style={styles.formSelection}
        onPress={() => {
          console.log('🎯 BOUTON PRESTATION CLIQUÉ !');
          setShowPrestationModal(true);
        }}
      >
        <Text style={selectedPrestation ? styles.formSelectionText : styles.formSelectionPlaceholder}>
          {selectedPrestation 
            ? `${prestations.find(p => p.id_prestation.toString() === selectedPrestation)?.titre}`
            : "Choisir une prestation"}
        </Text>
        <Text style={styles.selectionButtonIcon}>▼</Text>
      </TouchableOpacity>
    </>
  )}
</View>

{/* Modal de modification de réservation */}
{isEditModalVisible && selectedReservation && (
  <View style={styles.modalOverlay}>
    <View style={[styles.formContainer, styles.responsiveForm]}>
      <ScrollView contentContainerStyle={styles.responsiveScrollContent}>
        <Text style={styles.modalTitle}>Modifier la réservation</Text>
        
        {/* Informations réservation */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Informations réservation</Text>
          
          <View style={styles.formRow}>
            <View style={{flex: 1}}>
              <Text style={styles.formLabel}>Heure début</Text>
              <TextInput
                style={styles.formInput}
                value={editFormData.heure_debut}
                onChangeText={(text) => setEditFormData({...editFormData, heure_debut: text})}
                placeholder="HH:MM"
              />
            </View>
            
            <View style={{flex: 1}}>
              <Text style={styles.formLabel}>Heure fin</Text>
              <TextInput
                style={styles.formInput}
                value={editFormData.heure_fin}
                onChangeText={(text) => setEditFormData({...editFormData, heure_fin: text})}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <Text style={styles.formLabel}>Prestation</Text>
          <TextInput
            style={styles.formInput}
            value={editFormData.prestation_titre}
            onChangeText={(text) => setEditFormData({...editFormData, prestation_titre: text})}
            placeholder="Prestation"
          />

          <Text style={styles.formLabel}>Statut</Text>
          <View style={styles.statusButtons}>
            {['reservé', 'confirmé', 'annulé'].map((statut) => (
              <TouchableOpacity
                key={statut}
                style={[
                  styles.statusButton,
                  editFormData.statut === statut && styles.statusButtonSelected
                ]}
                onPress={() => setEditFormData({...editFormData, statut})}
              >
                <Text style={[
                  styles.statusButtonText,
                  editFormData.statut === statut && styles.statusButtonTextSelected
                ]}>
                  {statut}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Informations client</Text>
          
          <View style={styles.formRow}>
            <View style={{flex: 1}}>
              <Text style={styles.formLabel}>Prénom</Text>
              <TextInput
                style={styles.formInput}
                value={editFormData.client_prenom}
                onChangeText={(text) => setEditFormData({...editFormData, client_prenom: text})}
                placeholder="Prénom"
              />
            </View>
            
            <View style={{flex: 1}}>
              <Text style={styles.formLabel}>Nom</Text>
              <TextInput
                style={styles.formInput}
                value={editFormData.client_nom}
                onChangeText={(text) => setEditFormData({...editFormData, client_nom: text})}
                placeholder="Nom"
              />
            </View>
          </View>

          <Text style={styles.formLabel}>Téléphone</Text>
          <TextInput
            style={styles.formInput}
            value={editFormData.client_telephone}
            onChangeText={(text) => setEditFormData({...editFormData, client_telephone: text})}
            placeholder="Téléphone"
            keyboardType="phone-pad"
          />

          <Text style={styles.formLabel}>Email</Text>
          <TextInput
            style={styles.formInput}
            value={editFormData.client_mail}
            onChangeText={(text) => setEditFormData({...editFormData, client_mail: text})}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>

        {/* Commentaire */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Commentaire</Text>
          <TextInput
            style={[styles.formInput, {height: 80, textAlignVertical: 'top'}]}
            value={editFormData.commentaire}
            onChangeText={(text) => setEditFormData({...editFormData, commentaire: text})}
            placeholder="Commentaire"
            multiline
          />
        </View>

        {/* Actions */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.formButton, styles.formButtonDanger]}
            onPress={handleCancelReservation}
            disabled={isSubmitting}
          >
            <Text style={styles.formButtonText}>
              {isSubmitting ? 'Annulation...' : 'Annuler réservation'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formButton, styles.formButtonSecondary]}
            onPress={() => setIsEditModalVisible(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.formButtonText}>Fermer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formButton, styles.formButtonPrimary]}
            onPress={handleUpdateReservation}
            disabled={isSubmitting}
          >
            <Text style={styles.formButtonText}>
              {isSubmitting ? 'Mise à jour...' : 'Modifier'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
)}

{/* Section Intervenant - TOUJOURS DISPONIBLE */}
<View style={styles.formSection}>
  <Text style={styles.formSectionTitle}>Intervenant</Text>
  
  <TouchableOpacity 
    style={styles.formSelection}
    onPress={() => {
      console.log('👤 OUVERTURE MODAL INTERVENANT');
      
      // Vérifier si une date est sélectionnée
      if (!modifiedDate) {
        Alert.alert(
          "Date requise",
          "Veuillez d'abord sélectionner une date",
          [{ text: "OK", onPress: () => setShowDatePicker(true) }]
        );
        return;
      }
      
      // Toujours ouvrir le modal, même si filteredIntervenants est vide
      // Le modal gérera l'affichage "Aucun intervenant disponible"
      setSelectionMode('date-first'); // Par défaut en mode date-first
      setShowIntervenantModal(true);
    }}
  >
    <View style={styles.formSelectionContent}>
      <Text style={
        idEmploye ? styles.formSelectionText : 
        styles.formSelectionPlaceholder
      }>
        {getIntervenantDisplayName()}
      </Text>
      {modifiedDate && (
        <Text style={styles.dateFilterBadge}>
          📅 {modifiedDate.getDate()}/{modifiedDate.getMonth()+1}
        </Text>
      )}
    </View>
    <Text style={styles.selectionButtonIcon}>▼</Text>
  </TouchableOpacity>

  {/* Message d'information AMÉLIORÉ */}
  {!idEmploye && (
    <View style={styles.infoMessage}>
      <Text style={styles.infoText}>
        {modifiedDate 
          ? `📅 Date: ${modifiedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}`
          : "⏳ Sélectionnez d'abord une date"
        }
      </Text>
      {modifiedDate && filteredIntervenants.length > 0 && (
        <Text style={styles.infoSubText}>
          ✅ {filteredIntervenants.length} intervenant(s) disponible(s) pour cette date
        </Text>
      )}
      {modifiedDate && filteredIntervenants.length === 0 && (
        <Text style={styles.warningSubText}>
          ⚠️ Aucun intervenant disponible pour cette date
        </Text>
      )}
    </View>
  )}
</View>

        {/* Sections Client et Paiement */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Client</Text>
          
          <View style={styles.formRow}>
            <View style={{flex: 1}}>
              <Text style={styles.formLabel}>Nom</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nom"
                value={clientNom}
                onChangeText={setClientNom}
              />
            </View>
            
            <View style={{flex: 1}}>
              <Text style={styles.formLabel}>Prénom</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Prénom"
                value={clientPrenom}
                onChangeText={setClientPrenom}
              />
            </View>
          </View>

          <Text style={styles.formLabel}>Téléphone</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Téléphone"
            keyboardType='phone-pad'
            value={clientTelephone}
            onChangeText={(text) => setClientTelephone(text)}
            onBlur={async () => {
              if (clientTelephone && clientTelephone.length >= 6) {
                await searchClient('numero', clientTelephone);
              }
            }}
          />

          <Text style={styles.formLabel}>Email</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Email"
            keyboardType="email-address"
            value={clientMail}
            onChangeText={(text) => setClientMail(text)}
            onBlur={async () => {
              if (clientMail && clientMail.includes('@')) {
                await searchClient('mail', clientMail);
              }
            }}
          />

          <Text style={styles.formLabel}>Adresse</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Adresse postale"
            value={clientAdresse}
            onChangeText={setClientAdresse}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Finalisation</Text>
          
          <Text style={styles.formLabel}>Mode de paiement</Text>
          <View style={styles.paymentModeContainer}>
            {['en ligne', 'en espece'].map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.paymentModeButton,
                  modePaiement === mode && styles.paymentModeButtonSelected
                ]}
                onPress={() => setModePaiement(mode)}
              >
                <Text
                  style={[
                    styles.paymentModeText,
                    modePaiement === mode && styles.paymentModeTextSelected
                  ]}
                >
                  {mode === 'en ligne' ? 'En ligne' : 'En espèce'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Commentaire (facultatif)</Text>
          <TextInput
            style={[styles.formInput, {height: 80, textAlignVertical: 'top'}]}
            placeholder="Commentaire"
            value={commentaire}
            onChangeText={setCommentaire}
            multiline
          />
        </View>

        {/* Actions */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.formButton, styles.formButtonSecondary]}
            onPress={() => setIsReservationModalVisible(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.formButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formButton, styles.formButtonPrimary]}
            onPress={handleConfirmReservation}
            disabled={isSubmitting}
          >
            <Text style={styles.formButtonText}>
              {isSubmitting ? 'Création...' : 'Confirmer'}
            </Text>
          </TouchableOpacity>
        </View>
            </View>

      </ScrollView>
        </View>


    {/* Modals pour les sélections */}
{/* MODAL INTERVENANT */}
{showIntervenantModal && (
  <View style={styles.modalContainer}>
    <View style={styles.selectionModal}>
      <Text style={styles.selectionModalTitle}>
        {!modifiedDate ? "Sélectionnez d'abord une date" : "Choisissez un intervenant"}
      </Text>
      
      {!modifiedDate ? (
        <View style={styles.noDateInfo}>
          <Text style={styles.infoText}>
            Pour voir les intervenants disponibles, veuillez d'abord sélectionner une date.
          </Text>
          <TouchableOpacity 
            style={styles.selectDateButton}
            onPress={() => {
              setShowDatePicker(true);
              setShowIntervenantModal(false);
            }}
          >
            <Text style={styles.selectDateButtonText}>Choisir une date</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 400 }}>
          {filteredIntervenants.length === 0 ? (
            <View style={styles.noIntervenantsContainer}>
              <Text style={styles.noIntervenantsText}>
                Aucun intervenant disponible pour cette date
              </Text>
              <TouchableOpacity 
                style={styles.selectDateButton}
                onPress={() => {
                  setShowDatePicker(true);
                  setShowIntervenantModal(false);
                }}
              >
                <Text style={styles.selectDateButtonText}>Changer de date</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredIntervenants.map((intervenant, index) => (
              <TouchableOpacity
                key={intervenant.id || index}
                style={[
                  styles.selectionItem,
                  idEmploye === intervenant.id && styles.selectedItem
                ]}
                onPress={() => {
                  console.log('✅ Intervenant sélectionné:', intervenant);
                  setIdEmploye(intervenant.id);
                  setShowIntervenantModal(false);
                }}
              >
                <Text style={styles.selectionItemText}>
                  {intervenant.prenom} {intervenant.nom}
                  {intervenant.type === 'prestataire' && ' (Vous)'}
                </Text>
                {intervenant.categorie && (
                  <Text style={styles.selectionItemDetail}>
                    {intervenant.categorie}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      
      <TouchableOpacity 
        style={styles.closeSelectionButton}
        onPress={() => setShowIntervenantModal(false)}
      >
        <Text style={styles.closeSelectionButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

{/* MODAL DE CATÉGORIE - MANQUANT */}
{showCategoryModal && (
  <View style={styles.modalContainer}>
    <View style={styles.selectionModal}>
      <Text style={styles.selectionModalTitle}>Choisissez une catégorie</Text>
      
      <ScrollView style={{ maxHeight: 400 }}>
        {categories.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textLight }}>
            Aucune catégorie disponible
          </Text>
        ) : (
          categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.selectionItem,
                selectedCategory === cat && styles.selectedItem
              ]}
              onPress={() => {
                console.log('✅ Catégorie sélectionnée:', cat);
                setSelectedCategory(cat);
                setShowCategoryModal(false);
                fetchEmployes(cat);
              }}
            >
              <Text style={styles.selectionItemText}>{cat}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.closeSelectionButton}
        onPress={() => {
          console.log('❌ Fermeture modal catégorie');
          setShowCategoryModal(false);
        }}
      >
        <Text style={styles.closeSelectionButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

{/* MODAL DE PRESTATION */}
{showPrestationModal && (
  <View style={styles.modalContainer}>
    <View style={styles.selectionModal}>
      <Text style={styles.selectionModalTitle}>Choisissez une prestation</Text>
      
      <ScrollView style={{ maxHeight: 400 }}>
        {prestations
          .filter(p => p.categorie === selectedCategory)
          .map((prestation) => (
            <TouchableOpacity
              key={prestation.id_prestation}
              style={[
                styles.selectionItem,
                selectedPrestation === prestation.id_prestation.toString() && styles.selectedItem
              ]}
              onPress={() => {
                console.log('✅ Prestation sélectionnée:', prestation.titre);
                setSelectedPrestation(prestation.id_prestation.toString());
                setSelectedPrestationDetails(prestation);
                setShowPrestationModal(false);
                setShowPrestataireSection(true);
              }}
            >
              <Text style={styles.selectionItemText}>
                {prestation.titre} - {prestation.prix}€
              </Text>
              <Text style={styles.selectionItemDetail}>
                Durée: {prestation.temps} min
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.closeSelectionButton}
        onPress={() => {
          console.log('❌ Fermeture modal prestation');
          setShowPrestationModal(false);
        }}
      >
        <Text style={styles.closeSelectionButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
)}


{showDatePicker && (
  <View style={styles.calendarModal}>
    {/* HEADER */}
    <View style={styles.calendarHeader}>
      <TouchableOpacity 
        onPress={() => changeCalendarMonth(-1)}
        style={styles.calendarNavButton}
      >
        <Text style={styles.calendarNavArrow}>◀</Text>
      </TouchableOpacity>
      
      <Text style={styles.calendarMonthTitle}>
        {calendarModalMonth.toLocaleDateString('fr-FR', { 
          month: 'long', 
          year: 'numeric' 
        }).toUpperCase()}
      </Text>
      
      <TouchableOpacity 
        onPress={() => changeCalendarMonth(1)}
        style={styles.calendarNavButton}
      >
        <Text style={styles.calendarNavArrow}>▶</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.calendarGrid}>
      {/* En-têtes des jours */}
      <View style={styles.calendarDaysHeader}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
          <Text key={index} style={styles.calendarDayHeader}>
            {day}
          </Text>
        ))}
      </View>

      {/* Jours du mois - CORRIGÉ avec vérification */}
      <View style={styles.calendarDaysGrid}>
        {getCalendarForMonth().map((day, index) => {
          if (day.isEmpty) {
            return (
              <View key={`empty-${index}`} style={styles.calendarEmptyDay} />
            );
          }

          const jourSemaine = day.jourSemaine || getJourSemaineComplet(day.date);
          const isFerme = Array.isArray(joursFermes) && joursFermes.includes(jourSemaine);
          const status = isFerme ? 'ferme' : (day.status || 'normal');
          
          const isToday = isSameDay(day.date, new Date());
          const isSelected = modifiedDate && isSameDay(day.date, modifiedDate);

          return (
// Dans le rendu du calendrier modal
// Dans le rendu de chaque jour du calendrier
<TouchableOpacity
  key={`day-${index}`}
  style={[
    styles.calendarDay,
    isToday && styles.calendarToday,
    isSelected && styles.calendarDaySelected,
    isFerme && styles.calendarDayFerme,
    day.status === 'indisponible' && styles.calendarDayIndisponible,
    day.status === 'disponible' && styles.calendarDayDisponible,
    day.status === 'normal' && styles.calendarDayNormal,
  ]}
  onPress={() => {
    if (isDateSelectable(day)) {
      handleDateSelection(day.date);
    }
  }}
  disabled={!isDateSelectable(day)}
>
  <View style={styles.calendarDayContent}>
    <Text style={[
      styles.calendarDayText,
      isFerme && styles.calendarDayTextDisabled,
      day.status === 'indisponible' && styles.calendarDayTextIndisponible,
      day.status === 'disponible' && styles.calendarDayTextDisponible,
      day.status === 'normal' && styles.calendarDayTextNormal,
      isToday && styles.calendarTodayText,
      isSelected && styles.calendarDaySelectedText
    ]}>
      {day.date.getDate()}
    </Text>
    
    {/* Indicateurs visuels silencieux */}
    <View style={styles.calendarIndicators}>
      {isFerme && <Text style={styles.calendarIndicator}>🚫</Text>}
      {!isFerme && day.status === 'disponible' && <Text style={styles.calendarIndicator}>✅</Text>}
      {!isFerme && day.status === 'indisponible' && <Text style={styles.calendarIndicator}>⏸️</Text>}
    </View>
  </View>
</TouchableOpacity>
          );
        })}
      </View>
    </View>

    {/* Légende - CORRIGÉE */}
{/* Légende SILENCIEUSE */}
<View style={styles.calendarLegend}>
  <View style={styles.legendItem}>
    <View style={[styles.legendColor, styles.legendDisponible]} />
    <Text style={styles.legendText}>✅ Disponible (intervenant + salon)</Text>
  </View>
  <View style={styles.legendItem}>
    <View style={[styles.legendColor, styles.legendIndisponible]} />
    <Text style={styles.legendText}>⏸️ Salon ouvert, mais aucun intervenant</Text>
  </View>
  <View style={styles.legendItem}>
    <View style={[styles.legendColor, styles.legendFerme]} />
    <Text style={styles.legendText}>🚫 Salon fermé</Text>
  </View>
</View>

    <TouchableOpacity 
      style={styles.closeCalendarButton}
      onPress={() => setShowDatePicker(false)}
    >
      <Text style={styles.closeCalendarButtonText}>Fermer</Text>
    </TouchableOpacity>
  </View>
)}
  </View>

)}

      <Navbar
        userSession={userSession}
        setUserSession={setUserSession}
        navigation={navigation}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },

  navbar: {
    height: 70,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  logo: { 
    width: 120, 
    height: 40, 
    resizeMode: 'contain' 
  },
  navbarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontSize: 18,
    color: COLORS.surface,
  },

  modeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 40,
  },
  switcherText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },

  mainContent: {
    flex: 1,
  },
  
  monthViewWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  monthViewContainer: {
    flex: 1,
    padding: 12,
  },

  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    minHeight: 400, // Hauteur minimale pour s'assurer que tout est visible
  },

calendarHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  width: '100%',
  paddingHorizontal: 10,
},


calendarNavButton: {
  padding: 12,
  minWidth: 44,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.background,
  borderRadius: 8,
},


  calendarHeaderCell: {
    width: '14.28%', // 100% / 7 jours
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },

  calendarHeaderText: {
    fontWeight: '600',
    fontSize: 12,
    color: COLORS.primary,
  },

  calendarGrid: {
    flex: 1,
  },
  
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    minHeight: 44,
  },

  calendarCellContainer: {
    width: '14.28%', // 100% / 7 jours
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    padding: 2,
  },

  calendarCell: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },

  calendarCellOpen: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  calendarCellClosed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },

  calendarToday: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
    transform: [{ scale: 1.05 }],
  },

  calendarCellEmpty: {
    width: '14.28%',
    height: 44,
    backgroundColor: 'transparent',
    padding: 2,
  },

  calendarDateText: {
    fontSize: 13,
    fontWeight: '500',
  },

  calendarCellOpenText: {
    color: COLORS.text,
  },

  calendarCellClosedText: {
    color: '#dc2626',
    textDecorationLine: 'line-through',
  },

  closedText: {
    fontSize: 7,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 1,
  },

  // Styles pour la vue SEMAINE
  weekViewContainers: {
    flex: 1,
  },
  weekViewContainer: {
    marginTop: 16,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  weekNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  dayHeader: {
    alignItems: 'center',
    width: '14%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dayName: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  closedDayHeader: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  closedDayText: {
    color: '#dc2626',
  },
  closedDayLabel: {
    fontSize: 9,
    color: '#dc2626',
    marginTop: 2,
    fontWeight: '600',
  },
  selectedDayHeader: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  weekEventsContainer: {
    flex: 1,
    padding: 1,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  eventTimeContainer: {
    width: 70,
    alignItems: 'flex-start',
  },
  eventTime: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  eventDuration: {
    fontSize: 14,
    color: COLORS.textLight,
  },

  daySlotsContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxHeight: '70%',
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.primary
  },

  // Styles pour les créneaux horaires
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  heureLabel: {
    width: 70,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600'
  },
  heureSlot: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    paddingLeft: 16
  },
  slotDisponible: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe'
  },
  slotText: {
    color: COLORS.primary,
    fontWeight: '500'
  },

  // Styles pour le modal de réservation
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(21, 39, 71, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: COLORS.primary,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  formInput: {
    flex: 1,
    height: 52,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.text,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  formSelection: {
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formSelectionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  formSelectionPlaceholder: {
    fontSize: 16,
    color: COLORS.textLight,
    fontStyle: 'italic',
    flex: 1,
  },
  selectionButtonIcon: {
    color: COLORS.primary,
    fontSize: 18,
    marginLeft: 10,
  },
  paymentModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  paymentModeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentModeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentModeText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 15,
  },
  paymentModeTextSelected: {
    color: COLORS.surface,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  formButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  formButtonSecondary: {
    backgroundColor: COLORS.textLight,
  },
  formButtonDanger: {
    backgroundColor: COLORS.error,
  },
  formButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },

  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(21, 39, 71, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  selectionModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  selectionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: COLORS.primary,
    textAlign: 'center',
  },
  selectionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedItem: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  selectionItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectionItemDetail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  closeSelectionButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  closeSelectionButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  prestataireBadge: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 14,
  },

  // Styles pour les créneaux disponibles
  creneauxContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 400,
  },
  creneauxTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.primary,
    textAlign: 'center',
  },
  creneauButton: {
    width: 84,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  creneauButtonSelected: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 1.05 }],
  },
  creneauText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  creneauHeureFin: {
    fontSize: 11,
    color: '#e5e7eb',
    marginTop: 2,
  },
  creneauIntervenant: {
    fontSize: 10,
    color: '#e5e7eb',
    marginTop: 2,
    fontStyle: 'italic',
  },
  aucunCreneauText: {
    marginTop: 20,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 24,
  },
  creneauxLoadingText: {
    marginTop: 10,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  aucunCreneauSubText: {
    marginTop: 5,
    color: COLORS.textLight,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  creneauxList: {
    maxHeight: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  creneauSelectionne: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  creneauSelectionneText: {
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  creneauSelectionneIntervenant: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },
  modeIndication: {
    backgroundColor: '#f0f9ff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  modeIndicationText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  horaireInfo: {
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#b3e0ff',
  },
  horaireInfoText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },

  // Styles pour le calendrier modal
  calendarModal: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },

calendarNavArrow: {
  fontSize: 18,
  fontWeight: '600',
  color: COLORS.primary,
},
calendarMonthTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: COLORS.primary,
  flex: 1,
  textAlign: 'center',
},
  calendarGrid: {
    marginBottom: 20,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  calendarDayHeader: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    color: COLORS.textLight,
  },
 calendarDaysGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  width: '100%', // ← AJOUTER
},
calendarDay: {
  width: '14.28%', // ← CORRECTION : largeur fixe
  height: 44, // ← Hauteur fixe
  justifyContent: 'center',
  alignItems: 'center',
  marginVertical: 2, // ← Réduire les marges verticales
  borderRadius: 8,
  borderWidth: 1.5,
  borderColor: COLORS.border,
  backgroundColor: COLORS.background,
},

  calendarDaySelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  calendarDayFerme: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  calendarDayIndisponible: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  calendarDayDisponible: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  calendarDayIndisponibleIntervenant: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  calendarDayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  calendarDayTextDisabled: {
    color: COLORS.textLight,
  },
  calendarTodayText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  calendarIndicator: {
    fontSize: 10,
    marginTop: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
    borderWidth: 1,
  },
  legendOpen: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  legendClosed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  legendDisponible: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
  },
  legendIndisponible: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
    borderWidth: 1,
  },
  legendFerme: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  legendReserved: {
    backgroundColor: '#f0f9ff',
    borderColor: COLORS.primary,
  },

  legendToday: {
    backgroundColor: '#f0f9ff',
    borderColor: COLORS.primary,
  },

  legendText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    minWidth: 44,
    alignItems: 'center',
  },
calendarEmptyDay: {
  width: '14.28%', // ← Même largeur que les jours normaux
  height: 44,
  marginVertical: 2,
},

  closeCalendarButton: {
    marginTop: 20,
    padding: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeCalendarButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 15,
  },

  // Styles pour les réservations
  reservationsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  reservationsScrollView: {
    maxHeight: 300,
  },
  reservationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reservationTime: {
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationHeure: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reservationDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  reservationClient: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  reservationPrestation: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  reservationIntervenant: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  reservationStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  statusReserve: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  statusConfirme: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  statusAnnule: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  reservationStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noReservationsText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontStyle: 'italic',
    padding: 24,
  },

  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 14,
  },
  noReservationsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noReservationsSubText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  reservationHeureFin: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  reservationCommentaire: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: COLORS.surface,
    padding: 6,
    borderRadius: 6,
  },
  addReservationButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addReservationButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },

  // Styles pour les boutons de statut
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statusButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  statusButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  statusButtonTextSelected: {
    color: COLORS.surface,
  },

  // Styles pour les détails de réservation
  reservationDetailContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: '70%',
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginBottom: 16,
    borderRadius: 12,
  },

  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSpacer: {
    width: 60,
  },
  detailContent: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
    textTransform: 'uppercase',
  },
  commentBox: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  calendarCellWithReservations: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  reservationsIndicator: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  reservationsIndicatorText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Styles pour la navigation
  navArrow: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },
  monthNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },

  responsiveScrollContainer: {
    width: '100%',
  },
  responsiveScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  responsiveForm: {
    maxHeight: '90%',
  },

  // Styles pour les messages d'information
  infoMessage: {
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 20,
  },
  infoText: {
    color: '#92400e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Styles pour la sélection de mode
  modeSelector: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeSelectorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: COLORS.surface,
  },

  // Styles pour les intervenants non disponibles
  noIntervenantsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noIntervenantsText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  noIntervenantsSubText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  intervenantDispoText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectDateButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  selectDateButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  },
    weekViewContainers: {
    flex: 1,
  },
  
  weekViewHeader: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    // Légère ombre pour séparer du contenu scrollable
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 1,
  },

  weekScrollContent: {
    flex: 1,
  },

  weekScrollContainer: {
    paddingBottom: 40, // Espace en bas pour le scroll
  },

  weekEventsSection: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  noEventsText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontStyle: 'italic',
    padding: 16,
  },

  reservationsList: {
    // Supprimer la hauteur maximale pour permettre l'expansion naturelle
  },

  daySlotsContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    // Supprimer maxHeight pour permettre l'expansion
  },

  bottomSpacer: {
    height: 40,
  },

  // Ajuster le bouton d'ajout de réservation
  addReservationButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
    legendToday: {
    backgroundColor: '#f0f9ff',
    borderColor: COLORS.primary,
  },
datePreselectedBadge: {
  fontSize: 10,
  color: COLORS.success,
  fontWeight: '600',
  marginLeft: 8,
  backgroundColor: '#f0f9ff',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 8,
},
formSelectionContent: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
formSelectionContent: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
},
datePreselectedBadge: {
  fontSize: 12,
  color: COLORS.success,
  fontWeight: '600',
  marginLeft: 8,
},
calendarDaySelected: {
  borderColor: COLORS.primary,
  borderWidth: 2,
  backgroundColor: '#f0f9ff',
  transform: [{ scale: 1.05 }],
},

calendarDaySelectedText: {
  color: COLORS.primary,
  fontWeight: '700',
},

selectedDateIndicator: {
  position: 'absolute',
  bottom: 2,
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: COLORS.primary,
},

calendarToday: {
  borderColor: COLORS.accent,
  backgroundColor: '#e8f4fd',
  // Note: On garde le style pour aujourd'hui, mais seulement si c'est vraiment aujourd'hui
},

calendarTodayText: {
  color: COLORS.accent,
  fontWeight: '700',
},
calendarDayContent: {
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
},
calendarIndicators: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 2,
},
calendarIndicator: {
  fontSize: 10,
},
calendarDaySelected: {
  borderColor: COLORS.primary,
  borderWidth: 3,
  backgroundColor: '#e8f4fd',
  transform: [{ scale: 1.05 }],
},
// Ajoutez ces styles :
closedTextContainer: {
  marginTop: 2,
},

calendarIndicators: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 2,
},

calendarIndicator: {
  fontSize: 10,
},

calendarDayContent: {
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
},

selectedDateIndicator: {
  position: 'absolute',
  bottom: 2,
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: COLORS.primary,
},
selectedDayText: {
  color: COLORS.surface,
},
// Styles pour l'en-tête de semaine amélioré
weekHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: 5,
  paddingBottom: 12,
},

dayHeaderContainer: {
  alignItems: 'center',
  width: '13.5%', // Légèrement moins que 14.28% pour avoir de l'espace
  paddingVertical: 12,
  paddingHorizontal: 4,
  borderRadius: 16,
  backgroundColor: COLORS.surface,
  borderWidth: 2,
  borderColor: COLORS.border,
  position: 'relative',
  minHeight: 70, // Hauteur minimale pour éviter la compression
},

dayHeaderContent: {
  alignItems: 'center',
  justifyContent: 'center',
},

dayNameLarge: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.textLight,
  textTransform: 'uppercase',
  marginBottom: 6,
},

dayNumberLarge: {
  fontSize: 18,
  fontWeight: '700',
  color: COLORS.text,
},

closedDayHeaderContainer: {
  backgroundColor: '#fef2f2',
  borderColor: '#fecaca',
},

selectedDayHeaderContainer: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
  transform: [{ scale: 1.05 }],
},

selectedDayText: {
  color: COLORS.surface,
},

closedDayText: {
  color: '#dc2626',
},


selectedDayIndicator: {
  position: 'absolute',
  bottom: 4,
  width: 20,
  height: 3,
  backgroundColor: COLORS.surface,
  borderRadius: 2,
},

// Styles d'espacement améliorés
weekViewHeader: {
  backgroundColor: COLORS.surface,
  paddingHorizontal: 10, // Réduit le padding horizontal
  paddingTop: 12,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
  zIndex: 1,
},

weekNavContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
  paddingHorizontal: 5,
},

monthYearText: {
  fontSize: 17,
  color: COLORS.primary,
  fontWeight: '700',
  textAlign: 'center',
},

// Ajuster le contenu scrollable
weekScrollContent: {
  flex: 1,
  paddingHorizontal: 8, // Réduit le padding pour plus d'espace
},

weekEventsSection: {
  backgroundColor: COLORS.surface,
  marginHorizontal: 12,
  marginVertical: 8,
  padding: 16,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
},
closedTextContainer: {
  marginTop: 2,
},
intervenantDetailsText: {
  fontSize: 11,
  color: COLORS.textLight,
  marginTop: 2,
  fontStyle: 'italic',
},
intervenantHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
creneauxBadge: {
  backgroundColor: COLORS.success,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
},
creneauxBadgeText: {
  color: COLORS.surface,
  fontSize: 11,
  fontWeight: '600',
},
selectionItemWithDetails: {
  paddingVertical: 16,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
  backgroundColor: COLORS.background,
  borderRadius: 10,
  marginBottom: 10,
},
disponibiliteDetails: {
  marginTop: 8,
  padding: 10,
  backgroundColor: '#f8fafc',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e2e8f0',
},
pauseText: {
  fontSize: 12,
  color: '#f59e0b',
  marginTop: 4,
  fontWeight: '500',
},
creneauxPreview: {
  marginTop: 12,
  padding: 10,
  backgroundColor: '#f0f9ff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#bae6fd',
},
creneauxPreviewTitle: {
  fontSize: 13,
  fontWeight: '600',
  color: COLORS.primary,
  marginBottom: 6,
},


creneauPreviewItem: {
  backgroundColor: COLORS.primary,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},
creneauPreviewText: {
  color: COLORS.surface,
  fontSize: 11,
  fontWeight: '500',
},
plusCreneauxText: {
  fontSize: 11,
  color: COLORS.textLight,
  fontStyle: 'italic',
  marginLeft: 6,
},
reasonsList: {
  marginTop: 10,
  marginBottom: 20,
  paddingLeft: 20,
},
reasonItem: {
  fontSize: 13,
  color: COLORS.textLight,
  marginBottom: 4,
},
intervenantInfoText: {
  fontSize: 12,
  color: COLORS.textLight,
  marginTop: 4,
  fontStyle: 'italic',
},
// Ajouter ces styles
calendarDayTextDisponible: {
  color: COLORS.success,
  fontWeight: '600',
},

calendarDayIndisponible: {
  backgroundColor: '#fffbeb',
  borderColor: '#fed7aa',
},

calendarDayDisponible: {
  backgroundColor: '#f0f9ff',
  borderColor: '#bae6fd',
},

// Styles pour le texte désactivé
calendarDayTextDisabled: {
  color: '#9ca3af', // Gris pour les jours indisponibles
  textDecorationLine: 'line-through',
},


calendarDayTextNormal: {
  color: COLORS.textLight,
},
calendarInfo: {
  backgroundColor: '#f0f9ff',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#bae6fd',
},

calendarInfoText: {
  fontSize: 12,
  color: COLORS.primary,
  textAlign: 'center',
  fontWeight: '500',
},

calendarDayTextIndisponible: {
  color: '#f59e0b', // Orange pour les indisponibles
  textDecorationLine: 'line-through',
},

calendarDayTextNormal: {
  color: '#6b7280', // Gris pour les jours normaux
},
// Ajoutez ces styles
legendDisponibleReel: {
  backgroundColor: '#dbeafe',
  borderColor: '#3b82f6',
  borderWidth: 1,
},
legendIntervenantDisponible: {
  backgroundColor: '#dcfce7',
  borderColor: '#22c55e',
  borderWidth: 1,
},
legendAucunIntervenant: {
  backgroundColor: '#fef3c7',
  borderColor: '#f59e0b',
  borderWidth: 1,
},
legendFerme: {
  backgroundColor: '#fee2e2',
  borderColor: '#ef4444',
  borderWidth: 1,
},
// Ajoutez ces styles
legendDisponible: {
  backgroundColor: '#dcfce7',
  borderColor: '#22c55e',
  borderWidth: 1,
  width: 12,
  height: 12,
  borderRadius: 6,
},
legendIndisponible: {
  backgroundColor: '#fef3c7',
  borderColor: '#f59e0b',
  borderWidth: 1,
  width: 12,
  height: 12,
  borderRadius: 6,
},
legendFerme: {
  backgroundColor: '#fee2e2',
  borderColor: '#ef4444',
  borderWidth: 1,
  width: 12,
  height: 12,
  borderRadius: 6,
},
legendText: {
  fontSize: 11,
  color: COLORS.text,
  marginLeft: 6,
  fontWeight: '500',
},
infoSubText: {
  fontSize: 13,
  color: COLORS.success,
  textAlign: 'center',
  marginTop: 4,
  fontWeight: '500',
},
// Styles pour l'affichage en colonnes
creneauxColumnsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  flexWrap: 'nowrap',
  paddingHorizontal: 5,
},

creneauColumn: {
  flex: 1,
  alignItems: 'center',
  marginHorizontal: 4,
},

creneauButton: {
  width: '100%',
  minHeight: 70,
  paddingVertical: 12,
  paddingHorizontal: 8,
  backgroundColor: COLORS.primary,
  borderRadius: 10,
  alignItems: 'center',
  marginBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},

creneauButtonSelected: {
  backgroundColor: COLORS.primaryDark,
  transform: [{ scale: 1.05 }],
  borderWidth: 2,
  borderColor: COLORS.surface,
},

creneauText: {
  color: COLORS.surface,
  fontWeight: '600',
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 2,
},

creneauHeureFin: {
  fontSize: 11,
  color: '#e5e7eb',
  marginBottom: 2,
},

creneauIntervenant: {
  fontSize: 10,
  color: '#e5e7eb',
  fontStyle: 'italic',
  textAlign: 'center',
  marginTop: 2,
},


  // NOUVEAUX STYLES POUR LE CALENDRIER MOIS
  calendarCellFerme: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  
  calendarCellIndisponible: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  
  calendarCellDisponible: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  
  calendarCellFermeText: {
    color: '#dc2626',
    textDecorationLine: 'line-through',
  },
  
  calendarCellIndisponibleText: {
    color: '#f59e0b',
  },
  
  calendarCellDisponibleText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  calendarToday: {
    borderColor: COLORS.accent,
    backgroundColor: '#e8f4fd',
  },
  
  calendarTodayText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  
  calendarDaySelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    backgroundColor: '#e8f4fd',
    transform: [{ scale: 1.05 }],
  },
  
  calendarIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  
  indicatorIcon: {
    fontSize: 10,
  },
  
  // Légende mise à jour
  legendDisponible: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    borderWidth: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  legendIndisponible: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  legendFerme: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  legendToday: {
    backgroundColor: '#e8f4fd',
    borderColor: COLORS.accent,
    borderWidth: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  legendText: {
    fontSize: 11,
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  
  calendarCellWithReservations: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  
  // Styles pour le texte fermé
  closedTextContainer: {
    marginTop: 2,
  },
  
  closedText: {
    fontSize: 7,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Ajoutez dans vos styles :
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 50,
},
calendarCellDisabled: {
  opacity: 0.5,
},
  weekLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  weekLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flex: 1,
    minWidth: '45%',
  },
  
  weekLegendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
  },
  
  weekLegendText: {
    fontSize: 9,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  
  // Indicateur de statut dans les jours
  dayStatutIndicator: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // Bannière de statut pour le jour sélectionné
  dayStatutBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  
  dayStatutMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
// Ajouter ces styles dans votre StyleSheet
reservationInfo: {
  backgroundColor: '#fffbeb',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#fed7aa',
},
reservationInfoText: {
  fontSize: 13,
  color: '#92400e',
  fontWeight: '500',
  textAlign: 'center',
},
reservationInfoSubText: {
  fontSize: 12,
  color: '#92400e',
  textAlign: 'center',
  marginTop: 4,
},

intervenantsScrollView: {
  maxHeight: 400,
  width: '100%',
},

warningSubText: {
  fontSize: 13,
  color: COLORS.warning,
  textAlign: 'center',
  marginTop: 4,
  fontWeight: '500',
},
loadingIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},

loadingText: {
  marginLeft: 8,
  color: COLORS.textLight,
  fontSize: 14,
},

loadingMessage: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0f9ff',
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#bae6fd',
},

loadingMessageText: {
  marginLeft: 8,
  color: COLORS.primary,
  fontSize: 12,
  fontWeight: '500',
},
});

