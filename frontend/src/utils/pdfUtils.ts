import { DocumentContents, ContentCombinations } from '../models/CustomDocument';
import { renderDocumentPage, convertDocxToPdf } from './docxUtils';
import pLimit from 'p-limit';

export const generateVariationCombinations = (document: DocumentContents): ContentCombinations => {
    const result: ContentCombinations = {};

    for (const page of document.pages) {
        const pageCombinations: Record<string, number>[] = [{}];

        for (const tag of page.tags) {
            const newCombinations: Record<string, number>[] = [];

            for (const combination of pageCombinations) {
                for (const variation of tag.variations) {
                    newCombinations.push({
                        ...combination,
                        [tag.id]: variation.id
                    });
                }
            }
            pageCombinations.splice(0, pageCombinations.length, ...newCombinations);
        }

        result[page.pageNumber] = pageCombinations;
    }

    return result;
};

export async function renderAllCombinations(
  document: DocumentContents,
  onProgress: (progress: number) => void
): Promise<Record<string, Blob>> {
  const result: Record<string, Blob> = {};
  const combinations: ContentCombinations = generateVariationCombinations(document);

  let totalCombinations = 0;
  let completedCombinations = 0;

  for (const pageCombinations of Object.values(combinations)) {
    totalCombinations += pageCombinations.length;
  }

  const conversionPromises: Promise<void>[] = [];

  for (const [pageNumber, pageCombinations] of Object.entries(combinations)) {
    for (const combination of pageCombinations) {
      const conversionPromise = async () => {
        const key = generatePdfKey(Number(pageNumber), combination, document);
        const docxBlob = await renderDocumentPage(document, combination, Number(pageNumber));
        const pdfBlob = await convertDocxToPdf(docxBlob);
        result[key] = pdfBlob;

        completedCombinations++;
        const progress = (completedCombinations / totalCombinations) * 100;
        onProgress(progress);
      };

      conversionPromises.push(conversionPromise());
    }
  }

  await Promise.all(conversionPromises);
  return result;
}

export const generatePdfKey = (
  pageNumber: number,
  selectedVariations: Record<string, number>,
  contents: DocumentContents
): string => {
  if (contents.pages.length === 0) {
    return '';
  }
  const currentPage = contents.pages.find(page => page.pageNumber === pageNumber);
  if (!currentPage) {
    throw new Error(`Page ${pageNumber} not found in the document`);
  }

  const pageVariations = currentPage.tags.map(tag => {
    const variationId = selectedVariations[tag.id] ?? 0; // Use 0 as default if not found
    return `${tag.id}-${variationId}`;
  });

  return `page${pageNumber}_${pageVariations.join('_')}`;
};