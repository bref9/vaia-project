import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.68:3000';

const MesRendezVous = ({ userSession, navigation }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('a-venir');

  // Palette de couleurs minimaliste et élégante
  const COLORS = {
    primary: '#152747',
    primaryLight: '#2A4A7D',
    accent: '#3A6BBD',
    background: '#FFFFFF',
    surface: '#F8FAFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E8EDF7',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    white: '#FFFFFF'
  };

  // Fonction optimisée pour récupérer les réservations
  const fetchReservations = async () => {
    try {
      setRefreshing(true);
      
      // Vérifier que userSession existe et a un id
      if (!userSession || !userSession.id) {
        setReservations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Utiliser l'ID de la session
      const response = await fetch(`${API_URL}/api/rendez-vous-client/${userSession.id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setReservations(result.data || []);
      } else {
        setReservations([]);
      }
      
      setLoading(false);
      setRefreshing(false);
      
    } catch (error) {
      Alert.alert(
        'Erreur de connexion',
        'Impossible de charger vos rendez-vous. Vérifiez votre connexion.',
        [{ text: 'OK' }]
      );
      
      setReservations([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [userSession]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  // Fonction simplifiée pour annuler une réservation
  const handleAnnulation = async (idReservation) => {
    try {
      Alert.alert(
        'Annuler le rendez-vous',
        'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
        [
          { 
            text: 'Non', 
            style: 'cancel' 
          },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: async () => {
              try {
                // Utiliser uniquement l'endpoint qui existe
                const response = await fetch(`${API_URL}/api/rendez-vous/${idReservation}/annuler`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                });

                if (response.ok) {
                  const result = await response.json();
                  
                  Alert.alert('Succès', 'Réservation annulée avec succès');
                  
                  // Rafraîchir la liste
                  fetchReservations();
                } else {
                  const errorText = await response.text();
                  
                  // Essayer de parser l'erreur JSON
                  let errorMessage = 'Impossible d\'annuler la réservation';
                  try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                  } catch (e) {
                    // Ce n'est pas du JSON
                  }
                  
                  Alert.alert('Erreur', errorMessage);
                }

              } catch (error) {
                Alert.alert(
                  'Erreur de connexion', 
                  'Impossible de se connecter au serveur. Veuillez réessayer.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  };

  // Navigation vers les détails
  const voirDetailsReservation = (reservation) => {
    navigation.navigate('DetailsReservation', {
      reservation: reservation,
      prestataireId: reservation.prestataire?.id || reservation.entreprise?.id_prestataire || '8'
    });
  };

  // Fonction pour filtrer les réservations
  const filtrerReservations = () => {
    const maintenant = new Date();
    const aujourdhui = maintenant.toISOString().split('T')[0];
    const heureActuelle = maintenant.toTimeString().substring(0, 5);

    return reservations.filter(reservation => {
      // Vérifier si la réservation est annulée (annulee = 1)
      const estAnnulee = reservation.annulee === 1 || reservation.annulee === true;
      
      // Pour l'onglet "annules", ne montrer que les annulées
      if (activeTab === 'annules') {
        return estAnnulee;
      }

      // Pour les autres onglets, exclure les annulées
      if (estAnnulee) {
        return false;
      }

      const dateReservation = reservation.date;
      const heureReservation = reservation.heureDebut?.substring(0, 5) || '00:00';

      if (activeTab === 'a-venir') {
        // À venir : date future OU date d'aujourd'hui avec heure future
        return (dateReservation > aujourdhui) || 
               (dateReservation === aujourdhui && heureReservation >= heureActuelle);
      } else {
        // Passés : date passée OU date d'aujourd'hui avec heure passée
        return (dateReservation < aujourdhui) || 
               (dateReservation === aujourdhui && heureReservation < heureActuelle);
      }
    });
  };

  // Compter les réservations pour chaque onglet
  const compterReservations = (type) => {
    const maintenant = new Date();
    const aujourdhui = maintenant.toISOString().split('T')[0];
    const heureActuelle = maintenant.toTimeString().substring(0, 5);

    return reservations.filter(reservation => {
      // Vérifier si la réservation est annulée (annulee = 1)
      const estAnnulee = reservation.annulee === 1 || reservation.annulee === true;
      
      // Pour l'onglet "annules", ne compter que les annulées
      if (type === 'annules') {
        return estAnnulee;
      }

      // Pour les autres onglets, exclure les annulées
      if (estAnnulee) {
        return false;
      }

      const dateReservation = reservation.date;
      const heureReservation = reservation.heureDebut?.substring(0, 5) || '00:00';

      if (type === 'a-venir') {
        return (dateReservation > aujourdhui) || 
               (dateReservation === aujourdhui && heureReservation >= heureActuelle);
      } else {
        return (dateReservation < aujourdhui) || 
               (dateReservation === aujourdhui && heureReservation < heureActuelle);
      }
    }).length;
  };

  // Fonctions de formatage
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatHeure = (timeString) => {
    return timeString?.substring(0, 5) || '';
  };

  const getStatusColor = (statut, annulee) => {
    if (annulee) return COLORS.error;
    if (statut === 'reservé' || statut === 'confirmé') return COLORS.success;
    if (statut === 'terminé') return COLORS.primary;
    return COLORS.warning;
  };

  const getStatusText = (statut, annulee) => {
    if (annulee) return 'Annulé';
    if (statut === 'reservé' || statut === 'confirmé') return 'Confirmé';
    if (statut === 'terminé') return 'Terminé';
    return 'En attente';
  };

  // Messages pour les états vides
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'a-venir':
        return {
          title: 'Aucun rendez-vous à venir',
          subtitle: 'Vous n\'avez pas encore de rendez-vous programmé',
          icon: 'calendar-outline'
        };
      case 'passes':
        return {
          title: 'Aucun rendez-vous passé',
          subtitle: 'Vos rendez-vous passés apparaîtront ici',
          icon: 'time-outline'
        };
      case 'annules':
        return {
          title: 'Aucun rendez-vous annulé',
          subtitle: 'Vous n\'avez annulé aucun rendez-vous',
          icon: 'close-circle-outline'
        };
      default:
        return {
          title: 'Aucun rendez-vous',
          subtitle: 'Vous n\'avez pas encore de rendez-vous',
          icon: 'calendar-outline'
        };
    }
  };

  // Filtrer les réservations pour l'affichage
  const reservationsFiltrees = filtrerReservations();
  const emptyMessage = getEmptyMessage();

  // Affichage pendant le chargement
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
          Chargement de vos rendez-vous...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* En-tête minimaliste */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.primary }]}>Mes Rendez-vous</Text>
        <View style={styles.headerBadge}></View>
      </View>

      {/* Sélecteur d'onglets élégant */}
      <View style={styles.tabContainer}>
        {[
          { key: 'a-venir', label: 'À venir', icon: 'time-outline' },
          { key: 'passes', label: 'Passés', icon: 'checkmark-done-outline' },
          { key: 'annules', label: 'Annulés', icon: 'close-outline' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.activeTab, { borderBottomColor: COLORS.primary }]
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.key ? COLORS.primary : COLORS.textTertiary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? COLORS.primary : COLORS.textTertiary }
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabCounter,
              activeTab === tab.key && { backgroundColor: COLORS.primary }
            ]}>
              <Text style={styles.tabCounterText}>
                {compterReservations(tab.key)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu des onglets */}
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          reservationsFiltrees.length === 0 && styles.emptyScrollContent
        ]}
        showsVerticalScrollIndicator={false}
      >
        {reservationsFiltrees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.surface }]}>
              <Ionicons 
                name={emptyMessage.icon} 
                size={40} 
                color={COLORS.primary} 
              />
            </View>
            <Text style={[styles.emptyText, { color: COLORS.text }]}>
              {emptyMessage.title}
            </Text>
            <Text style={[styles.emptySubtext, { color: COLORS.textSecondary }]}>
              {emptyMessage.subtitle}
            </Text>
          </View>
        ) : (
          reservationsFiltrees.map((reservation) => {
            const estAnnulee = reservation.annulee === 1 || reservation.annulee === true;
            
            return (
              <TouchableOpacity 
                key={reservation.id} 
                style={[
                  styles.reservationCard,
                  { backgroundColor: COLORS.white },
                  estAnnulee && styles.annuleCard
                ]}
                onPress={() => voirDetailsReservation(reservation)}
                activeOpacity={0.9}
              >
                {/* En-tête de la carte */}
                <View style={styles.cardHeader}>
                  <View style={styles.prestationInfo}>
                    <Text style={[styles.prestationTitle, { color: COLORS.text }]}>
                      {reservation.prestation?.titre || 'Prestation'}
                    </Text>
                    <Text style={[styles.priceText, { color: COLORS.primary }]}>
                      {parseFloat(reservation.prestation?.prix || 0).toFixed(2)} €
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: getStatusColor(reservation.statut, estAnnulee) + '15',
                        borderColor: getStatusColor(reservation.statut, estAnnulee)
                      },
                    ]}
                  >
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(reservation.statut, estAnnulee) }
                    ]}>
                      {getStatusText(reservation.statut, estAnnulee)}
                    </Text>
                  </View>
                </View>

                {/* Informations principales */}
{/* Informations principales */}
<View style={styles.cardContent}>
  <View style={styles.infoRow}>
    <View style={styles.infoItem}>
      <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
      <Text style={[styles.infoLabel, { color: COLORS.text }]}>
        {reservation.entreprise?.nom || 
         (reservation.prestataire ? 
           `${reservation.prestataire.prenom} ${reservation.prestataire.nom}` : 
           'Salon')}
      </Text>
    </View>
  </View>

  <View style={styles.infoRow}>
    <View style={styles.infoItem}>
      <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
      <Text style={[styles.infoLabel, { color: COLORS.text }]}>
        {formatDate(reservation.date)}
      </Text>
    </View>

    <View style={styles.infoItem}>
      <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
      <Text style={[styles.infoLabel, { color: COLORS.text }]}>
        {formatHeure(reservation.heureDebut)}
      </Text>
    </View>
  </View>

  {/* Intervenant - Afficher soit l'employé, soit le prestataire */}
  {reservation.employe ? (
    // Si un employé est assigné, afficher l'employé
    <View style={styles.intervenantContainer}>
      <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
      <Text style={[styles.intervenantText, { color: COLORS.textSecondary }]}>
        Avec {reservation.employe.prenom} {reservation.employe.nom}
      </Text>
    </View>
  ) : reservation.prestataire ? (
    // Si pas d'employé mais qu'il y a un prestataire, afficher le prestataire
    <View style={styles.intervenantContainer}>
      <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
      <Text style={[styles.intervenantText, { color: COLORS.textSecondary }]}>
        Avec {reservation.prestataire.prenom} {reservation.prestataire.nom}
      </Text>
    </View>
  ) : null}

  {/* Commentaire */}
  {reservation.commentaire && (
    <View style={styles.commentContainer}>
      <Text style={[styles.commentText, { color: COLORS.textSecondary }]}>
        {reservation.commentaire}
      </Text>
    </View>
  )}
</View>

                {/* Actions */}
                <View style={styles.cardFooter}>
                  {activeTab === 'a-venir' && 
                   !estAnnulee && 
                   reservation.statut !== 'terminé' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAnnulation(reservation.id);
                      }}
                    >
                      <Ionicons name="close-outline" size={16} color={COLORS.error} />
                      <Text style={[styles.cancelButtonText, { color: COLORS.error }]}>
                        Annuler
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => voirDetailsReservation(reservation)}
                  >
                    <Text style={[styles.detailsButtonText, { color: COLORS.primary }]}>
                      Voir détails
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '400',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: '#152747',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF7',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabCounter: {
    backgroundColor: '#E8EDF7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
  },
  tabCounterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  reservationCard: {
    marginHorizontal: 24,
    marginVertical: 6,
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    borderColor: '#E8EDF7',
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  annuleCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  prestationInfo: {
    flex: 1,
  },
  prestationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  employeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  employeText: {
    fontSize: 13,
    fontWeight: '400',
  },
  commentContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FF',
  },
  commentText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
    prestataireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  prestataireText: {
    fontSize: 13,
    fontWeight: '400',
  },
  employeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  employeText: {
    fontSize: 13,
    fontWeight: '400',
  },

    intervenantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  intervenantText: {
    fontSize: 13,
    fontWeight: '400',
  },

});

export default MesRendezVous;