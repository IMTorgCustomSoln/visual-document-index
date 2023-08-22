import { DocumentRecord } from "./data"
import * as model from "../../tests/py/results.json"
import { ref } from "vue"

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
                          record.body_pages[n] = edit1 + "<br><br>" //+ "\n\n"    //TODO:BAD => must separate frontend display from actual text, this destroys mapping to correct page if doc is long
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
  TODO: should be moved into ImportData component because it is tightly coupled
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
  const {size, file_count} = model.coefs['0.75']    //TODO:add high estimate to this median estimate to give users a better range of values

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

/* FAIL: this is too complicated, but may be something to consider in future
export function getFileReferenceNumber(filename, searchTermOrIndexArray=/(^\d+)(.+$)/i, regex=true){
  /* Get a file reference number from file name
  This unique identifier is used throughout the app.  If no ref number is used, then a hash
  of the file name will be applied for uniqueness.
  ref: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript

  The `searchTermOrIndexArray` argument should be one of the following:
   * Array [start, stop] - index numbers to slice
   * String (chars) - simple search term to slice(0, first_index)
   * String (regex) - regex pattern to hit
    
   ('54931863796627370000-econ_2301.00410.pdf').replace(regex, '$1')
   '54931863796627370000'
  *//*
 let reference = ''
 if (Array.isArray(searchTermOrIndexArray)==true && searchTermOrIndexArray.length==2){
  let idx1,idx2
  [idx1, idx2] = searchTermOrIndexArray
  let tmp = filename.slice(idx1, idx2)
  if (Number.isInteger(tmp)){
    reference = tmp
  } else {
    reference = filename.hashCode()
  }
 } else if (typeof(searchTermOrIndexArray)=="string"){
      if (!regex){
        const idx = filename.indexOf(searchTermOrIndexArray)
        reference = filename.slice(0, idx)
      } else if (regex){
        let tmp = (filename).replace(searchTermOrIndexArray, '$1')
        if (tmp.length <= 20 ){
          console.log(tmp)
          reference = tmp
        }
      }
 } else {
  const reference = filename.hashCode()
}
return reference
}*/


export function getFileReferenceNumber(filename){
  /* Get a file reference number from file name
  This unique identifier is used throughout the app.  If no ref number is used, then a hash
  of the file name will be applied for uniqueness.
  
   ('54931863796627370000-econ_2301.00410.pdf').replace(regex, '$1')
   '54931863796627370000'
  */
 let reference = ''
 const regex = /(^\d+)(.+$)/i
 const rslt = (filename).replace(regex, '$1')
 if (rslt.length <= 20 && (Number.parseInt(rslt)).toString().length == rslt.length){
  reference = rslt
 } else {
  reference = filename.hashCode()
 }
 return reference
}


String.prototype.hashCode = function(seed = 0) {
  // Generate hash from string
  //ref: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < this.length; i++) {
      ch = this.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};


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


export function getFormattedFileSize(numberOfBytes, format='both') {
  /* Approximate to the closest prefixed unit
  
  format = <decimal, unit, both>
  getFormattedFileSize(139070, 'decimal')  >>> "135.81"
  getFormattedFileSize(139070, 'unit')  >>> "135.81 KiB"
  getFormattedFileSize(139070, 'both')  >>> "135.81 KiB (139070 bytes)"
  */
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
  if(format == 'both'){
    output = exponent === 0 ?
          `${numberOfBytes} bytes` :
          `${approx.toFixed(2)} ${
                units[exponent]
              } (${numberOfBytes} bytes)`
  }else if (format == 'unit'){
    output =
          exponent === 0 ?
          `${numberOfBytes} bytes` :
          `${approx.toFixed(2)} ${
                units[exponent]}`
  }else if (format == 'decimal'){
    output =
    exponent === 0 ?
    `${numberOfBytes} bytes` :
    `${approx.toFixed(2)}`
  }
  return output
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



function serializeObject(obj){
  // implement JSON.stringify serialization
  JSON.stringify = JSON.stringify || function (obj) {
  	var t = typeof (obj);
  	if (t != "object" || obj === null) {
  		// simple data type
  		if (t == "string") obj = '"'+obj+'"';
  		return String(obj);
  	}
  	else {
  		// recurse array or object
  		var n, v, json = [], arr = (obj && obj.constructor == Array);
  		for (n in obj) {
  			v = obj[n]; t = typeof(v);
  			if (t == "string") v = '"'+v+'"';
  			else if (t == "object" && v !== null) v = JSON.stringify(v);
  			json.push((arr ? "" : '"' + n + '":') + String(v));
  		}
  		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
  	}
  }
}



function deserializeObject(str){
  // implement JSON.parse de-serialization
  JSON.parse = JSON.parse || function (str) {
  	if (str === "") str = '""';
  	eval("var p=" + str + ";");
  	return p;
  }
}


export function camelize(str) {
  //Turn any string into camelCase
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}





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