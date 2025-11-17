import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from 'react-query';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'MedSentinel Dashboard' }} />
        <Stack.Screen name="map" options={{ title: 'Outbreak Risk Map' }} />
        <Stack.Screen name="predictions" options={{ title: 'Forecasts' }} />
        <Stack.Screen name="logistics" options={{ title: 'Logistics' }} />
      </Stack>
    </QueryClientProvider>
  );
}
