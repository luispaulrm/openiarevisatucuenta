import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center text-brand-text p-4">
          <div className="bg-brand-secondary p-8 rounded-lg shadow-lg text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-400 mb-4">¡Ups! Algo salió mal.</h1>
            <p className="text-brand-light mb-4">La aplicación encontró un error inesperado que impidió su funcionamiento. Esto es común en dispositivos móviles si los archivos son muy grandes o hay un problema de red.</p>
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-brand-cyan text-sm">Detalles del error</summary>
              <p className="text-xs text-gray-400 mt-2 font-mono bg-brand-primary p-3 rounded overflow-auto">
                {this.state.error?.toString()}
              </p>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-cyan hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;