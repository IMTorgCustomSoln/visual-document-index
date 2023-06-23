
import {ref} from 'vue'



// Managed Notes

export const ExportFileName = `${__EXPORT_FILE_NAME__}_v${__VERSION__}.json` 

export class TopicRecord{
  constructor(id, title, dropZoneName){
    this.id = id
    this.title = title
    this.dropZoneName = dropZoneName
  }
}

export class NoteRecord{
  constructor(id, list, type, innerHTML, innerText){
    this.id = id
    this.list = list
    this.type = type
    this.innerHTML = innerHTML
    this.innerText = innerText
  }
}
const notes_records = []
for (let idx=1; idx<=2; idx++){     //change for testing
  let text = 'Item '+idx
  let note = new NoteRecord(idx.toString(), 'stagingNotes', 'hand', '', text)
  notes_records.push(note)
}
export const ManagedNotesData = ref({
  topics: [],
  notes: notes_records
})




// Import Data

export class DocumentRecord{
  constructor(
    id, reference_number, filepath, filename_original, filename_modified, 
    file_extension, filetype, page_nos, length_lines, file_size_mb, date,
    title, author, subject, toc, pp_toc, 
    body_pages, body, clean_body, readability_score, tag_categories, keywords, summary
    ){
      //file indexing
      this.id = id
      this.reference_number = reference_number
      this.filepath = filepath
      this.filename_original = filename_original
      this.filename_modified = filename_modified

      //raw
      this.file_extension = file_extension
      this.filetype = filetype 
      this.page_nos = page_nos
      this.length_lines = length_lines
      this.file_size_mb = file_size_mb 
      this.date = date

      //inferred / searchable
      this.title = title
      this.author = author 
      this.subject = subject
      this.toc = toc
      this.pp_toc = pp_toc

      this.body_pages = body_pages
      this.body = body
      this.clean_body = clean_body
      this.readability_score = readability_score
      this.tag_categories = tag_categories
      this.keywords = keywords
      this.summary = summary

      //added by frontend
      this.length_lines_array = null
      this.date_created = null
      this.date_mod = null
      this.canvas_array = []

      this.sort_key = null
      this.hit_count = null
      this.snippets = null
      this._showDetails = null
      this.accumPageLines = null
    }
}


export async function getFileRecord(file){     //TODO: async may not be needed
  // create a file record from the FileReader() API
  return new Promise(function(resolve, reject) {
      const reader = new FileReader()
      reader.onload = (e) => {
          let typedarray = new Uint8Array(e.target.result)
          const loadingTask = pdfjsLib.getDocument(typedarray)
          loadingTask.promise.then(pdf => {
              const record = new DocumentRecord()
              //document is loaded
              record.page_nos = pdf.numPages;
              record.length_lines_array = []
              record.body_pages = {}

              pdf.getMetadata().then(meta => {
              record.title = meta.info.Title
              record.subject = meta.info.Subject
              record.author = meta.info.Author
              record.date_created = meta.info.CreationDate
              record.date_mod = meta.info.ModDate
              record.keywords = meta.info.Keywords
              })

              record.toc = pdf.getOutline().then(outline => {    //TODO:FIX by moving below `let page.getTextContent()`
                if (outline){
                    outline.map(item => item.title ? item.title : null)
                }
              })

              for (let i = 1; i <= record.page_nos; i++) {
                  pdf.getPage(i).then(function(page) {
                      let n = page.pageNumber;
                      let page_text = ""
                      record.canvas_array.push( createCanvasImage(page, i, record) )
                      page.getTextContent().then(function(textContent) {
                          for (let item of textContent.items) {
                              page_text += String(item.str)
                              if (item.hasEOL==true){ page_text += ' '}   //>>>alternative: ' <EOL> '
                          }
                          let edit1 = page_text.replaceAll('- ','')
                          record.body_pages[n] = edit1 + "\n\n"
                          let sentence_count = (edit1.match(/./g) || []).length
                          record.length_lines_array.push(sentence_count)
                      });
                  });
              };
              //console.log(`${file} pdf loaded with body: ${record.layers}`)
              //record.body = record.layers.length > 0 ? record.layers.reduce((partialSum, a) => partialSum += (a || 0)) : '';
              resolve(record)
          });
      }
      reader.readAsArrayBuffer(file);
      reader.onerror = reject;
  })
}

function createCanvasImage(page, idx, record){
  var scale = 1.5;
  var viewport = page.getViewport({ scale: scale })
  var canvas = document.createElement('canvas')

  // Prepare canvas using PDF page dimensions
  var context = canvas.getContext('2d')
  canvas.height = viewport.height
  canvas.width = viewport.width

  // Render PDF page into canvas context
  var renderContext = { canvasContext: context, viewport: viewport }

  var renderTask = page.render(renderContext)
  renderTask.promise.then(function() {
    let image = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream")
    record.canvas_array.push(
      {idx:idx, 
        img:image
      })
    console.log(record.canvas_array.length + ' page(s) loaded in record')
  })
}



export function getFileReferenceNumber(filename, searchTermOrIndexArray=[9,17], regex=false){
  /* Get a file reference number from file name
  The `searchTermOrIndexArray` should be one of the following:
   * Array [start, stop] - index numbers to slice
   * String (chars) - simple search term to slice(0, first_index)
   * String (regex) - regex pattern to hit
  */
 let reference = ''
 if (Array.isArray(searchTermOrIndexArray)==true && searchTermOrIndexArray.length==2){
  let idx1,idx2
  [idx1, idx2] = searchTermOrIndexArray
  reference = filename.slice(idx1, idx2)
 } else if (typeof(searchTermOrIndexArray)=="string"){
      if (!regex){
        const idx = filename.indexOf(searchTermOrIndexArray)
        reference = filename.slice(0, idx)
      } else if (regex){
        const idx = filename.search(searchTermOrIndexArray)
        reference = filename.slice(0, idx)
      }
 } else {
  const reference = ''
}
return reference
}


export const getDateFromJsNumber = num => {
  // Integer to string date
  let result = ''
  if (typeof(num)=='number'){
      if (String(num).length > 10) {
          let dt = new Date(num)
          result = `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`;
      }
  } else if (typeof(num)=='string' && num.length > 10) {
      const int = parseInt(num) 
      let dt = new Date(int)
      result = `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`;
  } 
  return result;
};


export function getFormattedFileSize(numberOfBytes, longFormat=true) {
  // Approximate to the closest prefixed unit
  const units = [
      "B",
      "KiB",
      "MiB",
      "GiB",
      "TiB",
      "PiB",
      "EiB",
      "ZiB",
      "YiB",
  ];
  const exponent = Math.min(
      Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
      units.length - 1
  );
  const approx = numberOfBytes / 1024 ** exponent;
  let output = ''
  if(longFormat){
      output = exponent === 0 ?
          `${numberOfBytes} bytes` :
          `${approx.toFixed(3)} ${
                units[exponent]
              } (${numberOfBytes} bytes)`;
  }else{
      output =
          exponent === 0 ?
          `${numberOfBytes} bytes` :
          `${approx.toFixed(3)} ${
                units[exponent]}`;
  }
  return output;
}




const getDateFromPythonString = str => {
  /* Usage:
  const dt = getDateFromString(value)
  const formattedDate = dt.toLocaleDateString()
  return formattedDate;
  */
  if (str.length > 10) {
      const [date, time] = str.split(" ");
      long_date = `${date}T${time}.000Z`; // reformat string into YYYY-MM-DDTHH:mm:ss.sssZ
      dt = new Date(long_date)
  } else {
      dt = new Date(str)
  }
  return dt;
};








/*
No longer used, but good reference.
Reference for this solution to register pdfjs-dist:
https://erindoyle.dev/using-pdfjs-with-vite/


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
*/