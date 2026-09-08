import * as pdfjs from 'pdfjs-dist';

// Set worker source
// In a Vite environment, we can use the legacy worker or a CDN link
// For simplicity and reliability in this environment, we'll use the CDN worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export const extractTextFromPDFLocally = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pagePromises = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    pagePromises.push((async () => {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      return textContent.items
        .map((item: any) => item.str)
        .join(' ');
    })());
  }
  
  const pagesText = await Promise.all(pagePromises);
  return pagesText.join('\n\n').trim();
};
