import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';

const API_URL = 'http://192.168.1.68:3000';
const { width } = Dimensions.get('window');

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [filteredPrestations, setFilteredPrestations] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceOrder, setPriceOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [mapHtml, setMapHtml] = useState('');
  const [isWebViewReady, setIsWebViewReady] = useState(false);

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
    white: '#FFFFFF'
  };

  const cityCoordinates = {
    'paris': { lat: 48.8566, lng: 2.3522 },
    'lyon': { lat: 45.7640, lng: 4.8357 },
    'marseille': { lat: 43.2965, lng: 5.3698 },
    'toulouse': { lat: 43.6047, lng: 1.4442 },
    'nice': { lat: 43.7102, lng: 7.2620 }
  };

  const getCoordinatesForCity = (cityName) => {
    if (!cityName) return cityCoordinates['paris'];
    
    const normalizedCity = cityName.toLowerCase().trim();
    
    for (const [key, coords] of Object.entries(cityCoordinates)) {
      if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.02,
          lng: coords.lng + (Math.random() - 0.5) * 0.02
        };
      }
    }
    
    return {
      lat: 48.8566 + (Math.random() - 0.5) * 0.1,
      lng: 2.3522 + (Math.random() - 0.5) * 0.1
    };
  };

  const generateMapHtml = (prestationsList) => {
    const prestationsWithAddress = prestationsList.filter(
      item => item.ville_entreprise
    );

    if (prestationsWithAddress.length === 0) {
      const defaultHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body, html { margin: 0; padding: 0; height: 100%; }
            .container { 
              height: 100%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              background: #f8faff;
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .message { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="message">
              <h3>📍 Aucune entreprise à afficher</h3>
              <p>Sélectionnez une catégorie pour voir les entreprises sur la carte</p>
            </div>
          </div>
        </body>
        </html>
      `;
      setMapHtml(defaultHtml);
      return;
    }

    let centerLat = 48.8566;
    let centerLng = 2.3522;
    
    if (prestationsWithAddress.length > 0) {
      const firstCity = prestationsWithAddress[0].ville_entreprise;
      const coords = getCoordinatesForCity(firstCity);
      centerLat = coords.lat;
      centerLng = coords.lng;
    }

    const markers = prestationsWithAddress.map((item, index) => {
      const coords = getCoordinatesForCity(item.ville_entreprise);
      const color = index % 10;
      
      return {
        position: coords,
        title: item.nom_entreprise || 'Entreprise',
        label: (index + 1).toString(),
        info: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #152747;">${item.nom_entreprise || 'Entreprise'}</h3>
            <p style="margin: 0 0 6px 0; color: #666; font-size: 13px;">
              <strong>📍</strong> ${item.ville_entreprise}
            </p>
            <p style="margin: 0 0 8px 0; color: #333; font-size: 14px;">
              ${item.titre || 'Prestation'}
            </p>
            ${item.prix ? `
              <p style="margin: 0 0 10px 0; color: #152747; font-weight: bold; font-size: 16px;">
                ${parseFloat(item.prix).toFixed(2)} €
              </p>
            ` : ''}
            <button onclick="window.ReactNativeWebView.postMessage('OPEN_${item.id_prestataire}')" 
              style="background: #152747; color: white; border: none; padding: 8px 16px; 
                     border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%;">
              Voir les détails
            </button>
          </div>
        `
      };
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          #map { height: 100%; width: 100%; }
          .gm-style .gm-style-iw-c { padding: 0; border-radius: 8px; }
          .gm-style .gm-style-iw-d { overflow: hidden !important; }
          .gm-style-iw button[title="Close"] { display: none !important; }
        </style>
        <script>
          let map;
          let markers = [];
          
          function initMap() {
            const center = { lat: ${centerLat}, lng: ${centerLng} };
            
            map = new google.maps.Map(document.getElementById('map'), {
              zoom: 12,
              center: center,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                {
                  "featureType": "poi",
                  "elementType": "labels",
                  "stylers": [{ "visibility": "off" }]
                }
              ]
            });
            
            ${markers.map((marker, index) => `
              const marker${index} = new google.maps.Marker({
                position: { lat: ${marker.position.lat}, lng: ${marker.position.lng} },
                map: map,
                title: "${marker.title}",
                label: "${marker.label}",
                animation: google.maps.Animation.DROP
              });
              
              const infoWindow${index} = new google.maps.InfoWindow({
                content: \`${marker.info}\`
              });
              
              marker${index}.addListener('click', () => {
                markers.forEach(m => m.infoWindow && m.infoWindow.close());
                infoWindow${index}.open(map, marker${index});
              });
              
              markers.push({ marker: marker${index}, infoWindow: infoWindow${index} });
            `).join('\n')}
            
            if (markers.length > 0) {
              const bounds = new google.maps.LatLngBounds();
              markers.forEach(m => bounds.extend(m.marker.getPosition()));
              map.fitBounds(bounds);
            }
            
            setTimeout(() => {
              window.ReactNativeWebView.postMessage('MAP_READY');
            }, 1000);
          }
          
          function handleError() {
            document.getElementById('map').innerHTML = 
              '<div style="padding: 40px; text-align: center; color: #666;">' +
              '<h3>🌍 Carte non disponible</h3>' +
              '<p>Veuillez vérifier votre connexion internet</p>' +
              '</div>';
          }
        </script>
      </head>
      <body>
        <div id="map"></div>
        <script 
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBz2qkU8t6rYlM9lwW0vLJQ7w8X9yN8o7c&callback=initMap&libraries=places" 
          async 
          defer
          onerror="handleError()"
        ></script>
      </body>
      </html>
    `;

    setMapHtml(html);
  };

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    
    if (message === 'MAP_READY') {
      setIsWebViewReady(true);
    } else if (message.startsWith('OPEN_')) {
      const prestataireId = message.replace('OPEN_', '');
      navigation.navigate('EntrepriseScreen', { 
        id_prestataire: prestataireId 
      });
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data?.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.log('📭 Catégories non disponibles');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchTopCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories-populaires`);
      const data = await response.json();
      
      if (data?.success) {
        setTopCategories(data.data || []);
      }
    } catch (error) {
      console.log('📭 Categories populaires non disponible');
    }
  };

  const fetchPrestations = async (category = null) => {
    setLoading(true);
    try {
      const categoryToUse = category || selectedCategory;
      if (!categoryToUse) {
        setPrestations([]);
        setFilteredPrestations([]);
        setMapHtml('');
        return;
      }

      let url = `${API_URL}/prestations?categorie=${encodeURIComponent(categoryToUse)}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (priceOrder) {
        url += `&sortByPrice=${priceOrder}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data?.prestations) {
        setPrestations(data.prestations);
        setFilteredPrestations(data.prestations);
        
        if (viewMode === 'map') {
          generateMapHtml(data.prestations);
        }
      }
    } catch (error) {
      console.log('📭 Aucune prestation trouvée:', error.message);
      setPrestations([]);
      setFilteredPrestations([]);
      setMapHtml('');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (selectedCategory) {
      fetchPrestations();
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    await fetchPrestations(category);
  };

  const applyFilters = () => {
    fetchPrestations();
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceOrder('');
    setSearchQuery('');
    setPrestations([]);
    setFilteredPrestations([]);
    setMapHtml('');
    setShowFilterModal(false);
  };

  const renderPrestationItem = ({ item }) => {
    const nextTwoDays = getNextTwoDays();
    
    return (
      <TouchableOpacity 
        style={[styles.prestationItem, { backgroundColor: COLORS.white }]}
        onPress={() => navigation.navigate('EntrepriseScreen', { 
          id_prestataire: item.id_prestataire 
        })}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: item.image_entreprise || 'https://via.placeholder.com/150' }} 
          style={styles.prestationImage} 
          defaultSource={{ uri: 'https://via.placeholder.com/150' }}
        />
        
        <View style={styles.prestationContent}>
          <View style={styles.businessHeader}>
            <Text style={[styles.businessName, { color: COLORS.text }]}>
              {item.nom_entreprise || 'Salon'}
            </Text>
            {item.prix && (
              <Text style={[styles.price, { color: COLORS.primary }]}>
                {parseFloat(item.prix).toFixed(2)} €
              </Text>
            )}
          </View>
          
          <Text style={[styles.prestationTitle, { color: COLORS.text }]}>
            {item.titre || 'Prestation'}
          </Text>
          
          {item.description && (
            <Text style={[styles.description, { color: COLORS.textSecondary }]}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.addressContainer}>
            <Icon name="map-marker" size={14} color={COLORS.textSecondary} />
            <Text style={[styles.address, { color: COLORS.textSecondary }]}>
              {`${item.adresse_entreprise || ''}, ${item.ville_entreprise || ''}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            {item.temps && (
              <View style={styles.durationBadge}>
                <Icon name="clock-o" size={12} color={COLORS.primary} />
                <Text style={styles.durationText}>
                  {item.temps} min
                </Text>
              </View>
            )}
          </View>

          <View style={styles.availabilityContainer}>
            <Text style={[styles.availabilityTitle, { color: COLORS.text }]}>
              Prochaines disponibilités
            </Text>
            <View style={styles.calendarContainer}>
              {nextTwoDays.map((day, index) => (
                <View key={index} style={[styles.dayContainer, { backgroundColor: COLORS.surface }]}>
                  <Text style={[styles.dayText, { color: COLORS.primary }]}>{day.day}</Text>
                  <Text style={[styles.dateText, { color: COLORS.text }]}>{day.date}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getNextTwoDays = () => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();
    const result = [];
    
    for (let i = 1; i <= 2; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      result.push({
        day: days[nextDay.getDay()],
        date: `${nextDay.getDate()}/${nextDay.getMonth() + 1}`
      });
    }
    
    return result;
  };

  useEffect(() => {
    if (viewMode === 'map' && filteredPrestations.length > 0) {
      setIsWebViewReady(false);
      generateMapHtml(filteredPrestations);
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'map' && filteredPrestations.length > 0) {
      setIsWebViewReady(false);
      generateMapHtml(filteredPrestations);
    }
  }, [filteredPrestations]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      fetchTopCategories();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.primary }]}>
          Prestations
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: COLORS.surface }]}>
        <Icon name="search" size={16} color={COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchBar, { color: COLORS.text }]}
          placeholder="Rechercher une prestation..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity 
          onPress={() => setShowFilterModal(true)} 
          style={[styles.filterButton, { backgroundColor: COLORS.primary }]}
        >
          <Icon name="sliders" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'list' && [styles.viewToggleButtonActive, { backgroundColor: COLORS.primary }]
          ]}
          onPress={() => setViewMode('list')}
        >
          <Icon 
            name="list" 
            size={16} 
            color={viewMode === 'list' ? COLORS.white : COLORS.textSecondary} 
          />
          <Text style={[
            styles.viewToggleText,
            viewMode === 'list' && styles.viewToggleTextActive
          ]}>
            Liste
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'map' && [styles.viewToggleButtonActive, { backgroundColor: COLORS.primary }]
          ]}
          onPress={() => setViewMode('map')}
        >
          <Icon 
            name="map" 
            size={16} 
            color={viewMode === 'map' ? COLORS.white : COLORS.textSecondary} 
          />
          <Text style={[
            styles.viewToggleText,
            viewMode === 'map' && styles.viewToggleTextActive
          ]}>
            Carte
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
            Chargement en cours...
          </Text>
        </View>
      ) : (
        <>
          {topCategories.length > 0 && viewMode === 'list' && (
            <>
              <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                Catégories populaires
              </Text>
              
              {loadingCategories ? (
                <View style={styles.categoriesLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                    Chargement des catégories...
                  </Text>
                </View>
              ) : (
                <View style={styles.categoriesContainer}>
                  {topCategories.map((category, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleCategorySelect(category.nom)}
                      style={[
                        styles.categoryItem,
                        { backgroundColor: COLORS.surface },
                        selectedCategory === category.nom && [
                          styles.selectedCategory, 
                          { backgroundColor: COLORS.primary }
                        ]
                      ]}
                    >
                      <Text style={[
                        styles.categoryText,
                        { color: COLORS.text },
                        selectedCategory === category.nom && styles.selectedCategoryText
                      ]}>
                        {category.nom}
                      </Text>
                      <View style={[
                        styles.categoryCount,
                        selectedCategory === category.nom && styles.selectedCategoryCount
                      ]}>
                        <Text style={[
                          styles.categoryCountText,
                          selectedCategory === category.nom && styles.selectedCategoryCountText
                        ]}>
                          {category.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {viewMode === 'list' ? (
            <FlatList
              data={filteredPrestations}
              renderItem={renderPrestationItem}
              keyExtractor={(item) => `${item.id_prestation}-${item.id_prestataire}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                !loading && (
                  <View style={styles.emptyContainer}>
                    <Icon 
                      name={selectedCategory ? "search" : "folder-open"} 
                      size={48} 
                      color={COLORS.textTertiary} 
                    />
                    <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                      {selectedCategory 
                        ? 'Aucune prestation trouvée pour cette catégorie' 
                        : topCategories.length === 0 
                          ? 'Aucune catégorie disponible pour le moment' 
                          : 'Sélectionnez une catégorie pour afficher les prestations'
                      }
                    </Text>
                  </View>
                )
              }
            />
          ) : (
            <View style={styles.mapContainer}>
              <WebView
                source={{ html: mapHtml }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onMessage={handleWebViewMessage}
                onLoadEnd={() => setIsWebViewReady(true)}
                onError={(error) => {
                  console.log('WebView error:', error);
                  setIsWebViewReady(true);
                }}
                renderLoading={() => (
                  <View style={styles.mapLoadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
                      Chargement de la carte...
                    </Text>
                  </View>
                )}
              />
              
              {isWebViewReady && filteredPrestations.length > 0 && (
                <View style={styles.mapInstructions}>
                  <View style={styles.instructionsContent}>
                    <Icon name="info-circle" size={16} color={COLORS.white} />
                    <Text style={styles.instructionsText}>
                      Cliquez sur un marqueur pour voir les détails de l'entreprise
                    </Text>
                  </View>
                </View>
              )}
              
              {filteredPrestations.length > 0 && (
                <View style={styles.mapCounter}>
                  <View style={styles.counterContent}>
                    <Icon name="building" size={14} color={COLORS.white} />
                    <Text style={styles.counterText}>
                      {filteredPrestations.length} entreprise{filteredPrestations.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]}>Filtres</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="times" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: COLORS.text }]}>
                Trier par prix
              </Text>
              
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setPriceOrder(priceOrder === 'asc' ? '' : 'asc')}
              >
                <Icon 
                  name={priceOrder === 'asc' ? 'check-circle' : 'circle-o'} 
                  size={20} 
                  color={priceOrder === 'asc' ? COLORS.primary : COLORS.textTertiary} 
                />
                <Text style={[styles.filterOptionText, { color: COLORS.text }]}>
                  Prix croissant
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setPriceOrder(priceOrder === 'desc' ? '' : 'desc')}
              >
                <Icon 
                  name={priceOrder === 'desc' ? 'check-circle' : 'circle-o'} 
                  size={20} 
                  color={priceOrder === 'desc' ? COLORS.primary : COLORS.textTertiary} 
                />
                <Text style={[styles.filterOptionText, { color: COLORS.text }]}>
                  Prix décroissant
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.resetButton, { borderColor: COLORS.border }]}
                onPress={resetFilters}
              >
                <Text style={[styles.resetButtonText, { color: COLORS.textSecondary }]}>
                  Réinitialiser
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.applyButton, { backgroundColor: COLORS.primary }]}
                onPress={applyFilters}
              >
                <Text style={[styles.applyButtonText, { color: COLORS.white }]}>
                  Appliquer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewToggleButtonActive: {
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoriesLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EDF7',
    gap: 8,
  },
  selectedCategory: {
    borderColor: '#152747',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  categoryCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
  },
  selectedCategoryCount: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  selectedCategoryCountText: {
    color: '#FFFFFF',
  },
  prestationItem: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EDF7',
    overflow: 'hidden',
    shadowColor: '#152747',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prestationImage: {
    width: '100%',
    height: 160,
  },
  prestationContent: {
    padding: 20,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
  },
  prestationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  address: {
    fontSize: 14,
    fontWeight: '400',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A6D00',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EDF7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#152747',
  },
  availabilityContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FF',
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  calendarContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dayContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  webview: {
    flex: 1,
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  mapInstructions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(21, 39, 71, 0.9)',
    borderRadius: 8,
    padding: 10,
  },
  instructionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  mapCounter: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(21, 39, 71, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 39, 71, 0.4)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  filterSection: {
    padding: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '400',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EDF7',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CategoriesScreen;