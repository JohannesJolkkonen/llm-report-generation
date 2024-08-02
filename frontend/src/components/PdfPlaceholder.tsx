import React from 'react';
import '../styles/PdfPlaceholder.css';

interface LoadingPlaceholderProps {
  message: string;
}

const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({ message }) => {
  return (
    <div className="loading-placeholder">
      <div className="pdf-loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingPlaceholder;