"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface CanvasErrorBoundaryProps {
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Liveblocks canvas connection failed.", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-base px-6 text-center">
          <div>
            <p className="font-medium text-copy-primary">
              Unable to connect to the collaborative canvas.
            </p>
            <p className="mt-2 text-sm text-copy-muted">
              Refresh the page to try again.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
