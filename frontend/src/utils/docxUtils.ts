import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DocumentContents, Tag, Page } from '../models/CustomDocument';
// import ChartModule from "docxtemplater-chart-module";

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

async function fetchTemplateFile(templatePath: string): Promise<PizZip> {
    try {
      const response = await fetch(templatePath);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return new PizZip(base64, { base64: true });
    } catch (error) {
      console.error(`Error fetching template file for ${templatePath}:`, error);
      throw error;
    }
  }

  
  function prepareRenderData(
    pages: { tags: Tag[] }[],
    selectedVariations: Record<string, number>
  ): Record<string, string> {
    const data: Record<string, string> = {};
    const processedTags = new Set<string>();
  
    pages.forEach(page => {
      page.tags.forEach(tag => {
        if (processedTags.has(tag.id)) {
          return; // Skip this tag if it's already been processed
        }
  
        processedTags.add(tag.id);
        try {
          if (tag.id === 'recommendation_bullets') {
            const selectedVariationIndex = selectedVariations[tag.id] || 0;
            const selectedVariation = tag.variations[selectedVariationIndex];
            if (Array.isArray(selectedVariation.text)) {
              selectedVariation.text.forEach((bullet, index) => {
                const [title, content] = bullet.split('\n');
                data[`recommendation_bullet_title_${index + 1}`] = title.replace('### ', '');
                data[`recommendation_bullet_content_${index + 1}`] = content.trim();
              });
            }
          } else if (tag.id.includes('bullet')) {
            const selectedVariationIndex = selectedVariations[tag.id] || 0;
            const selectedVariation = tag.variations[selectedVariationIndex];
            if (Array.isArray(selectedVariation.text)) {
              selectedVariation.text.forEach((bulletText, index) => {
                data[`${tag.id.replace('bullets', `bullet_${index + 1}`)}`] = bulletText;
              });
            }
          } else if (tag.id === "product_sales" || tag.id === "category_sales_chart") {
            data[tag.id] = tag.variations[0].text;
          } else if (tag.id in selectedVariations) {
            const variationIndex = selectedVariations[tag.id];
            const selectedVariation = tag.variations.find(v => v.id === variationIndex);
            if (selectedVariation) {
              data[tag.id] = selectedVariation.text;
            }
          } else {
            data[tag.id] = tag.variations[0].text;
          }
        } catch (error) {
          console.error(`Error processing tag ${tag.id}:`, error);
          data[tag.id] = "Empty";
          // Log the error and continue processing other tags
        }
      });
    });
  
    return data;
  }



export async function renderDocumentPage(
    contents: DocumentContents,
    selectedVariations: Record<string, number>,
    pageNumber: number
  ): Promise<Blob> {
    const zip = await fetchTemplateFile(`/temp/page_${pageNumber}.docx`);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // modules: [new ChartModule({})]
    });

  
    const currentPage = [contents.pages.find(page => page.pageNumber === pageNumber)].filter((page): page is Page => page !== undefined);
    const data = prepareRenderData(currentPage, selectedVariations);
    console.log("Data to render:", data);
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

export async function renderFullDocument(
    contents: DocumentContents,
    selectedVariations: Record<string, number>
  ): Promise<Blob> {
    const zip = await fetchTemplateFile(`/temp/sales_report_full.docx`);  // Fetch the full template
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // modules: [new ChartModule({})]
    });
  
    const data = prepareRenderData(contents.pages, selectedVariations);
    console.log("Data to render for complete document:", data);
  
    try {
      doc.render(data);
    } catch (error) {
      console.error('Error rendering complete document:', error);
      throw error;
    }
  
    return doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

export async function convertDocxToPdf(docxBlob: Blob): Promise<Blob> {
  const apiSecret = process.env.REACT_APP_CONVERT_API_KEY;
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