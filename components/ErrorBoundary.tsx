
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white border-[8px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">💥</div>
              <div>
                <h1 className="font-comic text-5xl text-red-600 uppercase tracking-wide">
                  CRASH!
                </h1>
                <p className="font-comic text-xl text-gray-700">
                  Something went wrong in the multiverse!
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-gray-100 border-4 border-black p-4 mb-6 font-mono text-sm overflow-auto max-h-64">
                <div className="text-red-600 font-bold mb-2">Error:</div>
                <div className="text-gray-800 mb-4">{this.state.error.toString()}</div>

                {this.state.errorInfo && (
                  <>
                    <div className="text-red-600 font-bold mb-2">Component Stack:</div>
                    <pre className="text-gray-600 text-xs whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="flex-1 comic-btn bg-blue-500 text-white text-xl px-8 py-4 hover:bg-blue-600"
              >
                RESTART APP
              </button>
              <button
                onClick={() => window.location.href = 'https://github.com/anthropics/claude-code/issues'}
                className="flex-1 comic-btn bg-gray-300 text-black text-xl px-8 py-4 hover:bg-gray-400"
              >
                REPORT BUG
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              ERROR_CODE: MULTIVERSE_COLLAPSED
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
