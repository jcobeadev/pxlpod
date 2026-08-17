import { Component, type ReactNode } from "react";

/**
 * Minimal error boundary: renders `fallback` if its subtree throws while
 * rendering. Used to guard the expo-video Start-session tile — on a build that
 * predates the native module, loading it throws, and we fall back to the
 * sprite-sheet tile instead of crashing the Home screen.
 */
export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
