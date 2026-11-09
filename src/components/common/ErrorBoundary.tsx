import React, { Component, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props { readonly children: ReactNode; }
interface State { readonly hasError: boolean; readonly error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("PanaceaOS SafeCatch — Uncaught UI Error:", error, errorInfo);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>PanaceaOS Recovery Shield</Text>
          <Text style={styles.subtitle}>An unexpected rendering anomaly was safely isolated. Clinical telemetry remains uncompromised.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Restore Viewport</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#020617" },
  title: { fontSize: 20, fontWeight: "800", color: "#38BDF8", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  button: { backgroundColor: "#10B981", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: "#052E16", fontWeight: "700", fontSize: 14 }
});