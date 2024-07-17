import { useState, useCallback, useEffect } from 'react';
import { DocumentContents } from '../models/CustomDocument';
import { renderAllCombinations, generatePdfKey } from '../utils/pdfUtils';

const usePdfGeneration = (
  contents: DocumentContents,
  currentPage: number,
  selectedVariations: Record<string, number>
) => {
  const [pdfBlobs, setPdfBlobs] = useState<Record<string, Blob>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [variationsGenerated, setVariationsGenerated] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');

  const generatePdfVariations = useCallback(async () => {
    console.log('Generating variations');
    if (variationsGenerated) return;
    setIsLoading(true);
    try {
      const allPdfBlobs = await renderAllCombinations(contents);
      setPdfBlobs(prev => ({ ...prev, ...allPdfBlobs }));
      setVariationsGenerated(true);
    } catch (error) {
      console.error('Error generating variations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contents, variationsGenerated]);
  

  const getCurrentPdfBlob = useCallback(() => {
    const key = generatePdfKey(currentPage + 1, selectedVariations, contents);
    const selectedBlob = pdfBlobs[key];
  
    if (selectedBlob) {
      const blobUrl = URL.createObjectURL(selectedBlob);
      setIframeSrc(blobUrl);
      return blobUrl;
    } else {
      setIframeSrc('');
    }
  
    return null;
  }, [currentPage, selectedVariations, contents, pdfBlobs]);

  useEffect(() => {
    const key = generatePdfKey(currentPage + 1, selectedVariations, contents);
    console.log('Current page:', currentPage);
    console.log('Generated key:', key);
    console.log('Available keys:', Object.keys(pdfBlobs));
    }, [currentPage, selectedVariations, contents, pdfBlobs]);

  return {
    isLoading,
    pdfBlobs,
    iframeSrc,
    generatePdfVariations,
    getCurrentPdfBlob,
    variationsGenerated,
  };
};

export default usePdfGeneration;