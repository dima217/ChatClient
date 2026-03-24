import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "./src/hooks/useAuth";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";

export default function App() {
  const { user, loading, error, login, register, logout, clearError } =
    useAuth();

  if (loading && !user) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingText}>Loading...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen
          onLogin={login}
          onRegister={register}
          onClearError={clearError}
          error={error}
          loading={loading}
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <SystemBars style="light" />
      <ChatScreen user={user} onLogout={logout} />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#030712",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9ca3af",
  },
});
