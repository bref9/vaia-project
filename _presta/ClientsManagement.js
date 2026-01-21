// ClientsManagement.js - Version simplifiée sans WebView
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const ClientsManagement = ({ route, userSession }) => {
  const prestataireId = route.params?.prestataireId || userSession?.id;

  if (!prestataireId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>ID prestataire non disponible</Text>
        <Text style={styles.errorSubtext}>
          Impossible d'accéder à la gestion des clients. Veuillez vous reconnecter.
        </Text>
      </View>
    );
  }

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  
  // États pour la facturation
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [factureModalVisible, setFactureModalVisible] = useState(false);
  const [factureData, setFactureData] = useState(null);
  const [loadingFacture, setLoadingFacture] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const loadClients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://192.168.1.68:3000/api/v2/clients/list?prestataire_id=${prestataireId}&page=${page}&limit=20&search=${search}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClients(data.data.clients);
        setPagination(data.data.pagination);
      } else {
        Alert.alert('Erreur', data.error || 'Erreur lors du chargement des clients');
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      Alert.alert('Erreur', 'Impossible de charger les clients. Vérifiez la connexion au serveur.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [prestataireId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClients(currentPage, searchQuery);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(1);
    loadClients(1, text);
  };

  const loadClientDetails = async (clientId) => {
    try {
      const response = await fetch(
        `http://192.168.1.68:3000/api/v2/clients/${clientId}/details?prestataire_id=${prestataireId}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedClient(data.data);
        setDetailModalVisible(true);
        setSelectedReservations([]);
        setSelectionMode(false);
      } else {
        Alert.alert('Erreur', data.error || 'Erreur lors du chargement des détails');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du client');
    }
  };

  // Fonction pour basculer la sélection d'une réservation
  const toggleReservationSelection = (reservationId) => {
    setSelectedReservations(prev => {
      if (prev.includes(reservationId)) {
        return prev.filter(id => id !== reservationId);
      } else {
        return [...prev, reservationId];
      }
    });
  };

  // Fonction pour générer une facture pour une réservation
  const genererFactureReservation = async (reservationId) => {
    try {
      setLoadingFacture(true);
      const response = await fetch(
        `http://192.168.1.68:3000/api/v2/factures/reservation/${reservationId}?prestataire_id=${prestataireId}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFactureData(data.data);
        setFactureModalVisible(true);
      } else {
        Alert.alert('Erreur', data.error || 'Erreur lors de la génération de la facture');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de générer la facture');
    } finally {
      setLoadingFacture(false);
    }
  };

  // Fonction pour générer une facture multiple
  const genererFactureMultiple = async () => {
    if (selectedReservations.length === 0) {
      Alert.alert('Aucune sélection', 'Veuillez sélectionner au moins une réservation');
      return;
    }

    try {
      setLoadingFacture(true);
      const response = await fetch(`http://192.168.1.68:3000/api/v2/factures/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_ids: selectedReservations,
          prestataire_id: prestataireId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFactureData(data.data);
        setFactureModalVisible(true);
        setSelectedReservations([]);
        setSelectionMode(false);
      } else {
        Alert.alert('Erreur', data.error || 'Erreur lors de la génération de la facture');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de générer la facture multiple');
    } finally {
      setLoadingFacture(false);
    }
  };

  // Fonction pour partager la facture en texte
  const partagerFacture = async () => {
    try {
      if (!factureData) return;
      
      const isMultiple = factureData.prestations !== undefined;
      
      let message = `FACTURE ${factureData.facture.numero}\n`;
      message += `Date: ${factureData.facture.date_emission}\n\n`;
      message += `PRESTATAIRE:\n`;
      message += `${factureData.prestataire.entreprise}\n`;
      message += `${factureData.prestataire.adresse}\n`;
      message += `${factureData.prestataire.code_postal} ${factureData.prestataire.ville}\n`;
      message += `Tél: ${factureData.prestataire.telephone}\n\n`;
      
      message += `CLIENT:\n`;
      message += `${factureData.client.nom}\n`;
      message += `${factureData.client.adresse}\n`;
      message += `${factureData.client.code_postal} ${factureData.client.ville}\n`;
      message += `Email: ${factureData.client.email}\n`;
      message += `Tél: ${factureData.client.telephone}\n\n`;
      
      message += `DÉTAILS:\n`;
      
      if (isMultiple) {
        message += `Facture multiple (${factureData.prestations.length} prestations)\n`;
        factureData.prestations.forEach((prestation, index) => {
          message += `${index + 1}. ${prestation.nom}\n`;
          message += `   Date: ${prestation.date} à ${prestation.heure}\n`;
          message += `   Intervenant: ${prestation.intervenant}\n`;
          message += `   Montant: ${prestation.prix_ht}€ HT\n\n`;
        });
        message += `RÉCAPITULATIF:\n`;
        message += `Total HT: ${factureData.resume.total_ht}€\n`;
        message += `TVA (${factureData.resume.tva_pourcentage}%): ${factureData.resume.total_tva}€\n`;
        message += `TOTAL TTC: ${factureData.resume.total_ttc}€\n`;
      } else {
        message += `${factureData.prestation.nom}\n`;
        message += `Date: ${factureData.facture.date_prestation} à ${factureData.facture.heure_prestation}\n`;
        message += `Intervenant: ${factureData.prestation.intervenant}\n\n`;
        message += `RÉCAPITULATIF:\n`;
        message += `Total HT: ${factureData.montants.ht}€\n`;
        message += `TVA (${factureData.montants.tva_pourcentage}%): ${factureData.montants.tva}€\n`;
        message += `TOTAL TTC: ${factureData.montants.ttc}€\n`;
      }
      
      message += `\nPayable à réception\n`;
      message += `Facture établie conformément aux articles 289 et 290 du CGI`;
      
      await Share.share({
        message: message,
        title: `Facture ${factureData.facture.numero}`
      });
      
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
  };

  // Fonction pour générer le texte de la facture (pour copier)
  const copierFacture = async () => {
    try {
      if (!factureData) return;
      
      const isMultiple = factureData.prestations !== undefined;
      
      let texte = `================================\n`;
      texte += `        FACTURE\n`;
      texte += `================================\n\n`;
      texte += `Numéro: ${factureData.facture.numero}\n`;
      texte += `Date: ${factureData.facture.date_emission}\n\n`;
      
      texte += `PRESTATAIRE\n`;
      texte += `--------------------------------\n`;
      texte += `${factureData.prestataire.entreprise}\n`;
      texte += `${factureData.prestataire.adresse}\n`;
      texte += `${factureData.prestataire.code_postal} ${factureData.prestataire.ville}\n`;
      texte += `Tél: ${factureData.prestataire.telephone}\n\n`;
      
      texte += `CLIENT\n`;
      texte += `--------------------------------\n`;
      texte += `${factureData.client.nom}\n`;
      texte += `${factureData.client.adresse}\n`;
      texte += `${factureData.client.code_postal} ${factureData.client.ville}\n`;
      texte += `Email: ${factureData.client.email}\n`;
      texte += `Tél: ${factureData.client.telephone}\n\n`;
      
      texte += `DÉTAIL DE LA FACTURE\n`;
      texte += `--------------------------------\n`;
      
      if (isMultiple) {
        factureData.prestations.forEach((prestation, index) => {
          texte += `${index + 1}. ${prestation.nom}\n`;
          texte += `   Date: ${prestation.date} à ${prestation.heure}\n`;
          texte += `   Intervenant: ${prestation.intervenant}\n`;
          texte += `   Montant HT: ${prestation.prix_ht}€\n`;
          if (prestation.description && prestation.description !== 'Aucune description') {
            texte += `   Description: ${prestation.description}\n`;
          }
          texte += `\n`;
        });
      } else {
        texte += `${factureData.prestation.nom}\n`;
        texte += `Date: ${factureData.facture.date_prestation} à ${factureData.facture.heure_prestation}\n`;
        texte += `Intervenant: ${factureData.prestation.intervenant}\n`;
        if (factureData.prestation.description && factureData.prestation.description !== 'Aucune description') {
          texte += `Description: ${factureData.prestation.description}\n`;
        }
        texte += `\n`;
      }
      
      texte += `RÉCAPITULATIF\n`;
      texte += `--------------------------------\n`;
      
      if (isMultiple) {
        texte += `Total HT: ${factureData.resume.total_ht}€\n`;
        texte += `TVA (${factureData.resume.tva_pourcentage}%): ${factureData.resume.total_tva}€\n`;
        texte += `TOTAL TTC: ${factureData.resume.total_ttc}€\n`;
      } else {
        texte += `Total HT: ${factureData.montants.ht}€\n`;
        texte += `TVA (${factureData.montants.tva_pourcentage}%): ${factureData.montants.tva}€\n`;
        texte += `TOTAL TTC: ${factureData.montants.ttc}€\n`;
      }
      
      texte += `\n================================\n`;
      texte += `Mentions légales:\n`;
      texte += `Facture établie conformément aux articles 289 et 290 du CGI\n`;
      texte += `TVA non applicable, article 293 B du CGI\n`;
      texte += `Payable à réception\n`;
      texte += `Document généré le ${new Date().toLocaleDateString('fr-FR')}\n`;
      texte += `================================`;
      
      // Pour copier dans le presse-papier, on utilise Share avec un message
      Alert.alert(
        'Facture formatée',
        'La facture a été formatée. Voulez-vous la partager ?',
        [
          { 
            text: 'Partager', 
            onPress: () => Share.share({
              message: texte,
              title: `Facture ${factureData.facture.numero}`
            })
          },
          { 
            text: 'Afficher', 
            onPress: () => {
              Alert.alert(
                'Facture',
                texte.substring(0, 500) + (texte.length > 500 ? '...' : ''),
                [{ text: 'OK' }]
              );
            }
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
      
    } catch (error) {
      console.error('Erreur copie:', error);
      Alert.alert('Erreur', 'Impossible de copier la facture');
    }
  };

  const renderClientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => loadClientDetails(item.id)}
    >
      <View style={styles.clientHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.prenom?.charAt(0)}{item.nom?.charAt(0)}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={styles.clientContact}>
            {item.mail} • {item.telephone}
          </Text>
        </View>
      </View>
      
      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.statistiques?.total_rdv || 0}</Text>
          <Text style={styles.statLabel}>RDV</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.statistiques?.categories_utilisees || 0}</Text>
          <Text style={styles.statLabel}>Catégories</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statDate}>
            {item.statistiques?.derniere_visite ? 
              new Date(item.statistiques.derniere_visite).toLocaleDateString('fr-FR') : 'Jamais'
            }
          </Text>
          <Text style={styles.statLabel}>Dernière visite</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Clients</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Liste des clients */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des clients...</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal détail client */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectionMode(false);
          setSelectedReservations([]);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '95%', maxHeight: '90%' }]}>
            {selectedClient && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <TouchableOpacity 
                      onPress={() => {
                        setDetailModalVisible(false);
                        setSelectionMode(false);
                        setSelectedReservations([]);
                      }}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                      {selectedClient.informations.prenom} {selectedClient.informations.nom}
                    </Text>
                  </View>
                  
                  {selectedClient.historique && selectedClient.historique.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectionMode(!selectionMode);
                        if (!selectionMode) {
                          setSelectedReservations([]);
                        }
                      }}
                      style={styles.selectModeButton}
                    >
                      <Ionicons 
                        name={selectionMode ? "checkmark-circle" : "document-text"} 
                        size={24} 
                        color={selectionMode ? "#007AFF" : "#666"} 
                      />
                      <Text style={[styles.selectModeText, { color: selectionMode ? "#007AFF" : "#666" }]}>
                        {selectionMode ? "Annuler" : "Facturer"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectionMode && selectedReservations.length > 0 && (
                  <View style={styles.selectionBar}>
                    <Text style={styles.selectionText}>
                      {selectedReservations.length} réservation(s) sélectionnée(s)
                    </Text>
                    <TouchableOpacity 
                      style={styles.generateInvoiceButton}
                      onPress={genererFactureMultiple}
                    >
                      <Ionicons name="receipt" size={20} color="#fff" />
                      <Text style={styles.generateInvoiceText}>Générer facture</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <ScrollView style={styles.detailContainer}>
                  {/* Informations personnelles */}
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{selectedClient.informations.mail}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Téléphone</Text>
                        <Text style={styles.infoValue}>{selectedClient.informations.telephone || 'Non renseigné'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Genre</Text>
                        <Text style={styles.infoValue}>{selectedClient.informations.genre || 'Non renseigné'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Âge</Text>
                        <Text style={styles.infoValue}>
                          {selectedClient.informations.age ? `${selectedClient.informations.age} ans` : 'Non renseigné'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Statistiques */}
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Statistiques</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                          {selectedClient.statistiques_globales.total_rdv}
                        </Text>
                        <Text style={styles.statLabel}>Total RDV</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                          {selectedClient.preferences.length}
                        </Text>
                        <Text style={styles.statLabel}>Catégories</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                          {Math.round(selectedClient.statistiques_globales.chiffre_affaires)}€
                        </Text>
                        <Text style={styles.statLabel}>Dépense totale</Text>
                      </View>
                    </View>
                  </View>

                  {/* Dernières réservations */}
                  <View style={styles.detailSection}>
                    <View style={styles.reservationsHeader}>
                      <Text style={styles.sectionTitle}>Dernières réservations</Text>
                      {selectedClient.historique.length > 0 && (
                        <Text style={styles.reservationCount}>
                          {selectedClient.historique.length} réservation(s)
                        </Text>
                      )}
                    </View>
                    
                    {selectedClient.historique.length === 0 ? (
                      <Text style={styles.noReservationText}>Aucune réservation</Text>
                    ) : (
                      selectedClient.historique.map((reservation) => (
                        <TouchableOpacity 
                          key={reservation.id}
                          style={[
                            styles.reservationItem,
                            selectionMode && styles.reservationItemSelectable,
                            selectedReservations.includes(reservation.id) && styles.reservationItemSelected
                          ]}
                          onPress={() => {
                            if (selectionMode) {
                              toggleReservationSelection(reservation.id);
                            } else {
                              genererFactureReservation(reservation.id);
                            }
                          }}
                          onLongPress={() => {
                            setSelectionMode(true);
                            toggleReservationSelection(reservation.id);
                          }}
                          delayLongPress={500}
                        >
                          {selectionMode && (
                            <View style={styles.selectionIndicator}>
                              <Ionicons 
                                name={selectedReservations.includes(reservation.id) ? "checkmark-circle" : "ellipse-outline"} 
                                size={24} 
                                color={selectedReservations.includes(reservation.id) ? "#007AFF" : "#ccc"} 
                              />
                            </View>
                          )}
                          
                          <View style={styles.reservationContent}>
                            <View style={styles.reservationHeaderRow}>
                              <Text style={styles.reservationDate}>
                                {new Date(reservation.date).toLocaleDateString('fr-FR')}
                              </Text>
                              <Text style={styles.reservationTime}>
                                {reservation.heure_debut}
                              </Text>
                              {!selectionMode && (
                                <TouchableOpacity 
                                  style={styles.invoiceButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    genererFactureReservation(reservation.id);
                                  }}
                                >
                                  <Ionicons name="receipt-outline" size={20} color="#007AFF" />
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={styles.reservationService}>
                              {reservation.prestation.nom}
                            </Text>
                            <Text style={styles.reservationPrice}>
                              {reservation.prestation.prix}€ • {reservation.intervenant.prenom} {reservation.intervenant.nom}
                            </Text>
                            {reservation.commentaire && (
                              <Text style={styles.reservationComment}>
                                📝 {reservation.commentaire}
                              </Text>
                            )}
                            <Text style={styles.reservationStatus}>
                              Statut: {reservation.statut}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal facture */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={factureModalVisible}
        onRequestClose={() => setFactureModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '95%', maxHeight: '90%' }]}>
            {loadingFacture ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Génération de la facture...</Text>
              </View>
            ) : factureData && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Facture {factureData.facture.numero}</Text>
                  <TouchableOpacity onPress={() => setFactureModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.factureContainer}>
                  {/* En-tête de la facture */}
                  <View style={styles.factureHeader}>
                    <View style={styles.factureNumberSection}>
                      <Text style={styles.factureNumberLabel}>FACTURE</Text>
                      <Text style={styles.factureNumber}>{factureData.facture.numero}</Text>
                      <Text style={styles.factureDate}>
                        Date: {factureData.facture.date_emission}
                      </Text>
                    </View>
                    
                    <View style={styles.factureLogo}>
                      <Ionicons name="business" size={50} color="#007AFF" />
                      <Text style={styles.companyName}>
                        {factureData.prestataire.entreprise}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Informations prestataire */}
                  <View style={styles.factureSection}>
                    <Text style={styles.sectionTitle}>PRESTATAIRE</Text>
                    <Text style={styles.factureText}>{factureData.prestataire.entreprise}</Text>
                    <Text style={styles.factureText}>{factureData.prestataire.adresse}</Text>
                    <Text style={styles.factureText}>
                      {factureData.prestataire.code_postal} {factureData.prestataire.ville}
                    </Text>
                    <Text style={styles.factureText}>Tél: {factureData.prestataire.telephone}</Text>
                  </View>

                  {/* Informations client */}
                  <View style={styles.factureSection}>
                    <Text style={styles.sectionTitle}>CLIENT</Text>
                    <Text style={styles.factureText}>{factureData.client.nom}</Text>
                    <Text style={styles.factureText}>{factureData.client.adresse}</Text>
                    <Text style={styles.factureText}>
                      {factureData.client.code_postal} {factureData.client.ville}
                    </Text>
                    <Text style={styles.factureText}>Email: {factureData.client.email}</Text>
                    <Text style={styles.factureText}>Tél: {factureData.client.telephone}</Text>
                  </View>

                  <View style={styles.separator} />

                  {/* Détails des prestations */}
                  <View style={styles.factureSection}>
                    <Text style={styles.sectionTitle}>DÉTAIL DE LA FACTURE</Text>
                    
                    {factureData.prestations ? (
                      // Facture multiple
                      <>
                        <Text style={styles.prestationCount}>
                          {factureData.prestations.length} prestation(s)
                        </Text>
                        {factureData.prestations.map((prestation, index) => (
                          <View key={index} style={styles.prestationItem}>
                            <View style={styles.prestationHeader}>
                              <Text style={styles.prestationName}>
                                {index + 1}. {prestation.nom}
                              </Text>
                              <Text style={styles.prestationPrice}>
                                {prestation.prix_ht}€ HT
                              </Text>
                            </View>
                            <Text style={styles.prestationDetails}>
                              Date: {prestation.date} à {prestation.heure}
                            </Text>
                            <Text style={styles.prestationDetails}>
                              Intervenant: {prestation.intervenant}
                            </Text>
                            {prestation.description !== 'Aucune description' && (
                              <Text style={styles.prestationDescription}>
                                Description: {prestation.description}
                              </Text>
                            )}
                          </View>
                        ))}
                      </>
                    ) : (
                      // Facture simple
                      <View style={styles.prestationItem}>
                        <View style={styles.prestationHeader}>
                          <Text style={styles.prestationName}>
                            {factureData.prestation.nom}
                          </Text>
                          <Text style={styles.prestationPrice}>
                            {factureData.montants.ht}€ HT
                          </Text>
                        </View>
                        <Text style={styles.prestationDetails}>
                          Date: {factureData.facture.date_prestation} à {factureData.facture.heure_prestation}
                        </Text>
                        <Text style={styles.prestationDetails}>
                          Intervenant: {factureData.prestation.intervenant}
                        </Text>
                        {factureData.prestation.description !== 'Aucune description' && (
                          <Text style={styles.prestationDescription}>
                            Description: {factureData.prestation.description}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.separator} />

                  {/* Totaux */}
                  <View style={styles.factureSection}>
                    <Text style={styles.sectionTitle}>RÉCAPITULATIF</Text>
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total HT:</Text>
                      <Text style={styles.totalValue}>
                        {factureData.montants?.ht || factureData.resume?.total_ht}€
                      </Text>
                    </View>
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>
                        TVA ({factureData.montants?.tva_pourcentage || factureData.resume?.tva_pourcentage}%):
                      </Text>
                      <Text style={styles.totalValue}>
                        {factureData.montants?.tva || factureData.resume?.total_tva}€
                      </Text>
                    </View>
                    
                    <View style={[styles.totalRow, styles.totalRowFinal]}>
                      <Text style={styles.totalLabelFinal}>Total TTC:</Text>
                      <Text style={styles.totalValueFinal}>
                        {factureData.montants?.ttc || factureData.resume?.total_ttc}€
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Mentions légales */}
                  <View style={styles.factureSection}>
                    <Text style={styles.legalText}>
                      Facture établie conformément aux articles 289 et 290 du CGI.
                    </Text>
                    <Text style={styles.legalText}>
                      TVA non applicable, article 293 B du CGI.
                    </Text>
                    <Text style={styles.legalText}>
                      Payable à réception.
                    </Text>
                    <Text style={styles.legalDate}>
                      Document généré le {new Date().toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </ScrollView>

                {/* Actions de la facture */}
                <View style={styles.factureActions}>
                  <TouchableOpacity 
                    style={[styles.factureActionButton, styles.shareButton]}
                    onPress={partagerFacture}
                  >
                    <Ionicons name="share-outline" size={20} color="#fff" />
                    <Text style={styles.factureActionText}>Partager</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.factureActionButton, styles.copyButton]}
                    onPress={copierFacture}
                  >
                    <Ionicons name="copy-outline" size={20} color="#fff" />
                    <Text style={styles.factureActionText}>Format texte</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientContact: {
    fontSize: 14,
    color: '#666',
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDate: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  selectModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  selectModeText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  generateInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateInvoiceText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailContainer: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  reservationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationCount: {
    fontSize: 14,
    color: '#666',
  },
  reservationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reservationItemSelectable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
  },
  reservationItemSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  selectionIndicator: {
    marginRight: 12,
    marginLeft: 8,
  },
  reservationContent: {
    flex: 1,
  },
  reservationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reservationDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reservationTime: {
    fontSize: 14,
    color: '#666',
  },
  invoiceButton: {
    padding: 4,
  },
  reservationService: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  reservationPrice: {
    fontSize: 12,
    color: '#666',
  },
  reservationComment: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reservationStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noReservationText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  factureContainer: {
    padding: 16,
  },
  factureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  factureNumberSection: {
    flex: 1,
  },
  factureNumberLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  factureNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  factureDate: {
    fontSize: 14,
    color: '#666',
  },
  factureLogo: {
    alignItems: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  factureSection: {
    marginBottom: 20,
  },
  factureText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  prestationCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  prestationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  prestationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prestationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  prestationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 12,
  },
  prestationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  prestationDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRowFinal: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
    textAlign: 'center',
  },
  legalDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  factureActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  factureActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  copyButton: {
    backgroundColor: '#5856D6',
  },
  factureActionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ClientsManagement;