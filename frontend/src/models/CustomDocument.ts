interface Variation {
    id: number;
    text: string;
}

interface Tag {
    id: string;
    title: string;
    source: string;
    variations: Variation[];
}

interface Page {
    pageNumber: number;
    tags: Tag[];
}

interface DocumentContents {
    pages: Page[];
}

interface ContentCombinations {
    [pageNumber: number]: Record<string, number>[];
}

export type { DocumentContents, Page, Tag, Variation, ContentCombinations };
