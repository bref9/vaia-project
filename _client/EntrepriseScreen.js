import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const EntrepriseScreen = ({ route, navigation }) => {
  const { id_prestataire } = route.params;
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('rdv');
  const [expandedCategories, setExpandedCategories] = useState({});

  const PRIMARY_COLOR = '#152747';
  const GRAY_TEXT = '#718096';
  const BORDER_COLOR = '#E2E8F0';

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h${remainingMinutes}`;
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleOpenMaps = (address, city) => {
    const fullAddress = `${address}, ${city}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?q=${encodedAddress}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    }
  };

  const fetchEntreprise = async () => {
    try {
      const response = await fetch(`http://192.168.1.68:3000/EntrepriseScreen/entreprise?id_prestataire=${id_prestataire}`);
      const data = await response.json();
      if (data) {
        setEntreprise({
          ...data,
          prestations: Object.entries(data.prestations || {}).reduce((acc, [category, prestations]) => {
            acc[category] = prestations.map((presta, index) => ({
              ...presta,
              id: presta.id || `${category}-${index}`
            }));
            return acc;
          }, {})
        });
        
        const initialExpanded = {};
        Object.keys(data.prestations || {}).forEach(cat => {
          initialExpanded[cat] = false;
        });
        setExpandedCategories(initialExpanded);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'entreprise:', error);
    }
  };

  useEffect(() => {
    fetchEntreprise();
  }, [id_prestataire]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleChoosePrestation = (prestation) => {
    if (!prestation.categorie) {
      const loadPrestationComplete = async () => {
        try {
          const response = await fetch(
            `http://192.168.1.68:3000/api/prestations-confirmation?id_prestataire=${id_prestataire}&prestation_id=${prestation.id_prestation || prestation.id}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.prestations && data.prestations.length > 0) {
              const prestationComplete = data.prestations[0];
              const salonData = {
                id_prestataire: id_prestataire,
                nom_salon: entreprise.nom_salon,
                adresse: entreprise.adresse,
                ville: entreprise.ville,
                id_entreprise: entreprise.id_entreprise
              };
              
              navigation.navigate('ConfirmationPrestation', {
                prestation: prestationComplete,
                entreprise: salonData
              });
            }
          }
        } catch (error) {
          console.error('Erreur:', error);
        }
      };
      
      loadPrestationComplete();
    } else {
      const salonData = {
        id_prestataire: id_prestataire,
        nom_salon: entreprise.nom_salon,
        adresse: entreprise.adresse,
        ville: entreprise.ville,
        id_entreprise: entreprise.id_entreprise
      };
      
      navigation.navigate('ConfirmationPrestation', {
        prestation: prestation,
        entreprise: salonData
      });
    }
  };

  const renderPrestationItem = (prestation) => {
    if (!prestation.id) return null;
    
    return (
      <TouchableOpacity 
        key={`prestation-${prestation.id}`} 
        style={styles.prestationCard}
        onPress={() => handleChoosePrestation(prestation)}
        activeOpacity={0.7}
      >
        <View style={styles.prestationContent}>
          <Text style={styles.prestationTitle}>{prestation.titre}</Text>
          
          {prestation.description && (
            <Text style={styles.prestationDescription} numberOfLines={2}>
              {prestation.description}
            </Text>
          )}
          
          <View style={styles.prestationFooter}>
            <View style={styles.timeContainer}>
              <Icon name="clock-o" size={12} color={GRAY_TEXT} />
              <Text style={styles.prestationTime}>
                {formatDuration(prestation.temps)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.priceContainer}>
            <Text style={styles.prestationPrice}>{prestation.prix} €</Text>
          </View>
          
          <Icon name="chevron-right" size={16} color={GRAY_TEXT} style={styles.arrowIcon} />
        </View>
      </TouchableOpacity>
    );
  };

  if (!entreprise) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: entreprise.image || 'https://via.placeholder.com/300' }} 
          style={styles.businessImage} 
        />
        <View style={styles.imageOverlay} />
        
        <View style={styles.businessHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{entreprise.nom_salon}</Text>
            
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={14} color="#FFF" />
              <Text style={styles.locationText}>
                {entreprise.adresse}, {entreprise.ville}
              </Text>
            </View>
            
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {[
          { id: 'rdv', label: 'Prendre RDV', icon: 'calendar' },
          { id: 'avis', label: 'Avis', icon: 'star' },
          { id: 'apropos', label: 'À-propos', icon: 'info-circle' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon 
              name={tab.icon} 
              size={14} 
              color={activeTab === tab.id ? PRIMARY_COLOR : GRAY_TEXT} 
              style={styles.tabIcon}
            />
            <Text style={[
              styles.tabText, 
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'rdv' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="scissors" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Prestations</Text>
            </View>
            
            {Object.entries(entreprise.prestations || {}).map(([category, prestations]) => (
              <View key={`category-${category}`} style={styles.categoryCard}>
                <TouchableOpacity 
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                >
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.prestationCount}>{prestations.length} prestations</Text>
                  </View>
                  <Icon 
                    name={expandedCategories[category] ? 'chevron-up' : 'chevron-down'} 
                    size={12} 
                    color={GRAY_TEXT} 
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

        {activeTab === 'avis' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="comments" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Avis clients</Text>
            </View>
            
            {entreprise.avis && entreprise.avis.length > 0 ? (
              entreprise.avis.map((avis, index) => (
                <View key={`avis-${index}`} style={styles.avisCard}>
                  <View style={styles.avisHeader}>
                    <View style={styles.avatar}>
                      <Icon name="user" size={20} color="#2A4365" />
                    </View>
                    <View style={styles.avisInfo}>
                      <Text style={styles.avisAuthor}>
                        {avis.client_prenom} {avis.client_nom?.charAt(0)}.
                      </Text>
                      <View style={styles.avisMeta}>
                        <Text style={styles.avisDate}>
                          {new Date(avis.date_avis).toLocaleDateString('fr-FR')}
                        </Text>
                        <View style={styles.avisRating}>
                          {[...Array(5)].map((_, i) => (
                            <Icon 
                              key={`star-${i}`}
                              name={i < avis.note ? 'star' : 'star-o'} 
                              size={12} 
                              color="#FFD700" 
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.avisText}>{avis.commentaire}</Text>
                  
                  {avis.reponse && (
                    <View style={styles.reponseCard}>
                      <Text style={styles.reponseLabel}>Réponse du salon</Text>
                      <Text style={styles.reponseText}>{avis.reponse}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="comment-o" size={48} color={BORDER_COLOR} />
                <Text style={styles.emptyStateText}>Aucun avis pour le moment</Text>
                <Text style={styles.emptyStateSubText}>Soyez le premier à noter ce salon</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'apropos' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="building" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Informations</Text>
            </View>
            
            {entreprise.numero && (
              <TouchableOpacity 
                style={styles.infoCard}
                onPress={() => handleCall(entreprise.numero)}
              >
                <View style={styles.infoIconContainer}>
                  <Icon name="phone" size={16} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{entreprise.numero}</Text>
                </View>
                <Icon name="chevron-right" size={12} color={GRAY_TEXT} style={styles.infoChevron} />
              </TouchableOpacity>
            )}
            
            {entreprise.adresse && (
              <TouchableOpacity 
                style={styles.infoCard}
                onPress={() => handleOpenMaps(entreprise.adresse, entreprise.ville)}
              >
                <View style={styles.infoIconContainer}>
                  <Icon name="map-marker" size={16} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>{entreprise.adresse}</Text>
                  <Text style={styles.infoSubValue}>{entreprise.ville}</Text>
                </View>
                <Icon name="chevron-right" size={12} color={GRAY_TEXT} style={styles.infoChevron} />
              </TouchableOpacity>
            )}
            
            {entreprise.informations && (
              <View style={styles.aboutCard}>
                <Text style={styles.aboutText}>{entreprise.informations}</Text>
              </View>
            )}
            
            <View style={styles.horairesCard}>
              <Text style={styles.horairesTitle}>Horaires d'ouverture</Text>
              {entreprise.horaires && Object.entries(entreprise.horaires).map(([jour, horaire]) => (
                <View key={`horaire-${jour}`} style={styles.horaireRow}>
                  <Text style={styles.horaireJour}>{jour.charAt(0).toUpperCase() + jour.slice(1)}</Text>
                  
                  {horaire.ouvert ? (
                    <View style={styles.horaireDetails}>
                      {horaire.pauses && horaire.pauses.length > 0 ? (
                        <>
                          <Text style={styles.horaireText}>
                            {horaire.horaire_ouverture} - {horaire.pauses[0].pause_debut}
                          </Text>
                          <Text style={styles.horaireText}>
                            {horaire.pauses[0].pause_fin} - {horaire.horaire_fermeture}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.horaireText}>
                          {horaire.horaire_ouverture} - {horaire.horaire_fermeture}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.horaireFerme}>Fermé</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E2E8F0',
    borderTopColor: '#152747',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
  },
  header: {
    position: 'relative',
    height: 220,
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 39, 71, 0.6)',
  },
  businessHeader: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginLeft: 6,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
  },
  activeTab: {
    backgroundColor: '#152747',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152747',
    marginLeft: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152747',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  ratingBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  prestationCount: {
    fontSize: 12,
    color: '#718096',
  },
  prestationsList: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 8,
  },
  prestationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  prestationContent: {
    flex: 1,
    marginRight: 12,
  },
  prestationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  prestationDescription: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 16,
    marginBottom: 8,
  },
  prestationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prestationTime: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  prestationPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#152747',
  },
  avisCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avisHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avisInfo: {
    flex: 1,
  },
  avisAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  avisMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avisDate: {
    fontSize: 12,
    color: '#718096',
    marginRight: 12,
  },
  avisRating: {
    flexDirection: 'row',
  },
  avisText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  reponseCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#152747',
  },
  reponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#152747',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reponseText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  infoSubValue: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  infoChevron: {
    marginLeft: 8,
  },
  aboutCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aboutText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },
  horairesCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  horairesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  horaireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  horaireJour: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  horaireDetails: {
    alignItems: 'flex-end',
  },
  horaireText: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
  },
  horaireFerme: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '500',
  },
});

export default EntrepriseScreen;