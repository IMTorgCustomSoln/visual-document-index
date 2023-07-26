import { DocumentRecord } from "./data"
import * as model from "../../tests/py/results.json"

// Upload Input

export async function getFileRecord(filestore){     
  return new Promise(function(resolve, reject) {
      const reader = new FileReader()
      filestore.startTime = performance.now()
      addListeners(reader, filestore)
      reader.onload = (e) => {
          let typedarray = new Uint8Array(e.target.result)
          const loadingTask = pdfjsLib.getDocument(typedarray)
          loadingTask.promise.then(pdf => {
              //document is loaded 
              const record = new DocumentRecord()
              record.page_nos = pdf.numPages
              /*(commented-out b/c already assigned)
              record.length_lines_array = []
              record.body_chars = {}
              record.body_pages = {}*/

              createMetadata(pdf, record)
              createOutline(pdf, record)
              
              for (let i = 1; i <= record.page_nos; i++) {
                  pdf.getPage(i).then(function(page) {
                      let n = page.pageNumber;
                      let page_text = ""
                      createCanvasImage(page, n, record)
                      page.getTextContent().then(function(textContent) {
                          for (let item of textContent.items) {
                              page_text += String(item.str)
                              if (item.hasEOL==true){ page_text += ' '}   //>>>alternative: ' <EOL> '
                          }
                          let edit1 = page_text//.replaceAll('- ','')
                          record.body_pages[n] = edit1// + "\n\n"
                          record.body_chars[n] = edit1.length
                          let approxCharsInSentence = 10
                          let sentence_count = edit1.split('.').filter(item => item.length > approxCharsInSentence).length    //orig:`(edit1.match(/./g) || []).length` 
                          record.length_lines_array.push(sentence_count)
                      });
                      //console.log(`Page ${n} of ${pdf.numPages} for file ${file.name}`)
                  });
              };
              //console.log(`${file} pdf loaded with body: ${record.layers}`)
              //record.body = record.layers.length > 0 ? record.layers.reduce((partialSum, a) => partialSum += (a || 0)) : '';
              resolve(record)
          }).catch((error)=>{
            console.log(error)
          })
      }
      reader.readAsArrayBuffer(filestore.file)
      reader.onerror = reject
  })
}


function addListeners(reader, filestore) {
  /* Add listeners and event handlers to the reader object.

  This is directly dependent upon the ImportData component and 
  TODO: should be moved ImportData component for correct coupling
  */
  reader.idx= filestore.idx
  reader.file = filestore.file
  reader.startTime = filestore.startTime
  reader.ctx = filestore.ctx
  const log = `${filestore.startTime}: file ${filestore.idx} - ${filestore.file.name} underwent event 'start' with 0 bytes transferred\n`
  filestore.ctx.importLogs.push( log )

  reader.addEventListener("loadstart", handleEvent)
  reader.addEventListener("load", handleEvent)
  reader.addEventListener("loadend", handleEvent)
  reader.addEventListener("progress", handleEvent)
  reader.addEventListener("error", handleEvent)
  reader.addEventListener("abort", handleEvent)

  function handleEvent(event) {
    let update = 0
    const log = `${performance.now()}: file ${filestore.idx} - ${event.currentTarget.file.name} underwent event '${event.type}' with ${event.loaded} bytes transferred\n`
    event.currentTarget.ctx.importLogs.push( log )
    //console.log(log)

    //successful events
    if (event.type=='loadstart'){
      update = event.currentTarget.ctx.totalProgress + 1
      event.currentTarget.ctx.fileProgress = update
    } else if (event.type=='load'){
      update = event.currentTarget.ctx.totalProgress + event.loaded
      event.currentTarget.ctx.totalProgress = update
      event.currentTarget.ctx.fileProgress = update
    } else if (event.type=='progress'){
      update = event.currentTarget.ctx.fileProgress = event.currentTarget.ctx.totalProgress + event.loaded
      event.currentTarget.ctx.fileProgress = update
    } 
    //file progress should always include total progress
    if (event.currentTarget.ctx.fileProgress < event.currentTarget.ctx.totalProgress){
      event.currentTarget.ctx.fileProgress = event.currentTarget.ctx.totalProgress
    }
    //console.log(event.currentTarget.ctx.fileProgress)
  }
}

function createMetadata(pdf, record){
  pdf.getMetadata().then(meta => {
    record.title = meta.info.Title
    record.subject = meta.info.Subject
    record.author = meta.info.Author
    record.date_created = meta.info.CreationDate
    record.date_mod = meta.info.ModDate
    record.keywords = meta.info.Keywords
    })
}

function createOutline(pdf, record){
  //ref: https://medium.com/@csofiamsousa/creating-a-table-of-contents-with-pdf-js-4a4316472fff
  pdf.getOutline().then(async outline => {    
    if (outline){
      for (let i =0; i< outline.length; i++){
        const title = outline[i].title
        const dest = outline[i].dest
        pdf.getDestination(dest).then(function(dest){
          const ref = dest[0]
          pdf.getPageIndex(ref).then(function(id){
            record.toc.push({title: title, pageNumber: parseInt(id)+1})
          })
        })
      }
    }
  })
}

function createCanvasImage(page, idx, record){
  //ref: https://stackoverflow.com/questions/62744470/turn-pdf-into-array-of-pngs-using-javascript-with-pdf-js
  var scale = 1.5;
  var viewport = page.getViewport({ scale: scale })
  var canvas = document.createElement('canvas')

  // Prepare canvas using PDF page dimensions
  var context = canvas.getContext('2d')
  canvas.height = viewport.height
  canvas.width = viewport.width

  // Render PDF page into canvas context
  var renderContext = { canvasContext: context, viewport: viewport }
  const renderTask = page.render(renderContext)
  renderTask.promise.then(function() {
    let image = canvas.toDataURL('image/png')
    record.canvas_array.push( {idx:idx, img:image} )
  })
}







// ProcessData

export function getEstimatedProcessTime(fileCount, fileSizeInBytes){
  /* Get the estimated time to process a file, in human-
  readable minutes or seconds.
  TODO: this is entirely dependent on platform from which the 
  function is run.
  */
  let formatted = ''
  let result = ''
  const {size, file_count} = model.coefs['0.75']    //TODO:add high estimate to this median estimate

  if (Number.isInteger(fileCount) && Number.isFinite(fileSizeInBytes)){
    const log_fileCount = Math.log(fileCount)
    const log_Size = Math.log(fileSizeInBytes)
    const log_milliseconds = size * log_fileCount + file_count * log_Size
    const milliseconds = Math.exp(log_milliseconds)

    if (Number.isFinite(milliseconds )){
      result = getFormattedMilliseconds(milliseconds)
    } else {
      result = '-1'
    }
    return result
  } else {
    result = '-1'
  }
}

export function getFormattedMilliseconds(milliseconds){
  let formatted = ''
  if (milliseconds >= 60000){
    const intermediate = milliseconds / 60000 
    formatted = `${intermediate.toFixed(2)} min`
  } else if (milliseconds < 60000 && milliseconds >= 1000){
    const intermediate = milliseconds / 1000 
    formatted = `${intermediate.toFixed(2)} sec`
  } else {
    formatted = `${milliseconds.toFixed(2)} milliseconds`
  }
  return formatted
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
          `${approx.toFixed(2)} ${
                units[exponent]
              } (${numberOfBytes} bytes)`;
  }else{
      output =
          exponent === 0 ?
          `${numberOfBytes} bytes` :
          `${approx.toFixed(2)} ${
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