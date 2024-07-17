import React, { useState, useEffect } from 'react';
import './index.css';
import { pdfjs } from 'react-pdf';
import { DocumentContents, Page } from './models/CustomDocument';
import PdfPreview from './components/PdfPreview';
import VariationsPanel from './components/VariationsPanel';
import usePdfGeneration from './hooks/usePdfGeneration';
import { fetchRetrievalData } from './utils/retrievalService';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, number>>({});
  const [documentContents, setDocumentContents] = useState<DocumentContents | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const defaultPage: Page = { pageNumber: 0, tags: [] };
  const defaultDocumentUrl = '/templates/sales_report_full.pdf';

  const {
    pdfBlobs,
    iframeSrc,
    generatePdfVariations,
    getCurrentPdfBlob,
    isLoading: isGeneratingPdf,
    variationsGenerated
  } = usePdfGeneration(documentContents || { pages: [] }, currentPage, selectedVariations);

  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setCurrentPage(prev => Math.max(prev - 1, 0));
      } else if (event.key === 'ArrowRight') {
        setCurrentPage(prev => Math.min(prev + 1, (documentContents?.pages.length || 1) - 1));
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [documentContents?.pages.length]);

  useEffect(() => {
    getCurrentPdfBlob();
  }, [getCurrentPdfBlob]);

  const handleFetchDocument = async () => {
    setIsLoading(true);
    try {
      const fetchedDocument = await fetchRetrievalData(2024, 6);
      setDocumentContents(fetchedDocument);
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="app">
      <h1>Document Preview with Alternatives</h1>
      <div className="content-wrapper">
        <VariationsPanel
          isLoading={isLoading}
          isGeneratingPdf={isGeneratingPdf}
          documentLoaded={!!documentContents}
          setDocumentContents={setDocumentContents}
          currentPageData={documentContents?.pages[currentPage] || defaultPage}
          selectedVariations={selectedVariations}
          setSelectedVariations={setSelectedVariations}
          generateVariations={generatePdfVariations}
          variationsGenerated={variationsGenerated}
        />
        <PdfPreview 
          iframeSrc={iframeSrc} 
          defaultSrc={defaultDocumentUrl}
          variationsGenerated={variationsGenerated}
          pageNumber={currentPage + 1}
        />
      </div>
    </div>
  );
};

export default App;