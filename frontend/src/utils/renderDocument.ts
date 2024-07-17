import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DocumentContents, ContentCombinations } from '../models/CustomDocument';
import { generateVariationCombinations } from '../utils/pdfUtils';
// const defaultVariations = (document: DocumentContents): Record<string, number> => {
//     return document.pages.reduce((acc, page) => {
//         page.tags.forEach(tag => {
//             acc[tag.id] = 0;
//         });
//         return acc;
//     }, {} as Record<string, number>);
// };

export async function renderTemplateDocument(document: DocumentContents): Promise<Blob> {
    let zip: PizZip;
    
    try {
        // Fetch the template file
        const response = await fetch('/templates/sales_report_full.docx');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        // Convert the response directly to a Blob
        const blob = await response.blob();
        return blob;
      } catch (error) {
        console.error('Error fetching template file:', error);
        throw error;
      }
    }

export async function renderDocumentPage(document: DocumentContents, selectedVariations: Record<string, number>, pageNumber: number): Promise<Blob> {
    let zip: PizZip;
    
    try {
      // Fetch the template file for the specific page
      const response = await fetch(`/templates/page_${pageNumber}.docx`);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
  
      console.log(`Template file for page ${pageNumber} loaded, size:`, arrayBuffer.byteLength, 'bytes');
  
      // Create a new instance of PizZip
      zip = new PizZip(base64, { base64: true });
    } catch (error) {
      console.error(`Error fetching template file for page ${pageNumber}:`, error);
      throw error;
    }
    
    // Create a new instance of Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
  
    // Prepare the data for rendering
    const data: Record<string, string> = {};
  
    // Get the current page data
    const currentPage = document.pages.find(page => page.pageNumber === pageNumber);
  
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
    console.log(data);
  
    // Render the document
    try {
      doc.render(data);
    } catch (error) {
      console.error('Error rendering document:', error);
      throw error;
    }
  
    // Generate the document as a blob
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  
    return blob;
}

export async function convertDocxToPdf(docxBlob: Blob): Promise<Blob> {
    const apiSecret = process.env.CONVERT_API_KEY; // Replace with your actual API secret
    const apiUrl = `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${apiSecret}&StoreFile=true`;

    try {
        // Create form data
        const formData = new FormData();
        formData.append('File', docxBlob, 'document.docx');

        // Send request to ConvertAPI
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Fetch the converted PDF
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

export async function renderAllCombinations(document: DocumentContents): Promise<Record<string, Blob>> {
    const result: Record<string, Blob> = {};
    const combinations: ContentCombinations = generateVariationCombinations(document);
  
    for (const [pageNumber, pageCombinations] of Object.entries(combinations)) {
      for (const combination of pageCombinations) {
        const key = generatePdfKey(Number(pageNumber), combination, document);
        const docxBlob = await renderDocumentPage(document, combination, Number(pageNumber));
        const pdfBlob = await convertDocxToPdf(docxBlob);
        result[key] = pdfBlob;
      }
    }
  
    return result;
  }

  export function generatePdfKey(pageNumber: number, selectedVariations: Record<string, number>, document: DocumentContents): string {
    const currentPage = document.pages.find(page => page.pageNumber === pageNumber);
    if (!currentPage) {
      throw new Error(`Page ${pageNumber} not found in the document`);
    }
  
    const pageVariations = currentPage.tags.map(tag => {
      const variationId = selectedVariations[tag.id] ?? 0; // Use 0 as default if not found
      return `${tag.id}-${variationId}`;
    });
  
    return `page${pageNumber}_${pageVariations.join('_')}`;
  }

export {}