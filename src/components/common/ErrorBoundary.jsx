import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ShrimpMate Web ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center p-6 font-sans text-[#0B1C30]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-lg p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#BA1A1A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base font-bold text-[#0B1C30]">
                Giao diện gặp sự cố hiển thị đột xuất
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                {this.state.error?.message || 'Đã xảy ra lỗi không mong muốn trong quá trình kết xuất SCADA.'}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Tải lại ứng dụng</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
