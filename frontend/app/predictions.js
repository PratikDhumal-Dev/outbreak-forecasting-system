import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from 'react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { apiClient } from '../src/services/api';

export default function PredictionsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    'predictions-list',
    () => apiClient.get('/predictions?limit=50&sort=forecastDate'),
    {
      refetchInterval: 120000, // Refetch every 2 minutes
    }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      case 'critical':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Disease Forecasts</Text>
          <Text style={styles.subtitle}>AI-powered outbreak predictions</Text>
        </View>

        {isLoading && !data && (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading predictions...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Error loading predictions</Text>
          </View>
        )}

        {data?.data?.data?.map((prediction) => (
          <View key={prediction._id} style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <View>
                <Text style={styles.regionText}>{prediction.region}</Text>
                <Text style={styles.districtText}>{prediction.district}</Text>
              </View>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: getRiskColor(prediction.riskLevel) },
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {prediction.riskLevel.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.predictionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disease:</Text>
                <Text style={styles.detailValue}>{prediction.disease}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Predicted Cases:</Text>
                <Text style={styles.detailValue}>{prediction.predictedCases}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Risk Score:</Text>
                <Text style={styles.detailValue}>
                  {Math.round(prediction.riskScore * 100)}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Confidence:</Text>
                <Text style={styles.detailValue}>
                  {Math.round(prediction.confidence * 100)}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Forecast Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(prediction.forecastDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {data?.data?.data?.length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.noDataText}>No predictions available</Text>
          </View>
        )}
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
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  predictionCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  regionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  districtText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  predictionDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
