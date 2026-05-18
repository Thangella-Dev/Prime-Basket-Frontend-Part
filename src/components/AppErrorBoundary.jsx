import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Prime Basket page render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          style={{
            padding: "clamp(32px, 5vw, 56px) 18px",
          }}
        >
          <div
            style={{
              maxWidth: 680,
              margin: "0 auto",
              padding: "28px 24px",
              borderRadius: 28,
              border: "1px solid rgba(191, 219, 254, 0.9)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,248,255,0.98))",
              boxShadow: "0 28px 54px rgba(15, 23, 42, 0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                margin: "0 auto 14px",
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                background: "linear-gradient(135deg, #1d5ba0, #44c4d4)",
                boxShadow: "0 18px 32px rgba(29, 91, 160, 0.22)",
                fontSize: 22,
              }}
            >
              <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
            </div>
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "clamp(1.34rem, 2vw, 1.75rem)",
                fontWeight: 900,
                color: "#163a63",
              }}
            >
              This section needs a quick refresh
            </h2>
            <p
              style={{
                margin: "0 0 18px",
                color: "#64748b",
                fontSize: "0.98rem",
                lineHeight: 1.65,
              }}
            >
              We hit an unexpected UI error while loading this view. Refreshing the app
              usually restores everything immediately.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                minWidth: 170,
                minHeight: 48,
                padding: "0 18px",
                border: "none",
                borderRadius: 16,
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                background: "linear-gradient(135deg, #1d5ba0, #2f77d2)",
                boxShadow: "0 16px 28px rgba(29, 91, 160, 0.2)",
              }}
            >
              Refresh app
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
