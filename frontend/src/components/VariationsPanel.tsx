import React from 'react';
import { Tag } from '../models/CustomDocument';
import { Page, DocumentContents } from '../models/CustomDocument';
import { fetchRetrievalData } from '../utils/retrievalService';

interface VariationsPanelProps {
    isLoading: boolean;
    isGeneratingPdf: boolean;
    documentLoaded: boolean;
    setDocumentContents: React.Dispatch<React.SetStateAction<DocumentContents | null>>;
    currentPageData: Page;
    selectedVariations: Record<string, number>;
    setSelectedVariations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    generateVariations: () => Promise<void>;
    variationsGenerated: boolean;
  }
  
  const VariationsPanel: React.FC<VariationsPanelProps> = ({
    isLoading,
    isGeneratingPdf,
    documentLoaded,
    setDocumentContents,
    currentPageData,
    selectedVariations,
    setSelectedVariations,
    generateVariations,
    variationsGenerated
  }) => {

    const handleFetchDocument = async () => {
    try {
      const fetchedDocument = await fetchRetrievalData(2024, 6);
      setDocumentContents(fetchedDocument);
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const handleGenerateVariations = async () => {
    if (!variationsGenerated) {
      await generateVariations();
    }
  };

  return (
    <div className="variations-panel">
      <h2>Variations</h2>
      {!documentLoaded && (
        <button onClick={handleFetchDocument} disabled={isLoading || isGeneratingPdf}>
          {isLoading ? 'Fetching...' : 'Fetch Document'}
        </button>
      )} 
      {documentLoaded && !variationsGenerated && (
        <button onClick={handleGenerateVariations} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? 'Generating...' : 'Generate Variations'}
        </button>
      )}
      {documentLoaded && variationsGenerated && (
        currentPageData.tags.map((tag) => (
          <div key={tag.id}>
            <h3>{tag.title}</h3>
            <select
              value={selectedVariations[tag.id] || 0}
              onChange={(e) => setSelectedVariations({
                ...selectedVariations,
                [tag.id]: parseInt(e.target.value)
              })}
            >
              {tag.variations.map((variation, index) => (
                <option key={variation.id} value={index}>
                  {variation.text}
                </option>
              ))}
            </select>
          </div>
        ))
      )}
    </div>
  );
};

export default VariationsPanel;