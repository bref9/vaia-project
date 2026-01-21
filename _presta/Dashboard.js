import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const Dashboard = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [stats, setStats] = useState({
    caJour: 0,
    tauxOccupation: 0,
    nouveauxClients: 0,
    caMensuel: 0,
    caAnnuel: 0,
    reservationsAnnulees: 0,
    montantRemboursements: 0,
    reservationsTotal: 0
  });
  const [prestationsData, setPrestationsData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('');

  // Chargement de la session utilisateur
  const loadUserSession = useCallback(async () => {
    try {
      const sessionString = await AsyncStorage.getItem('userSession');
      if (sessionString) {
        const session = JSON.parse(sessionString);
        setUserSession(session);
      }
    } catch (error) {
      console.error('Erreur chargement session:', error);
    }
  }, []);

  // Chargement des données du dashboard
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const prestataireId = userSession?.id_prestataire || userSession?.id;
      
      if (!prestataireId) {
        throw new Error('ID prestataire non trouvé');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `http://192.168.1.68:3000/api/dashboard-stats/${prestataireId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success) {
        setStats(data.stats || {});
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        throw new Error(data?.error || 'Erreur lors du chargement des données');
      }
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      
      if (error.name !== 'AbortError') {
        Alert.alert(
          'Erreur', 
          `Impossible de charger les données: ${error.message}`,
          [{ text: 'OK' }, { text: 'Réessayer', onPress: () => loadDashboardData(isRefresh) }]
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userSession]);

  // Chargement des données des prestations
  const loadPrestationsData = useCallback(async () => {
    try {
      const prestataireId = userSession?.id_prestataire || userSession?.id;
      
      if (!prestataireId) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `http://192.168.1.68:3000/api/prestations-reservees-par-categorie?id_prestataire=${prestataireId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.success) {
          setPrestationsData(data.categories);
        }
      }
    } catch (error) {
      console.error('Erreur chargement prestations:', error);
    }
  }, [userSession]);

  // Rechargement complet
  const handleRefresh = useCallback(() => {
    loadDashboardData(true);
    loadPrestationsData();
  }, [loadDashboardData, loadPrestationsData]);

  // Effets
  useEffect(() => {
    loadUserSession();
  }, [loadUserSession]);

  useEffect(() => {
    if (userSession) {
      loadDashboardData();
      loadPrestationsData();
    }
  }, [userSession, loadDashboardData, loadPrestationsData]);

  // Calculs mémoïsés
  const calculatedStats = useMemo(() => ({
    tauxAnnulation: stats.reservationsTotal > 0 ? 
      ((stats.reservationsAnnulees / stats.reservationsTotal) * 100).toFixed(1) : 0,
    caMoyenJour: stats.caMensuel > 0 ? Math.round(stats.caMensuel / 30) : 0,
    valeurMoyennePrestation: stats.reservationsTotal > 0 ? 
      Math.round(stats.caMensuel / stats.reservationsTotal) : 0,
    reservationsConfirmees: stats.reservationsTotal - stats.reservationsAnnulees
  }), [stats]);

  // Composants mémoïsés
  const StatCard = React.memo(({ title, value, subtitle, color }) => (
    <View style={[styles.statCard, { borderColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  ));

  const PrestationsChart = React.memo(({ data }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Prestations Réservées</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>Aucune donnée disponible</Text>
          </View>
        </View>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Prestations Réservées</Text>
        
        <View style={styles.chartContent}>
          {data.map((item, index) => {
            const percentage = (item.count / total) * 100;
            return (
              <View key={index} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <View style={[styles.chartDot, { backgroundColor: item.color }]} />
                  <Text style={styles.chartLabel}>{item.categorie}</Text>
                  <Text style={styles.chartPercentage}>{percentage.toFixed(0)}%</Text>
                </View>
                <View style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartFill,
                      { 
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartCount}>{item.count} réservations</Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.chartFooter}>
          <Text style={styles.chartTotal}>{total}</Text>
          <Text style={styles.chartTotalLabel}>réservations</Text>
        </View>
      </View>
    );
  });

  const ReservationsBarChart = React.memo(() => {
    const maxValue = Math.max(calculatedStats.reservationsConfirmees, stats.reservationsAnnulees, 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Réservations du Mois</Text>
        
        <View style={styles.barChartGrid}>
          <View style={styles.barChartColumn}>
            <View style={[styles.barChartBar, { 
              height: `${(calculatedStats.reservationsConfirmees / maxValue) * 60}%`,
              backgroundColor: '#10B981'
            }]} />
            <Text style={styles.barChartLabel}>Confirmées</Text>
            <Text style={styles.barChartValue}>{calculatedStats.reservationsConfirmees}</Text>
          </View>
          
          <View style={styles.barChartColumn}>
            <View style={[styles.barChartBar, { 
              height: `${(stats.reservationsAnnulees / maxValue) * 60}%`,
              backgroundColor: '#EF4444'
            }]} />
            <Text style={styles.barChartLabel}>Annulées</Text>
            <Text style={styles.barChartValue}>{stats.reservationsAnnulees}</Text>
          </View>
          
          <View style={styles.barChartColumn}>
            <View style={[styles.barChartBar, { 
              height: `${(stats.reservationsTotal / maxValue) * 60}%`,
              backgroundColor: '#6366F1'
            }]} />
            <Text style={styles.barChartLabel}>Total</Text>
            <Text style={styles.barChartValue}>{stats.reservationsTotal}</Text>
          </View>
        </View>
      </View>
    );
  });

  // Affichage du loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Tableau de bord</Text>
            {lastUpdate && (
              <Text style={styles.lastUpdate}>Mis à jour à {lastUpdate}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={handleRefresh} 
            disabled={isRefreshing}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshIcon}>
              {isRefreshing ? '⏳' : '↻'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {/* Section Aujourd'hui */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aujourd'hui</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.badgeText}>Jour</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Chiffre d'affaires"
              value={`${stats.caJour}€`}
              color="#10B981"
            />
            <StatCard
              title="Taux occupation"
              value={`${stats.tauxOccupation}%`}
              color="#6366F1"
            />
          </View>
        </View>

        {/* Section Mensuelle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ce mois</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.badgeText}>Mois</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="CA mensuel"
              value={`${stats.caMensuel}€`}
              subtitle={`${calculatedStats.caMoyenJour}€/jour`}
              color="#8B5CF6"
            />
            <StatCard
              title="Nouveaux clients"
              value={stats.nouveauxClients}
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Graphique des prestations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.badgeText}>Analytique</Text>
            </View>
          </View>
          
          <PrestationsChart data={prestationsData} />
        </View>

        {/* Graphique des réservations */}
        <View style={styles.section}>
          <ReservationsBarChart />
        </View>

        {/* Section Annulations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Annulations</Text>
            <View style={[styles.sectionBadge, styles.badgeWarning]}>
              <Text style={styles.badgeText}>Attention</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Annulations"
              value={stats.reservationsAnnulees}
              subtitle={`${calculatedStats.tauxAnnulation}% du total`}
              color="#EF4444"
            />
            <StatCard
              title="Remboursements"
              value={`${stats.montantRemboursements}€`}
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Section Annuelle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Année en cours</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.badgeText}>Année</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="CA annuel"
              value={`${stats.caAnnuel}€`}
              color="#8B5CF6"
            />
            <StatCard
              title="Réservations"
              value={stats.reservationsTotal}
              color="#10B981"
            />
          </View>
        </View>

        {/* Résumé */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Résumé du mois</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valeur moyenne</Text>
              <Text style={styles.summaryValue}>{calculatedStats.valeurMoyennePrestation}€</Text>
              <Text style={styles.summaryDescription}>Par prestation</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Confirmation</Text>
              <Text style={[
                styles.summaryValue, 
                { color: calculatedStats.tauxAnnulation < 15 ? '#10B981' : '#EF4444' }
              ]}>
                {100 - parseFloat(calculatedStats.tauxAnnulation)}%
              </Text>
              <Text style={styles.summaryDescription}>Taux de succès</Text>
            </View>
          </View>
        </View>

        {/* Espace en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// STYLES MODERNES ET MINIMALISTES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '300',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.5,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '400',
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
    color: '#6366F1',
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '400',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  noDataContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  chartContent: {
    gap: 16,
  },
  chartItem: {
    gap: 8,
  },
  chartItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chartPercentage: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  chartBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  chartFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  chartTotal: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  chartTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  barChartGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingHorizontal: 20,
  },
  barChartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barChartBar: {
    width: 36,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    minHeight: 8,
  },
  barChartLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
  },
  barChartValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summarySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  summaryDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default Dashboard;