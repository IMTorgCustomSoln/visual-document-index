/*
No longer used, but good reference.
Reference for this solution to register pdfjs-dist:
https://erindoyle.dev/using-pdfjs-with-vite/
*/

import pdfjs from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker';
import * as Sentry from '@sentry/vue';


const init = async () => {
  
  try {
    if (typeof window === 'undefined' || !('Worker' in window)) {
      throw new Error('Web Workers not supported in this environment.');
    }
    window.pdfjsWorker = pdfjsWorker;
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  } catch (error) {
    Sentry.captureException(`Unable to load pdfjs: ${error}`);
  }
};

export default {
  install: (app) => {
    init();
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
    app.config.globalProperties.$pdf = pdfjs;
  }
};