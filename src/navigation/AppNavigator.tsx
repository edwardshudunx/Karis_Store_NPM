import React from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen    from '../screens/DashboardScreen';
import CashFlowScreen     from '../screens/CashFlowScreen';
import StockScreen        from '../screens/StockScreen';
import OfflineSalesScreen from '../screens/OfflineSalesScreen';
import UploadOmsetScreen  from '../screens/UploadOmsetScreen';
import SettingsScreen     from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

// ─── Konten Custom Drawer ─────────────────────────────
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#0f172a' }}>
      {/* Header Drawer */}
      <View className="px-5 pt-4 pb-6 border-b border-slate-700/50">
        <View className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/50 items-center justify-center mb-3">
          <Ionicons name="storefront" size={24} color="#2dd4bf" />
        </View>
        <Text className="text-white text-xl font-bold">Karis Store</Text>
        <Text className="text-teal-400 text-xs mt-0.5">Sistem Informasi Penjualan</Text>
      </View>

      <View className="pt-2">
        <DrawerItemList {...props} />
      </View>

      {/* Footer */}
      <View className="px-4 mt-4 py-4 border-t border-slate-700/50">
        <Text className="text-slate-600 text-xs text-center">v1.0.0 — React Native + Expo</Text>
        <Text className="text-slate-700 text-xs text-center mt-0.5">Offline First · SQLite</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// ─── Main Navigator ───────────────────────────────────
export default function AppNavigator() {
  const screenOptions = ({ route }: any) => ({
    headerStyle: { backgroundColor: '#0f172a', elevation: 0, shadowOpacity: 0 },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
    drawerStyle: { backgroundColor: '#0f172a', width: 280 },
    drawerActiveTintColor: '#2dd4bf',
    drawerInactiveTintColor: '#94a3b8',
    drawerActiveBackgroundColor: '#2dd4bf15',
    drawerLabelStyle: { fontWeight: '600' as const, marginLeft: -8 },
    drawerIcon: ({ color, size }: { color: string; size: number }) => {
      const icons: Record<string, string> = {
        Dashboard: 'home',
        'Penjualan Offline': 'car',
        'Arus Kas': 'wallet',
        'Stok Gudang': 'cube',
        'Upload Omset': 'cloud-upload',
        'Pengaturan': 'settings',
      };
      return <Ionicons name={(icons[route.name] ?? 'ellipse') as any} size={size} color={color} />;
    },
  });

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={screenOptions}
    >
      <Drawer.Screen name="Dashboard"         component={DashboardScreen} />
      <Drawer.Screen name="Penjualan Offline" component={OfflineSalesScreen} />
      <Drawer.Screen name="Arus Kas"          component={CashFlowScreen} />
      <Drawer.Screen name="Stok Gudang"       component={StockScreen} />
      <Drawer.Screen name="Upload Omset"      component={UploadOmsetScreen} />
      <Drawer.Screen name="Pengaturan"        component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
