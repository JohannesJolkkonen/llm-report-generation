import React from 'react';


interface PdfPreviewProps {
    iframeSrc: string;
    defaultSrc: string;
    variationsGenerated: boolean;
    pageNumber: number;
  }

const PdfPreview: React.FC<PdfPreviewProps> = ({ iframeSrc, defaultSrc, variationsGenerated, pageNumber }) => {
    const currentSrc = variationsGenerated ? iframeSrc : defaultSrc;
    const hideNavSrc = currentSrc ? `${currentSrc}#toolbar=0&navpanes=0` : '';
  
    return (
      <div className="pdf-preview">
        <div className="pdf-title" style={{
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold'
         }}>
            Page {pageNumber}
        </div>
        {currentSrc ? (
          <iframe
            src={hideNavSrc}
            width="100%"
            height="1000px"
            style={{ border: 'none' }}
            title="PDF Preview"
          />
        ) : (
          <div>No PDF to display</div>
        )}
      </div>
    );
  };
  

export default PdfPreview;