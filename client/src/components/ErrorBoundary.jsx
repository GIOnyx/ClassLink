import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // You could also log to an external service here
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Attempt to extract useful info from the error object
      let errorText = '';
      try {
        if (this.state.error) {
          if (typeof this.state.error === 'string') errorText = this.state.error;
          else if (this.state.error.message) errorText = this.state.error.message;
          else errorText = JSON.stringify(this.state.error, Object.getOwnPropertyNames(this.state.error), 2);
        }
      } catch (e) {
        errorText = String(this.state.error);
      }

      return (
        <div style={{ padding: 40 }}>
          <h2 style={{ color: '#b00020' }}>Something went wrong</h2>
          <div style={{ whiteSpace: 'pre-wrap', marginTop: 12, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #eee' }}>
            <strong>Error:</strong>
            <div>{errorText || 'No error message available'}</div>
            {this.state.info?.componentStack && (
              <>
                <hr />
                <strong>Stack:</strong>
                <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}>{this.state.info.componentStack}</div>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
