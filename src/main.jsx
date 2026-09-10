import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class RenderErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <pre style={{ padding: 24, color: "#b42318", whiteSpace: "pre-wrap" }}>{this.state.error.stack || this.state.error.message}</pre>;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><RenderErrorBoundary><App /></RenderErrorBoundary></React.StrictMode>,
);

