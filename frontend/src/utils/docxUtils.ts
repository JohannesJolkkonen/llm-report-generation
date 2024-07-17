import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DocumentContents, Tag } from '../models/CustomDocument';

export async function renderTemplateDocument(contents: DocumentContents): Promise<Blob> {
  try {
    const response = await fetch('/templates/sales_report_full.docx');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching template file:', error);
    throw error;
  }
}

async function fetchTemplateFile(pageNumber: number): Promise<PizZip> {
    try {
      const response = await fetch(`/templates/page_${pageNumber}.docx`);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return new PizZip(base64, { base64: true });
    } catch (error) {
      console.error(`Error fetching template file for page ${pageNumber}:`, error);
      throw error;
    }
  }

function prepareRenderData(
    currentPage: { tags: Tag[] } | undefined,
    selectedVariations: Record<string, number>
  ): Record<string, string> {
    const data: Record<string, string> = {};
    if (currentPage) {
      currentPage.tags.forEach(tag => {
        if (tag.id in selectedVariations) {
          const variationIndex = selectedVariations[tag.id];
          const selectedVariation = tag.variations.find(v => v.id === variationIndex);
          if (selectedVariation) {
            data[tag.id] = selectedVariation.text;
          }
        }
      });
    }
  return data;
}


export async function renderDocumentPage(
    contents: DocumentContents,
    selectedVariations: Record<string, number>,
    pageNumber: number
  ): Promise<Blob> {
    const zip = await fetchTemplateFile(pageNumber);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
  
    const currentPage = contents.pages.find(page => page.pageNumber === pageNumber);
    const data = prepareRenderData(currentPage, selectedVariations);
  
    try {
      doc.render(data);
    } catch (error) {
      console.error('Error rendering document:', error);
      throw error;
    }
  
    return doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

export async function convertDocxToPdf(docxBlob: Blob): Promise<Blob> {
  const apiSecret = 'HQF8pX17WVGiv9GU'; // Replace with your actual API secret
  const apiUrl = `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${apiSecret}&StoreFile=true`;

  try {
    const formData = new FormData();
    formData.append('File', docxBlob, 'document.docx');

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const pdfResponse = await fetch(result.Files[0].Url);
    
    if (!pdfResponse.ok) {
      throw new Error(`HTTP error! status: ${pdfResponse.status}`);
    }
    return await pdfResponse.blob();
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    throw error;
  }
}