import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from 'react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { apiClient } from '../src/services/api';

export default function LogisticsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    'logistics-list',
    () => apiClient.get('/logistics?limit=50'),
    {
      refetchInterval: 120000,
    }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
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
          <Text style={styles.title}>Logistics Dashboard</Text>
          <Text style={styles.subtitle}>Stock levels and recommendations</Text>
        </View>

        {isLoading && !data && (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading logistics data...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Error loading logistics data</Text>
          </View>
        )}

        {data?.data?.data?.map((logistics) => (
          <View key={logistics._id} style={styles.logisticsCard}>
            <View style={styles.logisticsHeader}>
              <View>
                <Text style={styles.regionText}>{logistics.region}</Text>
                <Text style={styles.districtText}>{logistics.district}</Text>
              </View>
              {logistics.priority && (
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(logistics.priority) },
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>
                    {logistics.priority.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {logistics.stockLevel && (
              <View style={styles.stockSection}>
                <Text style={styles.sectionTitle}>Stock Levels</Text>
                {Object.entries(logistics.stockLevel).map(([item, quantity]) => (
                  <View key={item} style={styles.stockItem}>
                    <Text style={styles.stockLabel}>{item}:</Text>
                    <Text style={styles.stockValue}>{quantity} units</Text>
                  </View>
                ))}
              </View>
            )}

            {logistics.suggestedAction && (
              <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>Recommended Action</Text>
                <Text style={styles.actionText}>{logistics.suggestedAction}</Text>
                {logistics.actionType && (
                  <Text style={styles.actionType}>
                    Type: {logistics.actionType}
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.lastUpdated}>
              Updated: {new Date(logistics.lastUpdated).toLocaleString()}
            </Text>
          </View>
        ))}

        {data?.data?.data?.length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.noDataText}>No logistics data available</Text>
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
  logisticsCard: {
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
  logisticsHeader: {
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
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stockSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stockLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  actionType: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
