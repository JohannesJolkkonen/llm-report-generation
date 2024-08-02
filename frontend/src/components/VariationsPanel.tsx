import React, { useState } from 'react';
import { Tag } from '../models/CustomDocument';
import { Page, DocumentContents } from '../models/CustomDocument';
import { fetchRetrievalData } from '../utils/retrievalService';
import LoadingSpinner from './LoadingSpinner';
import '../styles/VariationsPanel.css';
import '../index.css';

interface VariationsPanelProps {
    isLoading: boolean;
    isGeneratingPdf: boolean;
    currentPageData: Page;
    selectedVariations: Record<string, number>;
    setSelectedVariations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    handleFetchAndRender: () => Promise<void>;
    variationsGenerated: boolean;
    progress: { [page: number]: number };
    totalPages: number;
    pdfRenderProgress: number;
  }
  
  const VariationsPanel: React.FC<VariationsPanelProps> = ({
    isLoading,
    isGeneratingPdf,
    currentPageData,
    selectedVariations,
    setSelectedVariations,
    handleFetchAndRender,
    variationsGenerated,
    progress,
    totalPages,
    pdfRenderProgress
  }) => {
    const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({});

    const renderVariationText = (text: string | string[]) => {
      if (Array.isArray(text)) {
        return (
          <ul className="variation-bullet-list">
            {text.map((item, i) => (
              <li key={i} className="variation-bullet-item">
                {item.startsWith('### ') ? (
                  <>
                    <b className="bullet-title">{item.split('\n')[0].replace('### ', '')}</b>
                    <br></br>
                    <span className="bullet-text">{item.split('\n')[1]}</span>
                  </>
                ) : (
                  <span className="bullet-text">{item}</span>
                )}
              </li>
            ))}
          </ul>
        );
      } else {
        return (
          <div className="variation-text">
            {text.split('\n').map((line, i) => (
              <p key={i} className="variation-line">{line}</p>
            ))}
          </div>
        );
      }
    };

    const renderProgressBars = () => (
      <div className="progress-bars">
        {Object.entries(progress).map(([page, percentage]) => (
          <div key={page} className="progress-bar-container">
            <div className="progress-bar-label">Page {page}</div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        ))}
        {isGeneratingPdf && (
          <div className="progress-bar-container">
            <div className="progress-bar-label">Rendering PDF</div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${pdfRenderProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>
    );

    const llmModels = ['GPT-4o', 'Claude-3.5-Sonnet', 'Llama3.1-70B'];
    const modelColors = ['#FF6B6B', '#4ECDC4', '#3b82f6'];
  
    const renderLegend = () => (
      <div className="variations-legend">
        {llmModels.map((model, index) => (
          <div key={model} className="legend-item" style={{ borderColor: modelColors[index] }}>
            {model}
          </div>
        ))}
      </div>
    );
    
  const renderVariations = (tag: Tag) => {
    const isSpecialTag = tag.id === 'executive_summary' || tag.id === 'recommendations_intro';
    const variations = tag.variations.slice(0, 3);

    if (isSpecialTag) {
      const currentIndex = carouselIndex[tag.id] || 0;
      const visibleVariations = [
        variations[currentIndex],
        variations[(currentIndex + 1) % variations.length]
      ];

      return (
        <div className="variations-carousel">
          <button 
            className="carousel-button left" 
            onClick={() => setCarouselIndex({
              ...carouselIndex,
              [tag.id]: (currentIndex - 1 + variations.length) % variations.length
            })}
          >
            &lt;
          </button>
          <div className="variations-container">
            {visibleVariations.map((variation, index) => (
              <div
                key={variation.id}
                className={`variation-box ${selectedVariations[tag.id] === (currentIndex + index) % variations.length ? 'selected' : ''}`}
                style={{ borderColor: modelColors[(currentIndex + index) % variations.length] }}
                onClick={() => setSelectedVariations({
                  ...selectedVariations,
                  [tag.id]: (currentIndex + index) % variations.length
                })}
              >
                {renderVariationText(variation.text)}
              </div>
            ))}
          </div>
          <button 
            className="carousel-button right" 
            onClick={() => setCarouselIndex({
              ...carouselIndex,
              [tag.id]: (currentIndex + 1) % variations.length
            })}
          >
            &gt;
          </button>
        </div>
      );
    }

  
      return (
        <div className="variations-container">
          {variations.map((variation, index) => (
            <div
              key={variation.id}
              className={`variation-box ${selectedVariations[tag.id] === index ? 'selected' : ''}`}
              style={{ borderColor: modelColors[index] }}
              onClick={() => setSelectedVariations({
                ...selectedVariations,
                [tag.id]: index
              })}
            >
              {renderVariationText(variation.text)}
            </div>
          ))}
        </div>
      );
    };
  
    return (
      <div className="variations-panel">
        {(isLoading || isGeneratingPdf) && (
          <div className="loading-section">
            <h2>Generating Variations</h2>
            <LoadingSpinner />
            {renderProgressBars()}
          </div>
    )}
      {variationsGenerated && !isLoading && (
        <div className="variations-content">
          <div className="variations-header">
            <h2>Content Variations</h2>
            {currentPageData.tags.some(tag => tag.variations.length > 1) && renderLegend()}
          </div>
          {currentPageData.tags.filter(tag => tag.variations.length > 1).length > 0 ? (
            currentPageData.tags.filter(tag => tag.variations.length > 1).map((tag) => (
              <div key={tag.id} className="variation-section">
                <h3 className="variation-title">{tag.title}</h3>
                {renderVariations(tag)}
              </div>
            ))
          ) : (
            <div className="variation-box no-variations">
              No content variations available for this page
            </div>
          )}
        </div>
      )}
    </div>
  );
};
  
  export default VariationsPanel;