import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from 'react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { apiClient } from '../src/services/api';

export default function HomeScreen() {
  const router = useRouter();

  // Fetch health status
  const { data: healthData, isLoading: healthLoading } = useQuery(
    'health',
    () => apiClient.get('/health'),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch recent predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery(
    'predictions',
    () => apiClient.get('/predictions?limit=5&riskLevel=high,critical'),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>MedSentinel</Text>
          <Text style={styles.subtitle}>Outbreak Forecasting & Response</Text>
        </View>

        {/* Health Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Status</Text>
          {healthLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <Text style={styles.statusText}>
              {healthData?.data?.status === 'ok' ? '🟢 Online' : '🔴 Offline'}
            </Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/map')}
          >
            <Text style={styles.actionButtonText}>View Risk Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/predictions')}
          >
            <Text style={styles.actionButtonText}>View Forecasts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/logistics')}
          >
            <Text style={styles.actionButtonText}>Logistics Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* High-Risk Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>High-Risk Alerts</Text>
          {predictionsLoading ? (
            <Text style={styles.loadingText}>Loading predictions...</Text>
          ) : predictionsData?.data?.data?.length > 0 ? (
            predictionsData.data.data.map((prediction) => (
              <View key={prediction._id} style={styles.alertCard}>
                <Text style={styles.alertRegion}>{prediction.region}</Text>
                <Text style={styles.alertDisease}>{prediction.disease}</Text>
                <Text style={styles.alertRisk}>
                  Risk: {prediction.riskLevel.toUpperCase()} ({Math.round(prediction.riskScore * 100)}%)
                </Text>
                <Text style={styles.alertCases}>
                  Predicted Cases: {prediction.predictedCases}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No high-risk alerts at this time</Text>
          )}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  statusText: {
    fontSize: 16,
    color: '#059669',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertRegion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  alertDisease: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  alertRisk: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 2,
  },
  alertCases: {
    fontSize: 12,
    color: '#6b7280',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});
