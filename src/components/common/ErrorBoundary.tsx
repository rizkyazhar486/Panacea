import React, { Component, type ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
}

interface State {
  readonly hasError: boolean;
  readonly error: Error | null;
}

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
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "#020617",
          color: "#F8FAFC",
          minHeight: "200px",
          borderRadius: 12,
          border: "1px solid #1E293B",
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#38BDF8", marginBottom: 8 }}>
            PanaceaOS Recovery Shield
          </h2>
          <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16, maxWidth: 440, lineHeight: 1.5 }}>
            An unexpected rendering anomaly was safely isolated. Clinical telemetry remains uncompromised.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              backgroundColor: "#10B981",
              color: "#052E16",
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Restore Viewport
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
