import React, { useState, useEffect } from 'react';
import './index.css';
import { pdfjs } from 'react-pdf';
import { DocumentContents, Page } from './models/CustomDocument';
import PdfPreview from './components/PdfPreview';
import VariationsPanel from './components/VariationsPanel';
import SelectorMenu from './components/SelectorMenu';
import usePdfGeneration from './hooks/usePdfGeneration';
import PdfPlaceholder from './components/PdfPlaceholder';
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
  const [templatePath, setTemplatePath] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('Media & Electronics');
  const [selectedDate, setSelectedDate] = useState('2024 / 06');
  const [progress, setProgress] = useState<{ [page: number]: number }>({});
  const [isFetchingComplete, setIsFetchingComplete] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfRenderProgress, setPdfRenderProgress] = useState(0);
  const [shouldGeneratePdf, setShouldGeneratePdf] = useState(false);


  const defaultPage: Page = { pageNumber: 0, tags: [] };

  
  const handleReportTypeChange = (reportType: string) => {
    setSelectedReportType(reportType);
    if (reportType === 'Monthly Sales Report') {
      setTemplatePath('temp/sales_report_full.pdf');
    }
    else if (reportType === 'Marketing Plan') {
      setTemplatePath('templates/page_1_mplan.pdf');
    }
    else if (reportType === 'Quarterly Business Review') {
      setTemplatePath('templates/page_1_qbr.pdf');
    }
    else {
      setTemplatePath('');
    }
  };

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
  };

  const handleDateChange = (date: string) => {
    console.log("date", date)
    setSelectedDate(date);
  };


  const {
    pdfBlobs,
    iframeSrc,
    generatePdfVariations,
    getCurrentPdfBlob,
    isLoading: isGeneratingPdf,
    variationsGenerated,
  } = usePdfGeneration(documentContents || { pages: [] }, currentPage, selectedVariations, setPdfRenderProgress);

  const handleFetchAndRender = async () => {
    setIsLoading(true);
    setProgress({});
    setIsFetchingComplete(false);
    setTotalPages(0);
    setPdfRenderProgress(0);
    setShouldGeneratePdf(false);


    const [year, month] = selectedDate.split('/').map(part => part.trim());
    const eventSource = new EventSource(`http://localhost:8000/retrieval?year=${year}&month=${month}&department=${encodeURIComponent(selectedCompany)}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("EventSource message:", data);
    };

    eventSource.addEventListener('init', (event) => {
      const data = JSON.parse(event.data);
      setTotalPages(data.total_pages);
      setProgress(Object.fromEntries([...Array(data.total_pages)].map((_, i) => [i + 1, 0])));
    });
  
    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      console.log("Progress event:", data);
      if (data.page) {
        setProgress(prev => ({
          ...prev,
          [data.page]: (data.tag / data.total_tags) * 100
        }));
      }
    });
  
    eventSource.addEventListener('done', (event) => {
      const data = JSON.parse(event.data) as DocumentContents;
      console.log("EventSource done:", data);
      setDocumentContents(data);

      const initialSelectedVariations: Record<string, number> = {};
      data.pages.forEach(page => {
        page.tags.forEach(tag => {
          initialSelectedVariations[tag.id] = 0;
        });
      });
      setSelectedVariations(initialSelectedVariations);

      setIsLoading(false);
      setIsFetchingComplete(true);
      setShouldGeneratePdf(true);
      eventSource.close();
    });
  
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setIsLoading(false);
      eventSource.close();
    };
  };

  useEffect(() => {
    if (documentContents && isFetchingComplete && shouldGeneratePdf) {
      generatePdfVariations();
      setShouldGeneratePdf(false);
    }
  }, [documentContents, generatePdfVariations, isFetchingComplete, shouldGeneratePdf]);

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

  return (
    <div className="app">
      <SelectorMenu
        documentContents={documentContents}
        selectedVariations={selectedVariations}
        selectedReportType={selectedReportType}
        selectedCompany={selectedCompany}
        selectedDate={selectedDate}
        onReportTypeChange={handleReportTypeChange}
        onCompanyChange={handleCompanyChange}
        onDateChange={handleDateChange}
        onGenerateVariations={handleFetchAndRender}
        isGeneratingPdf={isGeneratingPdf}
        variationsGenerated={variationsGenerated}
      />
      <div className="content-wrapper">
        <VariationsPanel
          isLoading={isLoading}
          isGeneratingPdf={isGeneratingPdf}
          currentPageData={documentContents?.pages[currentPage] || defaultPage}
          selectedVariations={selectedVariations}
          setSelectedVariations={setSelectedVariations}
          handleFetchAndRender={handleFetchAndRender}
          variationsGenerated={variationsGenerated}
          progress={progress}
          totalPages={totalPages}
          pdfRenderProgress={pdfRenderProgress}
        />
        {isLoading || isGeneratingPdf ? (
        <PdfPlaceholder message="Loading PDF preview..." />
        ) : (
          <PdfPreview 
            iframeSrc={iframeSrc} 
            defaultSrc={templatePath}
            variationsGenerated={variationsGenerated}
            pageNumber={currentPage + 1}
          />
        )}
      </div>
    </div>
  );
};


export default App;