import AsyncStorage from '@react-native-async-storage/async-storage';
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
import Icon from 'react-native-vector-icons/FontAwesome';

const ConfirmationPrestation = ({ route, navigation }) => {
  const { prestation, entreprise } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState([]);
  const [joursFermes, setJoursFermes] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [rawHoraires, setRawHoraires] = useState([]);

  const [currentEditingPrestationIndex, setCurrentEditingPrestationIndex] = useState(null);

  const [selectedPrestations, setSelectedPrestations] = useState([
    {
      ...prestation,
      intervenant: null,
      selectedDate: null,
      selectedTime: null,
      availableTimes: []
    }
  ]);

  const [showIntervenantModal, setShowIntervenantModal] = useState(false);
  const [intervenants, setIntervenants] = useState([]);
  const [isLoadingIntervenants, setIsLoadingIntervenants] = useState(false);
  const [currentPrestationIndex, setCurrentPrestationIndex] = useState(null);
  const [filteredIntervenants, setFilteredIntervenants] = useState([]);

  const [disponibilitesIntervenants, setDisponibilitesIntervenants] = useState({});

  const [showAjouterPrestation, setShowAjouterPrestation] = useState(false);
  const [categories, setCategories] = useState([]);
  const [prestationsParCategorie, setPrestationsParCategorie] = useState({});
  const [categoriesExpanded, setCategoriesExpanded] = useState({});
  const [loadingPrestations, setLoadingPrestations] = useState(false);

  const id_prestataire = entreprise?.id_prestataire;



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

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h${remainingMinutes}min`;
  };

  const renderDuréeTotale = () => {
    const dureeTotaleMinutes = selectedPrestations.reduce((total, presta) => total + presta.temps, 0);
    return formatDuration(dureeTotaleMinutes);
  };

  const checkIntervenantsDisponiblesPourDate = async (date, prestationIndex) => {
    try {
      const prestation = selectedPrestations[prestationIndex];
      const categorie = prestation?.categorie;

      if (intervenants.length === 0) {
        await loadIntervenants();
      }

      if (intervenants.length === 0) {
        return false;
      }

      let intervenantsFiltres = intervenants;
      
      if (categorie && categorie.trim() !== '') {
        intervenantsFiltres = intervenants.filter(intervenant => {
          if (!intervenant.categorie) return false;
          
          const categoriesIntervenant = Array.isArray(intervenant.categorie) 
            ? intervenant.categorie 
            : typeof intervenant.categorie === 'string' 
              ? [intervenant.categorie] 
              : [];
          
          return categoriesIntervenant.some(cat => {
            const catNormalise = cat?.toString().toLowerCase().trim();
            const categorieRecherche = categorie.toLowerCase().trim();
            return catNormalise === categorieRecherche;
          });
        });
      }

      if (intervenantsFiltres.length === 0) {
        return false;
      }

      let auMoinsUnDisponible = false;
      const datePourAPI = date.toISOString().split('T')[0];
      
      for (const intervenant of intervenantsFiltres) {
        try {
          let employeIdParam = '';
          if (intervenant.type === 'prestataire') {
            employeIdParam = 'prestataire';
          } else {
            employeIdParam = intervenant.id.toString();
          }

          const queryParams = new URLSearchParams({
            prestataire_id: id_prestataire,
            employe_id: employeIdParam,
            date: datePourAPI,
            duree_minutes: prestation.temps.toString()
          });

          const response = await fetch(
            `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${queryParams}`,
            { timeout: 5000 }
          );

          if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'disponible') {
              auMoinsUnDisponible = true;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return auMoinsUnDisponible;
      
    } catch (error) {
      return false;
    }
  };

  const supprimerPrestation = async (index) => {
    if (selectedPrestations.length <= 1) {
      Alert.alert('Information', 'Vous devez avoir au moins une prestation');
      return;
    }

    const nouvellesPrestations = selectedPrestations.filter((_, i) => i !== index);
    setSelectedPrestations(nouvellesPrestations);
    
    await refiltrerTousLesCreneaux(nouvellesPrestations);
  };

  const renderAjouterPrestationButton = () => (
    <TouchableOpacity 
      style={styles.ajouterPrestationButton}
      onPress={() => {
        setShowAjouterPrestation(!showAjouterPrestation);
        if (!showAjouterPrestation) {
          loadCategoriesEtPrestations();
        }
      }}
    >
      <Icon 
        name={showAjouterPrestation ? "minus" : "plus"} 
        size={16} 
        color="#152747" 
      />
      <Text style={styles.ajouterPrestationButtonText}>
        {showAjouterPrestation ? 'Masquer les prestations' : 'Ajouter une prestation'}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoriesEtPrestations = () => {
    if (!showAjouterPrestation) return null;

    if (loadingPrestations) {
      return (
        <View style={styles.loadingPrestations}>
          <ActivityIndicator size="small" color="#152747" />
          <Text style={styles.loadingPrestationsText}>Chargement des prestations...</Text>
        </View>
      );
    }

    return (
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Prestations disponibles</Text>
        
        {categories.length === 0 ? (
          <Text style={styles.noPrestationsText}>Aucune prestation disponible</Text>
        ) : (
          categories.map(categorie => (
            <View key={`categorie-${categorie}`} style={styles.categorieSection}>
              <TouchableOpacity 
                style={styles.categorieHeader}
                onPress={() => toggleCategorie(categorie)}
              >
                <Text style={styles.categorieHeaderText}>{categorie}</Text>
                <Icon 
                  name={categoriesExpanded[categorie] ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {categoriesExpanded[categorie] && (
                <View style={styles.prestationsList}>
                  {prestationsParCategorie[categorie]?.map(presta => (
                    <View key={`presta-${presta.id_prestation}`} style={styles.prestationAjoutItem}>
                      <View style={styles.prestationAjoutInfo}>
                        <Text style={styles.prestationAjoutTitle}>{presta.titre}</Text>
                        <Text style={styles.prestationAjoutDetails}>
                          {presta.prix} € • {formatDuration(presta.temps)}
                        </Text>
                        {presta.description && (
                          <Text style={styles.prestationAjoutDescription} numberOfLines={2}>
                            {presta.description}
                          </Text>
                        )}
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

  const getJourSemaineComplet = (date) => {
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return jours[date.getDay()];
  };

  const isIntervenantDisponibleCeJour = (disponibilites, jourSemaine) => {
    if (!disponibilites || Object.keys(disponibilites).length === 0) {
      return true;
    }
    
    if (disponibilites[jourSemaine] && disponibilites[jourSemaine].debut) {
      const horairesJour = disponibilites[jourSemaine];
      return horairesJour.debut && horairesJour.fin;
    }
    
    const jourNormalise = jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1);
    
    if (disponibilites[jourNormalise]) {
      const dispoEmploye = disponibilites[jourNormalise];
      return dispoEmploye.disponible === true && dispoEmploye.heure_debut && dispoEmploye.heure_fin;
    }
    
    return true;
  };


  const verifierDisponibiliteIntervenantPourDate = async (intervenant, date) => {
    try {
      const dateNormalisee = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
      const datePourAPI = dateNormalisee.toISOString().split('T')[0];
      
      const mainPrestation = selectedPrestations[0];
      const dureeMinutes = mainPrestation?.temps || 0;

      let employeIdParam = '';
      if (intervenant.type === 'prestataire') {
        employeIdParam = 'prestataire';
      } else {
        employeIdParam = intervenant.id;
      }

      const queryParams = new URLSearchParams({
        prestataire_id: id_prestataire,
        employe_id: employeIdParam,
        date: datePourAPI,
        duree_minutes: dureeMinutes
      });

      const response = await fetch(
        `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      return data.status === 'disponible';
      
    } catch (error) {
      return false;
    }
  };

  const fetchJoursFermes = async (prestataireId) => {
    try {
      const response = await fetch(`http://192.168.1.68:3000/api/jours-fermes/${prestataireId}`);
      if (response.ok) {
        const joursFermesData = await response.json();
        const joursFermesList = joursFermesData
          .filter(jour => jour.is_ferme === 1)
          .map(jour => jour.jour_semaine.toLowerCase());
        
        setJoursFermes(joursFermesList);
        return joursFermesList;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const openCalendar = (prestationIndex) => {
    setCurrentEditingPrestationIndex(prestationIndex);
    setShowCalendarModal(true);
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const generateCalendarWithAvailability = async (monthDate, prestationIndex) => {
    try {
      setLoadingCalendar(true);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      let joursFermesData = [];
      try {
        const joursFermesResponse = await fetch(`http://192.168.1.68:3000/api/jours-fermes/${id_prestataire}`);
        if (joursFermesResponse.ok) {
          joursFermesData = await joursFermesResponse.json();
          setJoursFermes(joursFermesData.filter(jour => jour.is_ferme === 1).map(jour => jour.jour_semaine));
        }
      } catch (error) {
      }
      
      let horairesSalon = [];
      try {
        const horairesResponse = await fetch(`http://192.168.1.68:3000/api/horaires/${id_prestataire}`);
        if (horairesResponse.ok) {
          horairesSalon = await horairesResponse.json();
          setRawHoraires(horairesSalon);
        }
      } catch (error) {
      }
      
      const calendar = [];
      
      const firstDayOfWeek = firstDay.getDay();
      const startingEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      
      for (let i = 0; i < startingEmptyDays; i++) {
        calendar.push({ isEmpty: true });
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month, day));
        const dateString = currentDate.toISOString().split('T')[0];
        const jourSemaine = getJourSemaineComplet(currentDate);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDateNormalized = new Date(currentDate);
        currentDateNormalized.setHours(0, 0, 0, 0);
        const isPastDay = currentDateNormalized < today;
        
        const isFermeSalon = joursFermesData.some(jour => 
          jour.jour_semaine === jourSemaine && jour.is_ferme === 1
        );
        
        const horaireJour = horairesSalon.find(h => h.jour === jourSemaine);
        const isOpen = !isFermeSalon && horaireJour && !horaireJour.is_ferme;
        
        let status = 'normal';
        
        if (isPastDay) {
          status = 'past';
        } else if (isFermeSalon || !isOpen) {
          status = 'ferme';
        } else {
          const prestation = selectedPrestations[prestationIndex];
          const hasIntervenantSelectionne = prestation?.intervenant;
          
          if (hasIntervenantSelectionne) {
                const intervenant = prestation.intervenant;
                if (intervenant) {
                  const disponibilites = disponibilitesIntervenants[intervenant.id] || {};
                  const estDisponibleIntervenant = isIntervenantDisponibleCeJour(disponibilites, jourSemaine);
                  
                  if (!estDisponibleIntervenant) {
                    status = 'indisponible';
                  } else {
                    try {
                      const queryParams = new URLSearchParams({
                        prestataire_id: id_prestataire,
                        date: dateString,
                        duree_minutes: prestation.temps || 0,
                        employe_id: intervenant.type === 'prestataire' ? 'prestataire' : intervenant.id
                      });
                      
                      const response = await fetch(
                        `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${queryParams}`,
                        { timeout: 8000 }
                      );
                      
                      if (response.ok) {
                        const data = await response.json();
                        status = data.status === 'disponible' ? 'disponible' : 'indisponible';
                      }
                    } catch (error) {
                      status = 'erreur';
                    }
                  }
                }
              } else {
                try {
                  const auMoinsUnDisponible = await checkIntervenantsDisponiblesPourDate(currentDate, prestationIndex);
                  
                  if (!auMoinsUnDisponible) {
                    status = 'indisponible'; 
                  } else {
                    const queryParams = new URLSearchParams({
                      prestataire_id: id_prestataire,
                      date: dateString,
                      duree_minutes: prestation.temps || 0,
                      ...(prestation.categorie && { categorie: prestation.categorie })
                    });
                    
                    const response = await fetch(
                      `http://192.168.1.68:3000/api/verifier-disponibilite-globale?${queryParams}`,
                      { timeout: 8000 }
                    );
                    
                    if (response.ok) {
                      const data = await response.json();
                      status = data.status === 'disponible' ? 'disponible' : 'indisponible';
                    }
                  }
                } catch (error) {
                  status = 'erreur';
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
          isToday: isSameDay(currentDate, new Date()),
          isPast: isPastDay  
        });
      }
      
      setCalendarDates(calendar);
      
    } catch (error) {
      generateBasicCalendar(monthDate);
    } finally {
      setLoadingCalendar(false);
    }
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month, day));
      const dateString = currentDate.toISOString().split('T')[0];
      const jourSemaine = getJourSemaineComplet(currentDate);
      
      const currentDateNormalized = new Date(currentDate);
      currentDateNormalized.setHours(0, 0, 0, 0);
      const isPastDay = currentDateNormalized < today;
      
      calendar.push({
        date: currentDate,
        dateString,
        jourSemaine,
        status: isPastDay ? 'past' : 'normal',
        isFerme: false,
        isOpen: true,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isPast: isPastDay
      });
    }
    
    setCalendarDates(calendar);
  };

  const isSameDay = (date1, date2) => {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
  };

  const isDateSelectable = (day) => {
    if (!day || day.isEmpty) return false;
    
    if (day.isPast) return false;
    
    if (day.isFerme) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(day.date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) return false;
    
    // Modification ici - plus qu'un seul statut
    if (day.status === 'indisponible') {
      return false;
    }
    
    return day.status === 'disponible';
  };

  const renderCalendarDay = (day, index) => {
    if (day.isEmpty) {
      return <View key={`empty-${index}`} style={styles.calendarEmptyDay} />;
    }

    const jourSemaine = day.date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const isFerme = joursFermes.includes(jourSemaine);
    let status = day.status;
    
    if (day.isPast) {
      status = 'past';
    }

    return (
      <TouchableOpacity
        key={`day-${day.dateString}-${index}`}
        style={[
          styles.calendarDay,
          day.isToday && styles.calendarToday,
          day.isFerme && styles.calendarDayFerme,
          status === 'past' && styles.calendarDayPast,
          day.status === 'indisponible' && styles.calendarDayIndisponible,
          day.status === 'disponible' && styles.calendarDayDisponible,
          selectedPrestations[currentEditingPrestationIndex]?.selectedDate?.toDateString() === day.date.toDateString() && 
            styles.calendarDaySelected
        ]}
        onPress={() => {
          if (isDateSelectable(day)) {
            handleDateSelection(day, currentEditingPrestationIndex);
          }
        }}
        disabled={!isDateSelectable(day)}
      >
        <Text style={[
          styles.calendarDayText,
          (day.isFerme || day.status === 'indisponible' || day.isPast) && 
            styles.calendarDayTextDisabled,
          day.isToday && styles.calendarTodayText
        ]}>
          {day.date.getDate()}
        </Text>
        
        {day.isFerme && (
          <Text style={styles.calendarIndicator}>🚫</Text>
        )}
        {day.status === 'indisponible' && !day.isFerme && !day.isPast && (
          <Text style={styles.calendarIndicator}>🟡</Text>
        )}
        {day.status === 'disponible' && !day.isFerme && !day.isPast && (
          <Text style={styles.calendarIndicator}>✅</Text>
        )}
      </TouchableOpacity>
    );
  };


  const renderTimeSlotsForPrestation = (presta, prestationIndex) => {
    if (!presta.selectedDate) return null;

    return (
      <View style={styles.timeSlotsSection}>
        <Text style={styles.timeSlotsTitle}>
          Créneaux disponibles
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#152747" />
            <Text style={styles.loadingText}>Chargement des créneaux...</Text>
          </View>
        ) : presta.availableTimes.filter(slot => slot.isAvailable).length > 0 ? (
          <View style={styles.timeSlotsContainer}>
            <View style={styles.timeSlotsGrid}>
              {presta.availableTimes
                .filter(slot => slot.isAvailable)
                .map((timeSlot, index) => (
                  <TouchableOpacity
                    key={`timeslot-${prestationIndex}-${timeSlot.start}-${index}`}
                    style={[
                      styles.timeSlotButton,
                      presta.selectedTime?.start === timeSlot.start && styles.timeSlotSelected,
                      !timeSlot.isAvailable && styles.timeSlotDisabled
                    ]}
                    onPress={() => handleTimeSelect(timeSlot, prestationIndex)}
                    disabled={!timeSlot.isAvailable}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      presta.selectedTime?.start === timeSlot.start && styles.timeSlotTextSelected,
                      !timeSlot.isAvailable && styles.timeSlotTextDisabled
                    ]}>
                      {timeSlot.start}
                    </Text>
                    <Text style={[
                      styles.timeSlotEndText,
                      presta.selectedTime?.start === timeSlot.start && styles.timeSlotTextSelected,
                      !timeSlot.isAvailable && styles.timeSlotTextDisabled
                    ]}>
                      - {timeSlot.end}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ) : (
          <View style={styles.noSlotsContainer}>
            <Icon name="clock-o" size={40} color="#DDD" />
            <Text style={styles.noSlotsText}>
              Aucun créneau disponible après déduction des créneaux déjà réservés
            </Text>
            <Text style={styles.noSlotsSubText}>
              Veuillez choisir une autre date ou modifier les créneaux déjà sélectionnés
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCalendarModal = () => (
    <Modal
      visible={showCalendarModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCalendarModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                onPress={goToPreviousMonth}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavArrow}>◀</Text>
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthTitle}>
                {selectedMonth.toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                }).toUpperCase()}
              </Text>
              
              <TouchableOpacity 
                onPress={goToNextMonth}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavArrow}>▶</Text>
              </TouchableOpacity>
            </View>

            {currentEditingPrestationIndex !== null && (
              <View style={styles.intervenantIndicator}>
                <Icon name="calendar" size={14} color="#152747" />
                <Text style={styles.intervenantIndicatorText}>
                  Sélection de date pour: {selectedPrestations[currentEditingPrestationIndex]?.titre}
                </Text>
              </View>
            )}

            <View style={styles.calendarGrid}>
              <View style={styles.calendarDaysHeader}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                  <Text key={`header-${day}-${index}`} style={styles.calendarDayHeader}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarDaysGrid}>
                {calendarDates.map((day, index) => renderCalendarDay(day, index))}
              </View>
            </View>

          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendDisponible]} />
              <Text style={styles.legendText}>Disponible</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendIndisponible]} />
              <Text style={styles.legendText}>Complet</Text> 
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendPast]} />
              <Text style={styles.legendText}>Passé</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendFerme]} />
              <Text style={styles.legendText}>Fermé</Text>
            </View>
          </View>

            <TouchableOpacity 
              style={styles.closeCalendarButton}
              onPress={() => setShowCalendarModal(false)}
            >
              <Text style={styles.closeCalendarButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );

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


  const handleIntervenantSelect = async (intervenant) => {
    const index = currentPrestationIndex;
    
    if (index === null || index === undefined) {
      Alert.alert('Erreur', 'Veuillez réessayer la sélection.');
      return;
    }
    
    const nouvellesPrestations = [...selectedPrestations];
    nouvellesPrestations[index] = {
      ...nouvellesPrestations[index],
      intervenant: {
        id: intervenant.id,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        type: intervenant.type
      }
    };
    
    setSelectedPrestations(nouvellesPrestations);
    setShowIntervenantModal(false);
    
    const presta = nouvellesPrestations[index];
    if (presta.selectedDate) {
      setIsLoading(true);
      try {
        let employeIdParam = '';
        if (intervenant.type === 'prestataire') {
          employeIdParam = 'prestataire';
        } else {
          employeIdParam = intervenant.id.toString();
        }

        const queryParams = new URLSearchParams({
          prestataire_id: id_prestataire,
          employe_id: employeIdParam,
          date: presta.selectedDate.toISOString().split('T')[0],
          duree_minutes: presta.temps.toString()
        });

        const response = await fetch(
          `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${queryParams}`,
          { timeout: 8000 }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'disponible') {
            const disponibilites = await fetchDisponibilitesIntervenantSpecifique(
              intervenant.id,
              intervenant.type,
              presta.selectedDate,
              presta.temps
            );
            
            const timeSlots = disponibilites.map(creneau => ({
              start: creneau.heure,
              end: creneau.heure_fin,
              isAvailable: true
            }));
            
            nouvellesPrestations[index] = {
              ...nouvellesPrestations[index],
              availableTimes: timeSlots,
              selectedTime: null
            };
            
            setSelectedPrestations(nouvellesPrestations);
            
            await refiltrerTousLesCreneaux(nouvellesPrestations);
          }
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger les créneaux du nouvel intervenant');
      } finally {
        setIsLoading(false);
      }
    }
  };


  const getIntervenantsFiltresParCategorieEtDisponibilite = async (categorie, date) => {
    let intervenantsFiltresParCategorie = intervenants;
    
    if (categorie && categorie.trim() !== '') {
      intervenantsFiltresParCategorie = intervenants.filter(intervenant => {
        const hasCategorie = intervenant.categorie && 
          Array.isArray(intervenant.categorie) &&
          intervenant.categorie.some(cat => {
            if (!cat) return false;
            return cat.toString().toLowerCase().trim() === categorie.toLowerCase().trim();
          });
        
        return hasCategorie;
      });
    }
    
    const intervenantsDisponibles = [];
    
    for (const intervenant of intervenantsFiltresParCategorie) {
      const estDisponible = await verifierDisponibiliteIntervenantPourDate(intervenant, date);
      
      if (estDisponible) {
        intervenantsDisponibles.push(intervenant);
      }
    }
    
    return intervenantsDisponibles;
  };

  const openIntervenantModal = async (prestationIndex) => {
    setCurrentPrestationIndex(prestationIndex);
    
    const prestation = selectedPrestations[prestationIndex];

    setShowIntervenantModal(true);
    
    let intervenantsAFiltrer = [];
    
    if (prestation.selectedDate && prestation.intervenantsDisponiblesList) {
      intervenantsAFiltrer = prestation.intervenantsDisponiblesList;
    } else {
      if (prestation.selectedDate) {
        setIsLoadingIntervenants(true);
        
        try {
          intervenantsAFiltrer = await getIntervenantsFiltresParCategorieEtDisponibilite(
            prestation.categorie, 
            prestation.selectedDate
          );
        } catch (error) {
          intervenantsAFiltrer = getIntervenantsFiltresParCategorie(prestation.categorie);
        } finally {
          setIsLoadingIntervenants(false);
        }
      } else {
        intervenantsAFiltrer = getIntervenantsFiltresParCategorie(prestation.categorie);
      }
    }
    
    setFilteredIntervenants(intervenantsAFiltrer);
    
    if (intervenantsAFiltrer.length === 0 && prestation.selectedDate) {
      setTimeout(() => {
        Alert.alert(
          'Aucun intervenant disponible',
          `Aucun intervenant de la catégorie "${prestation.categorie}" n'est disponible pour la date sélectionnée. Veuillez choisir une autre date.`
        );
      }, 300);
    }
  };

  const getIntervenantsFiltresParCategorie = (categorie) => {
    if (!categorie || categorie.trim() === '') {
      return intervenants;
    }
    
    const intervenantsFiltres = intervenants.filter(intervenant => {
      const hasCategorie = intervenant.categorie && 
        Array.isArray(intervenant.categorie) &&
        intervenant.categorie.some(cat => {
          if (!cat) return false;
          return cat.toString().toLowerCase().trim() === categorie.toLowerCase().trim();
        });
      
      return hasCategorie;
    });
    
    return intervenantsFiltres;
  };

  const loadIntervenants = async () => {
    try {
      setIsLoadingIntervenants(true);
      
      const response = await fetch(
        `http://192.168.1.68:3000/api/employes?id_prestataire=${id_prestataire}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      const tousLesIntervenants = [];
      
      if (data.prestataire) {
        let categoriesPrestataire = [];
        try {
          if (data.prestataire.categorie) {
            categoriesPrestataire = JSON.parse(data.prestataire.categorie);
          }
        } catch (error) {
          if (typeof data.prestataire.categorie === 'string') {
            categoriesPrestataire = [data.prestataire.categorie];
          }
        }
        
        tousLesIntervenants.push({
          id: data.prestataire.id.toString(),
          nom: data.prestataire.nom,
          prenom: data.prestataire.prenom,
          type: 'prestataire',
          categorie: categoriesPrestataire,
          categories: categoriesPrestataire,
          disponibilite: data.prestataire.disponibilite
        });
      }
      
      if (data.employes && Array.isArray(data.employes)) {
        data.employes.forEach(employe => {
          let categoriesEmploye = [];
          try {
            if (employe.categorie) {
              categoriesEmploye = JSON.parse(employe.categorie);
            }
          } catch (error) {
            if (typeof employe.categorie === 'string') {
              categoriesEmploye = [employe.categorie];
            }
          }
          
          tousLesIntervenants.push({
            id: employe.id.toString(),
            nom: employe.nom,
            prenom: employe.prenom,
            type: 'employe',
            categorie: categoriesEmploye,
            categories: categoriesEmploye,
            disponibilite: employe.disponibilite
          });
        });
      }

      setIntervenants(tousLesIntervenants);

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les intervenants');
    } finally {
      setIsLoadingIntervenants(false);
    }
  };

  const fetchDisponibilitesGlobales = async (date, dureeMinutes, categorie) => {
    try {
      const dateNormalisee = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
      const datePourAPI = dateNormalisee.toISOString().split('T')[0];

      const queryParams = new URLSearchParams({
        prestataire_id: id_prestataire,
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
      return [];
    }
  };

  const handleTimeSelect = async (timeSlot, prestationIndex) => {
    if (!timeSlot.isAvailable) return;
    
    const nouvellesPrestations = [...selectedPrestations];
    
    nouvellesPrestations[prestationIndex] = {
      ...nouvellesPrestations[prestationIndex],
      selectedTime: timeSlot
    };
    
    setSelectedPrestations(nouvellesPrestations);
    
    await refiltrerTousLesCreneaux(nouvellesPrestations);
  };

  const refiltrerTousLesCreneaux = async (prestations) => {
    const updatedPrestations = [...prestations];
    
    for (let i = 0; i < updatedPrestations.length; i++) {
      const presta = updatedPrestations[i];
      
      if (presta.selectedDate && presta.availableTimes.length > 0) {
        
        const reservedSlots = [];
        for (let j = 0; j < updatedPrestations.length; j++) {
          if (i !== j && updatedPrestations[j].selectedDate && updatedPrestations[j].selectedTime) {
            const otherDate = updatedPrestations[j].selectedDate.toISOString().split('T')[0];
            const prestaDate = presta.selectedDate.toISOString().split('T')[0];
            
            if (otherDate === prestaDate) {
              reservedSlots.push({
                start: updatedPrestations[j].selectedTime.start,
                end: updatedPrestations[j].selectedTime.end
              });
            }
          }
        }
        
        const filteredSlots = presta.availableTimes.map(originalSlot => {
          let isAvailable = true;
          
          for (const reserved of reservedSlots) {
            const slotStartParts = originalSlot.start.split(':').map(Number);
            const slotEndParts = originalSlot.end.split(':').map(Number);
            const reservedStartParts = reserved.start.split(':').map(Number);
            const reservedEndParts = reserved.end.split(':').map(Number);
            
            const slotStartMinutes = slotStartParts[0] * 60 + slotStartParts[1];
            const slotEndMinutes = slotEndParts[0] * 60 + slotEndParts[1];
            const reservedStartMinutes = reservedStartParts[0] * 60 + reservedStartParts[1];
            const reservedEndMinutes = reservedEndParts[0] * 60 + reservedEndParts[1];
            
            if (!(slotEndMinutes <= reservedStartMinutes || slotStartMinutes >= reservedEndMinutes)) {
              isAvailable = false;
              break;
            }
          }
          
          return {
            ...originalSlot,
            isAvailable: isAvailable
          };
        });
        
        updatedPrestations[i] = {
          ...presta,
          availableTimes: filteredSlots
        };
      }
    }
    
    setSelectedPrestations(updatedPrestations);
  };


  const handleConfirmation = async () => {
    const toutesPrestationsCompletes = selectedPrestations.every(p => 
      p.intervenant && p.selectedDate && p.selectedTime
    );
    
    if (!toutesPrestationsCompletes) {
      Alert.alert('Information', 'Veuillez sélectionner un intervenant, une date et un créneau pour chaque prestation');
      return;
    }

    const userData = await getStoredUserData();

    if (!userData || !userData.id) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour confirmer une réservation.',
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      return;
    }

    const hasConflicts = checkForTimeConflicts();
    if (hasConflicts) {
      Alert.alert(
        'Conflit de créneaux',
        'Certains créneaux sélectionnés se chevauchent. Veuillez modifier vos sélections.',
        [{ text: 'OK' }]
      );
      return;
    }

    const prestationsPourNavigation = selectedPrestations.map(presta => ({
      ...presta,
      selectedDate: presta.selectedDate ? presta.selectedDate.toISOString() : null,
      selectedTime: presta.selectedTime ? {
        ...presta.selectedTime,
      } : null
    }));

    navigation.navigate('Paiement', {
      prestations: prestationsPourNavigation,
      entreprise,
      totalPrice: prixTotal.toFixed(2),
      totalDuration: dureeTotale,
      userData: userData
    });
  };

  const checkForTimeConflicts = () => {
    const creneauxParDate = {};
    
    selectedPrestations.forEach((presta, index) => {
      if (presta.selectedDate && presta.selectedTime) {
        const dateKey = presta.selectedDate.toISOString().split('T')[0];
        
        if (!creneauxParDate[dateKey]) {
          creneauxParDate[dateKey] = [];
        }
        
        creneauxParDate[dateKey].push({
          start: presta.selectedTime.start,
          end: presta.selectedTime.end,
          index: index,
          prestation: presta.titre
        });
      }
    });
    
    for (const dateKey in creneauxParDate) {
      const creneaux = creneauxParDate[dateKey];
      
      for (let i = 0; i < creneaux.length; i++) {
        for (let j = i + 1; j < creneaux.length; j++) {
          const creneau1 = creneaux[i];
          const creneau2 = creneaux[j];
          
          const [start1Hour, start1Min] = creneau1.start.split(':').map(Number);
          const [end1Hour, end1Min] = creneau1.end.split(':').map(Number);
          const [start2Hour, start2Min] = creneau2.start.split(':').map(Number);
          const [end2Hour, end2Min] = creneau2.end.split(':').map(Number);
          
          const start1Minutes = start1Hour * 60 + start1Min;
          const end1Minutes = end1Hour * 60 + end1Min;
          const start2Minutes = start2Hour * 60 + start2Min;
          const end2Minutes = end2Hour * 60 + end2Min;
          
          const chevauchement = (
            (start1Minutes < end2Minutes && end1Minutes > start2Minutes) ||
            (start1Minutes === start2Minutes && end1Minutes === end2Minutes)
          );
          
          if (chevauchement) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const getStoredUserData = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      const storageData = {};
      for (const key of allKeys) {
        storageData[key] = await AsyncStorage.getItem(key);
      }
      
      if (storageData.userData) {
        try {
          const userData = JSON.parse(storageData.userData);
          return {
            id: userData.id || userData.userId || userData.clientId,
            role: userData.role || userData.type || 'client'
          };
        } catch (e) {
        }
      }
      
      if (storageData.userId && storageData.userRole) {
        return {
          id: storageData.userId,
          role: storageData.userRole
        };
      }
      
      if (storageData.clientId) {
        return {
          id: storageData.clientId,
          role: 'client'
        };
      }
      
      if (storageData.id && storageData.type_utilisateur) {
        return {
          id: storageData.id,
          role: storageData.type_utilisateur
        };
      }
      
      for (const [key, value] of Object.entries(storageData)) {
        if (key.toLowerCase().includes('user') || key.toLowerCase().includes('client')) {
          try {
            const parsed = JSON.parse(value);
            if (parsed.id || parsed.userId || parsed.clientId) {
              return {
                id: parsed.id || parsed.userId || parsed.clientId,
                role: parsed.role || parsed.type || 'client'
              };
            }
          } catch (e) {
          }
          
          if (key.toLowerCase().includes('id') && value && value.length < 10) {
            return {
              id: value,
              role: 'client'
            };
          }
        }
      }
      
      return null;

    } catch (error) {
      return null;
    }
  };

  const handleDateSelection = async (day, prestationIndex) => {
    if (day.status === 'indisponible') {
      Alert.alert(
        'Journée complète',
        `Aucun créneau disponible pour cette date. Veuillez choisir une autre date.`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }
    
    if (!day.isOpen) {
      return;
    }
    
    const dateNormalisee = new Date(Date.UTC(
      day.date.getFullYear(),
      day.date.getMonth(),
      day.date.getDate()
    ));

    setIsLoading(true);
    try {
      const hasIntervenantsAvailable = await checkIntervenantsDisponiblesPourDate(dateNormalisee, prestationIndex);
      
      if (!hasIntervenantsAvailable) {
        const newCalendarDates = [...calendarDates];
        const dayIndex = newCalendarDates.findIndex(d => 
          !d.isEmpty && d.date && d.date.toISOString().split('T')[0] === dateNormalisee.toISOString().split('T')[0]
        );
        
        if (dayIndex !== -1) {
          newCalendarDates[dayIndex].status = 'indisponible'; 
          setCalendarDates(newCalendarDates);
          
          Alert.alert(
            'Journée complète',
            `Aucun créneau disponible pour cette date. La journée est complète.`,
            [
              { 
                text: 'OK', 
                onPress: () => {
                  setShowCalendarModal(false);
                }
              }
            ]
          );
        }
        return;
      }
      const nouvellesPrestations = [...selectedPrestations];
      
      nouvellesPrestations[prestationIndex] = {
        ...nouvellesPrestations[prestationIndex],
        selectedDate: dateNormalisee,
        selectedTime: null,
        intervenantsDisponiblesCount: hasIntervenantsAvailable ? 1 : 0
      };
      
      setSelectedPrestations(nouvellesPrestations);
      setShowCalendarModal(false);

      const prestation = nouvellesPrestations[prestationIndex];
      const intervenant = prestation.intervenant;

      let disponibilites = [];

      if (intervenant) {
        let employeIdParam = '';
        if (intervenant.type === 'prestataire') {
          employeIdParam = 'prestataire';
        } else {
          employeIdParam = intervenant.id.toString();
        }

        const queryParams = new URLSearchParams({
          prestataire_id: id_prestataire,
          employe_id: employeIdParam,
          date: dateNormalisee.toISOString().split('T')[0],
          duree_minutes: prestation.temps.toString()
        });

        const response = await fetch(
          `http://192.168.1.68:3000/api/verifier-disponibilite-intervenant-complet?${queryParams}`,
          { timeout: 8000 }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'disponible') {
            disponibilites = await fetchDisponibilitesIntervenantSpecifique(
              intervenant.id,
              intervenant.type,
              dateNormalisee,
              prestation.temps
            );
          }
        }
      } else {
        disponibilites = await fetchDisponibilitesGlobales(
          dateNormalisee, 
          prestation.temps, 
          prestation.categorie
        );
      }

      const timeSlots = disponibilites.map(creneau => ({
        start: creneau.heure,
        end: creneau.heure_fin,
        isAvailable: true
      }));
      
      nouvellesPrestations[prestationIndex] = {
        ...nouvellesPrestations[prestationIndex],
        availableTimes: timeSlots
      };
      
      setSelectedPrestations(nouvellesPrestations);
      
      await refiltrerTousLesCreneaux(nouvellesPrestations);
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter la sélection de date');
    } finally {
      setIsLoading(false);
    }
  };

  const debugStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      for (const key of keys) {
        await AsyncStorage.getItem(key);
      }
      
      const specificKeys = ['userData', 'userId', 'userRole', 'clientId', 'id', 'user'];
      for (const key of specificKeys) {
        await AsyncStorage.getItem(key);
      }
      
    } catch (error) {
    }
  };

  useEffect(() => {
    const refiltrerAuto = async () => {
      const hasSelectedTimes = selectedPrestations.some(p => p.selectedTime);
      
      if (hasSelectedTimes) {
        await refiltrerTousLesCreneaux(selectedPrestations);
      }
    };
    
    refiltrerAuto();
  }, [selectedPrestations.length]);

  useEffect(() => {
    debugStorage();
  }, []);

  useEffect(() => {
    loadIntervenants();
    fetchJoursFermes(id_prestataire);
  }, [id_prestataire]);

  useEffect(() => {
    if (showCalendarModal && currentEditingPrestationIndex !== null) {
      generateCalendarWithAvailability(selectedMonth, currentEditingPrestationIndex);
    }
  }, [selectedMonth, showCalendarModal, currentEditingPrestationIndex]);

  const renderDetailsDateEtCreneau = (presta, index) => {
    return (
      <View style={styles.detailsDateCreneauContainer}>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => openCalendar(index)}
        >
          <Icon name="calendar" size={20} color="#152747" />
          <View style={styles.calendarButtonContent}>
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
            
          </View>

        </TouchableOpacity>

        {presta.selectedDate && renderTimeSlotsForPrestation(presta, index)}
      </View>
    );
  };

  const renderPrestationSelectionnee = (presta, index) => (
    <View key={`selected-${presta.id_prestation}-${index}`} style={styles.prestationItem}>
      <View style={styles.prestationInfo}>
        <View style={styles.prestationHeader}>
          <Text style={styles.prestationTitle}>{presta.titre}</Text>
          {selectedPrestations.length > 1 && (
            <TouchableOpacity 
              style={styles.supprimerButton}
              onPress={() => supprimerPrestation(index)}
            >
              <Icon name="times" size={16} color="#152747" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.prestationDetails}>
          {presta.prix} € • {formatDuration(presta.temps)} • {presta.categorie || 'Non catégorisé'}
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.intervenantSelection,
            !presta.intervenant && styles.intervenantNotSelected
          ]}
          onPress={() => openIntervenantModal(index)}
        >
{presta.intervenant ? (
  <View style={styles.intervenantSelected}>
    <View style={styles.intervenantInfo}>
      <Icon name="user" size={14} color="#152747" />
      <Text style={styles.intervenantSelectedText}>
        {presta.intervenant.prenom} {presta.intervenant.nom}
      </Text>
    </View>
  </View>
) : (
  <View style={styles.intervenantNotSelected}>
    <Icon name="user-plus" size={14} color="#152747" />
    <Text style={styles.intervenantNotSelectedText}>
      Choisir un intervenant
    </Text>
  </View>
)}
        </TouchableOpacity>

        {renderDetailsDateEtCreneau(presta, index)}
      </View>
    </View>
  );

  const prixTotal = selectedPrestations.reduce((total, presta) => total + parseFloat(presta.prix), 0);
  const dureeTotale = selectedPrestations.reduce((total, presta) => total + presta.temps, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Confirmer votre rendez-vous</Text>
        <Text style={styles.headerSubtitle}>
          {selectedPrestations.some(p => p.intervenant && p.selectedDate && p.selectedTime) 
            ? `${selectedPrestations.filter(p => p.intervenant && p.selectedDate && p.selectedTime).length} prestation(s) complète(s)`
            : 'Sélectionnez intervenant, date et créneau pour chaque prestation'
          }
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vos prestations</Text>
            <Text style={styles.prestationsSummary}>
              {selectedPrestations.length} prestation(s) • {renderDuréeTotale()} • {prixTotal.toFixed(2)}€
            </Text>
          </View>

          <View style={styles.prestationsList}>
            {selectedPrestations.map((presta, index) => renderPrestationSelectionnee(presta, index))}
          </View>

          {renderAjouterPrestationButton()}
          
          {renderCategoriesEtPrestations()}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.confirmButton,
              (!selectedPrestations.every(p => p.intervenant && p.selectedDate && p.selectedTime)) && styles.buttonDisabled
            ]}
            onPress={handleConfirmation}
            disabled={!selectedPrestations.every(p => p.intervenant && p.selectedDate && p.selectedTime)}
          >
            <Text style={styles.confirmButtonText}>
              Confirmer ({prixTotal.toFixed(2)}€)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderCalendarModal()}

<Modal
  visible={showIntervenantModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowIntervenantModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.intervenantModal}>
      <View style={styles.modalHeader}>
        <View style={styles.modalTitleContainer}>
          <Text style={styles.modalTitle}>Choisir un intervenant</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowIntervenantModal(false)}
          style={styles.closeModalButton}
        >
          <Icon name="times" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        {isLoadingIntervenants ? (
          <View style={styles.modalLoading}>
            <ActivityIndicator size="large" color="#152747" />
            <Text style={styles.modalLoadingText}>
              {currentPrestationIndex !== null && selectedPrestations[currentPrestationIndex]?.selectedDate 
                ? 'Chargement des intervenants disponibles...' 
                : 'Chargement des intervenants...'
              }
            </Text>
          </View>
        ) : filteredIntervenants.length === 0 ? (
          <View style={styles.noIntervenantsContainer}>
            <Icon name="exclamation-triangle" size={40} color="#DDD" />
            <Text style={styles.noIntervenantsText}>
              {currentPrestationIndex !== null && selectedPrestations[currentPrestationIndex]?.selectedDate 
                ? 'Aucun intervenant disponible' 
                : 'Aucun intervenant trouvé'
              }
            </Text>
            <Text style={styles.noIntervenantsSubText}>
              {currentPrestationIndex !== null && selectedPrestations[currentPrestationIndex]?.selectedDate 
                ? `Aucun intervenant de la catégorie "${selectedPrestations[currentPrestationIndex]?.categorie}" n'est disponible pour cette date` 
                : 'Aucun intervenant ne correspond à la catégorie de cette prestation'
              }
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.intervenantSectionTitle}>
              {currentPrestationIndex !== null && selectedPrestations[currentPrestationIndex]?.selectedDate 
                ? `Intervenants disponibles (${filteredIntervenants.length})`
                : `Intervenants disponibles (${filteredIntervenants.length})`
              }
            </Text>
            
            {filteredIntervenants.map((intervenant) => (
              <TouchableOpacity
                key={`intervenant-${intervenant.id}-${intervenant.type}`}
                style={styles.intervenantOption}
                onPress={() => handleIntervenantSelect(intervenant)}
              >
                <View style={styles.intervenantOptionContent}>
                  <Icon name="user" size={20} color="#152747" />
                  <View style={styles.intervenantOptionInfo}>
                    <Text style={styles.intervenantOptionName}>
                      {intervenant.prenom} {intervenant.nom}
                    </Text>
                    {currentPrestationIndex !== null && selectedPrestations[currentPrestationIndex]?.selectedDate && (
                      <Text style={styles.intervenantDisponibleBadge}>
                        ✅ Disponible ce jour
                      </Text>
                    )}
                  </View>
                </View>
                <Icon name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.closeIntervenantModalButton}
        onPress={() => setShowIntervenantModal(false)}
      >
        <Text style={styles.closeIntervenantModalText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>  
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#152747',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 25,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  prestationsList: {
    marginBottom: 20,
  },
  prestationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 18,
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  prestationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#152747',
    flex: 1,
    lineHeight: 22,
  },
  prestationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  intervenantSelection: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    backgroundColor: '#fafafa',
  },
  intervenantNotSelected: {
    borderColor: '#152747',
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
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
  intervenantType: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#152747',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
    overflow: 'hidden',
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
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    marginTop: 15,
  },
  calendarButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#152747',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  timeSlotsContainer: {
    marginTop: 10,
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
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSlotSelected: {
    backgroundColor: '#152747',
    borderColor: '#152747',
  },
  timeSlotDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  timeSlotEndText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  noSlotsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noSlotsText: {
    fontSize: 15,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  noSlotsSubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  noAvailableSlots: {
    alignItems: 'center',
    padding: 30,
  },
  footer: {
    flexDirection: 'row',
    padding: 25,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#152747',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fafafa',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152747',
    marginTop: 20,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 15,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#152747',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(21, 39, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  calendarNavArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#152747',
  },
  intervenantIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#152747',
  },
  intervenantIndicatorText: {
    marginLeft: 8,
    color: '#152747',
    fontWeight: '500',
    fontSize: 14,
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
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  calendarToday: {
    borderColor: '#152747',
    borderWidth: 2,
  },
  calendarDaySelected: {
    borderColor: '#152747',
    borderWidth: 3,
    backgroundColor: '#f0f4f8',
  },
  calendarDayFerme: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  calendarDayIndisponible: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  calendarDayDisponible: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarDayTextDisabled: {
    color: '#666',
  },
  calendarTodayText: {
    color: '#152747',
    fontWeight: 'bold',
  },
  calendarIndicator: {
    fontSize: 10,
    marginTop: 2,
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
    borderTopColor: '#e0e0e0',
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
  },
  legendDisponible: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  legendIndisponible: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
  },
  legendFerme: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  closeCalendarButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#152747',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeCalendarButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  intervenantModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#152747',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
    marginTop: 4,
  },
  closeModalButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
    padding: 15,
  },
  modalLoading: {
    alignItems: 'center',
    padding: 40,
  },
  modalLoadingText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  intervenantSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  intervenantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  intervenantOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  intervenantOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  intervenantOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 2,
  },
  intervenantOptionType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  intervenantOptionCategorie: {
    fontSize: 12,
    color: '#888',
  },
  intervenantDisponibleBadge: {
    fontSize: 11,
    color: '#152747',
    fontWeight: '500',
    marginTop: 4,
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  noIntervenantsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noIntervenantsText: {
    fontSize: 15,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  noIntervenantsSubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 18,
  },
  closeIntervenantModalButton: {
    backgroundColor: '#152747',
    padding: 16,
    alignItems: 'center',
  },
  closeIntervenantModalText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#152747',
    lineHeight: 18,
  },
  prestataireBadge: {
    color: '#152747',
    fontWeight: '600',
    fontSize: 12,
  },
  ajouterPrestationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#152747',
    marginTop: 10,
    marginBottom: 15,
  },
  ajouterPrestationButtonText: {
    color: '#152747',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  categoriesContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    fontSize: 14,
  },
  categorieSection: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  categorieHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#152747',
  },
  prestationsList: {
    paddingLeft: 5,
  },
  prestationAjoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
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
    fontSize: 13,
    color: '#666',
  },
  prestationAjoutDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    lineHeight: 16,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  prestationsSummary: {
    paddingTop: 50,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modifierIntervenantButton: {
    backgroundColor: '#152747',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  modifierIntervenantText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dateTimeInfoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#152747',
  },
  dateTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#152747',
    fontWeight: '500',
  },
  dateTimeActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  modifyDateTimeButton: {
    backgroundColor: '#152747',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modifyDateTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsDateCreneauContainer: {
    marginTop: 15,
  },
  detailsDateCreneauHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsDateCreneauTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#152747',
    marginLeft: 6,
  },
  detailsDateText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  detailsCreneauText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  modifierDateCreneauButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#152747',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modifierDateCreneauText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  timeSlotsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152747',
    marginBottom: 10,
  },
  selectedDateTimeDetails: {
    marginTop: 15,
    padding: 16,
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#152747',
  },
  supprimerButton: {
    padding: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
  modalTitleContainer: {
    flex: 1,
  },
  debugInfo: {
    marginTop: 5,
  },
  calendarDayPast: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.5,
  },
  
  calendarDayTextDisabled: {
    color: '#999',
  },
  
  legendPast: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },

  calendarButtonContent: {
    flex: 1,
    marginLeft: 12,
  },

  intervenantsDisponiblesBadge: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  hasIntervenantsBadge: {
    color: '#28a745',
    backgroundColor: '#d4edda',
  },

  noIntervenantsBadge: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
  },

  noIntervenantsAlert: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  noIntervenantsAlertText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },

  reservedSlotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },

  reservedSlotsInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
});

export default ConfirmationPrestation;