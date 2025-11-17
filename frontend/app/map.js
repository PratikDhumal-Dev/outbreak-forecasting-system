import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from 'react-query';
import { StatusBar } from 'expo-status-bar';
import { apiClient } from '../src/services/api';

export default function MapScreen() {
  // Fetch predictions for map visualization
  const { data, isLoading, error } = useQuery(
    'map-predictions',
    () => apiClient.get('/predictions?limit=100'),
    {
      refetchInterval: 60000,
    }
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Outbreak Risk Map</Text>
          <Text style={styles.subtitle}>District-level risk visualization</Text>
        </View>

        {isLoading && (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading map data...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Error loading map data</Text>
          </View>
        )}

        {data && (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.placeholderText}>
              Map visualization will be implemented with Mapbox/MapLibre
            </Text>
            <Text style={styles.statsText}>
              {data.data?.data?.length || 0} districts with active predictions
            </Text>
          </View>
        )}

        {/* Risk Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Risk Levels</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Low (0-0.3)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Medium (0.3-0.6)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>High (0.6-0.8)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.legendText}>Critical (0.8-1.0)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  mapPlaceholder: {
    height: 400,
    backgroundColor: '#e5e7eb',
    margin: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  legend: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
