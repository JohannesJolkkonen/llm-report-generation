import React, { useState } from 'react';
import styled from 'styled-components';
import { renderFullDocument, convertDocxToPdf } from '../utils/docxUtils';
import { DocumentContents } from '../models/CustomDocument';
import logo from '../funktio_bg.png'; // Adjust the path as needed

interface SelectorMenuProps {
  selectedReportType: string;
  selectedCompany: string;
  selectedDate: string;
  onReportTypeChange: (reportType: string) => void;
  onCompanyChange: (company: string) => void;
  onDateChange: (date: string) => void;
  onGenerateVariations: () => void;
  isGeneratingPdf: boolean;
  variationsGenerated: boolean;
  documentContents: DocumentContents | null;
  selectedVariations: Record<string, number>;
}


const SelectorContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-grow: 1;
`;

// Modify the StyledSelectorMenu
const StyledSelectorMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
  padding: 20px;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  position: sticky;
  top: 0;
  z-index: 1000;
  margin-bottom: 20px;
`;

const SelectGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const SelectLabel = styled.label`
  font-size: 14px;
  color: #374151;
  margin-bottom: 4px;
`;

const StyledSelect = styled.select`
  appearance: none;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 40px 12px 16px;
  font-size: 16px;
  line-height: 1.5;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 200px;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23374151'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const StyledButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  height: 48px;
  font-weight: 700;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const DownloadButton = styled(StyledButton)`
  position: relative;
  margin-left: auto; /* Push to the right */
  display: block; /* Ensure it takes up full width */
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  top: 100%;
  left: 0;

  ${DownloadButton}:hover & {
    display: block;
  }
`;

const DropdownItem = styled.a`
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  cursor: pointer;

  &:hover {
    background-color: #f1f1f1;
  }
`;

const SelectorMenu: React.FC<SelectorMenuProps> = ({
  selectedReportType,
  selectedCompany,
  selectedDate,
  onReportTypeChange,
  onCompanyChange,
  onDateChange,
  onGenerateVariations,
  isGeneratingPdf,
  variationsGenerated,
  documentContents,
  selectedVariations,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const reportTypes = ['', 'Monthly Sales Report', 'Quarterly Business Review', 'Marketing Plan']; // Added empty option
  const companies = ['Media & Electronics', 'Energy'];
  const dates = selectedReportType === 'Quarterly Business Review' ? ['Q2/2024', 'Q1/2024', 'Q4/2023'] : ['2024 / 06', '2024 / 05', '2024 / 04'];

  const showPeriod = selectedReportType !== 'Marketing Plan';
  const dateLabel = selectedReportType === 'Quarterly Business Review' ? 'Quarter' : 'Period';
  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!documentContents) {
      alert('No document contents available. Please generate contents first.');
      return;
    }

    setIsDownloading(true);
    try {
      const docxBlob = await renderFullDocument(documentContents, selectedVariations);
      let finalBlob: Blob;
      let fileName: string;

      if (format === 'pdf') {
        finalBlob = await convertDocxToPdf(docxBlob);
        fileName = 'document.pdf';
      } else {
        finalBlob = docxBlob;
        fileName = 'document.docx';
      }

      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('An error occurred while downloading the document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <StyledSelectorMenu>
      <SelectorContainer>
        <SelectGroup>
          <SelectLabel>Report Type</SelectLabel>
          <StyledSelect 
            value={selectedReportType} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onReportTypeChange(e.target.value)}
          >
            {reportTypes.map(type => (
              <option key={type} value={type}>{type || 'Select report type'}</option>
            ))}
          </StyledSelect>
        </SelectGroup>
        {selectedReportType && (
          <>
            <SelectGroup>
              <SelectLabel>Department</SelectLabel>
              <StyledSelect 
                value={selectedCompany} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onCompanyChange(e.target.value)}
              >
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </StyledSelect>
            </SelectGroup>
            {showPeriod && (
            <SelectGroup>
              <SelectLabel>{dateLabel}</SelectLabel>
              <StyledSelect 
                value={selectedDate} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onDateChange(e.target.value)}
              >
                {dates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </StyledSelect>
              </SelectGroup>
            )}
          </>
        )}
        <StyledButton onClick={onGenerateVariations} disabled={isGeneratingPdf || !selectedReportType}>
          {isGeneratingPdf ? 'Generating...' : 'Generate Document Contents'}
        </StyledButton>
        {variationsGenerated && (
          <DownloadButton disabled={isDownloading}>
            {isDownloading ? 'Downloading...' : 'Download Full Document'}
            <DropdownContent>
              <DropdownItem onClick={() => handleDownload('docx')}>Download as DOCX</DropdownItem>
              <DropdownItem onClick={() => handleDownload('pdf')}>Download as PDF</DropdownItem>
            </DropdownContent>
          </DownloadButton>
        )}
      </SelectorContainer>
    </StyledSelectorMenu>
  );
};

export default SelectorMenu;