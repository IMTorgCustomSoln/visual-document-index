import { DocumentRecord } from "./data"
//import { assert } from 'vitest'


export class WordSplitter{
  constructor(filepath){
    this.filepath = filepath
  }
  async setup(){
    this.wordsByFreq = await parseJsonFile(this.filepath)
    this.wordsCost = wordCost(this.wordsByFreq)
    this.longestWordLength = getLongestString(this.wordsByFreq)
    this.inferSpaces = inferSpaces.bind(this)
    return 1
  }
}

const filepath = './xtra/swords_by_freq.json'
export const WordSplit = new WordSplitter(filepath)


function inferSpaces(str){
  //ref: https://stackoverflow.com/questions/8870261/how-to-split-text-without-spaces-into-list-of-words
  //TODO: enable to maintain case of string

  //build cost array
  const cost = [0]
  const rng = [...Array(str.length+1).keys()]
  rng.shift()
  for (let i of rng){
    const [c, k] = getBestMatch.bind(this)(i)
    cost.push(c)
  }

  //recover minimal cost string
  const out = []
  let i = str.length
  while (i > 0){
    let [c, k] = getBestMatch.bind(this)(i)
    //assert( c == cost[i] )
    out.push( str.slice(i-k, i) )
    i -= k
  }

  const result = out.toReversed().join(" ")
  return result


  function getBestMatch(i){
    const mx = Math.max(0, i-this.longestWordLength)
    const candidates = cost.slice(mx, i).reverse()
    const selectionCost = []
    for (let [idx, c] of candidates.entries()){
      const selection = str.slice(i-idx-1, i)
      const costVal = this.wordsCost[selection] ?? 9e999
      selectionCost.push( [c + costVal, idx+1])
    }
    const min = selectionCost.reduce((min, item) => {return item[0] < min[0] ? item : min})
    return min
  }

}

function reverse(s){
  return s.split("").reverse().join("")
}

function getLongestString(words){
  const longestWord = words.reduce((a,b) => a.length < b.length ? b : a, "")
  return longestWord.length
}

function wordCost(words){
  const result = {}
  try{
    for (let [idx, word] of words.entries()){
      result[word] = Math.log((idx+1) * Math.log(words.length))
    }
    return result
  } catch(error) {
    console.log(error)
  }
}

const isBrowser = new Function("try {return this === window;}catch(e){return false;}")

export async function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    if (isBrowser()){
      const fileReader = new FileReader()
      fileReader.onload = event => resolve(JSON.parse(event.target.result)['words'])
      fileReader.onerror = error => reject(error)
      fileReader.readAsText(file)
    } else {
      const fs = require('fs')
      fs.readFile(file, (err, json)=>{
        const data = JSON.parse(json)
        resolve(data['words'])
      })
    }
  })
}



/* Upload Input


// v1 await only (fails b/c of for loops)
export async function getFileRecord(file){
  // create a file record from the FileReader() API
  return new Promise(function(resolve, reject) {
      const reader = new FileReader()
      reader.onload = (e) => {
          let typedarray = new Uint8Array(e.target.result)
          PDFJS.getDocument(typedarray).then(async pdf => {
              const record = new DocumentRecord()

              //document is loaded
              record.page_nos = pdf.numPages
              record.length_lines_array = []
              record.body_pages = {}

              createMetadata(pdf, record)
              createOutline(pdf, record)

              for (let i = 1; i <= record.page_nos; i++) {
                //ref: https://github.com/pramodhkp/pdf2svg/blob/master/pdf2svg.js
                const page = await pdf.getPage(i)
                const n = page.pageNumber
                const viewport = page.getViewport(1.0)
                const opList = await page.getOperatorList()
                let svgGfx = new PDFJS.SVGGraphics(page.commonObjs, page.objs)
                svgGfx.embedFonts = true
                const svg = await svgGfx.getSVG(opList, viewport)
                record.svg_pages.push({"pg":n, "svg":svg})
              }
              resolve(record)
          }).catch((error)=>{
            console.log(error)
          })
      }
      reader.readAsArrayBuffer(file)
      reader.onerror = reject
  })
}*/


// v2 some other problem
export async function getFileRecord(file){     //TODO: async may not be needed
  // create a file record from the FileReader() API
  return new Promise(function(resolve, reject) {
      const reader = new FileReader()
      reader.onload = (e) => {
          let typedarray = new Uint8Array(e.target.result)
          const loadingTask = PDFJS.getDocument(typedarray) 
          loadingTask.promise.then(pdf => {
              let record = new DocumentRecord()
              //document is loaded
              record.page_nos = pdf.numPages;
              record.length_lines_array = []
              record.body_pages = {}

              createMetadata(pdf, record)
              createOutline(pdf, record)
              
              for (let i = 1; i <= record.page_nos; i++) {
                pdf.getPage(i).then(function(page) {
                    let n = page.pageNumber
                    var viewport = page.getViewport({ scale: 3 })
                    var svg = page.getOperatorList().then(function (opList) {
                      var svgGfx = new PDFJS.SVGGraphics(page.commonObjs, page.objs)
                      svgGfx.embedFonts = true
                      return svgGfx.getSVG(opList, viewport).then(function (svg) {
                        var s = new XMLSerializer()
                        let item = {
                          page: n,
                          innerHTML: svg.innerHTML,
                          outerHTML: svg.outerHTML,
                          textContent: svg.textContent,
                          serialized: s.serializeToString(svg)
                        }
                        record.svg_pages.push(item)
                        return svg
                      })
                    })
                })
              }
              resolve(record)
          }).catch((error)=>{
            console.log(error)
          })
      }
      reader.readAsArrayBuffer(file);
      reader.onerror = reject;
  })
}


async function createSvg(pdf, record){
  return new Promise(function(resolve, reject){
    for (let i = 1; i <= record.page_nos; i++) {
      pdf.getPage(i).then(function(page) {
        let n = page.pageNumber
        let viewport = page.getViewport(1.0)
        page.getOperatorList().then(function(opList) {
          let svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs)
          svgGfx.embedFonts = true
          svgGfx.getSVG(opList, viewport).then(function (svg) {
            record.svg_pages.push({'pg':n, 'svg':svg})
            //record.svg_pages[n] = svg.toString()
          })
        })
      })
    }
    resolve(record)
  })
}



export function progressCallback(progress) {
  // progress object contains "total" and "loaded" properties
  let percentLoaded = progress.loaded / progress.total
  console.log(percentLoaded)
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

async function createOutline(pdf, record){
  //ref: https://medium.com/@csofiamsousa/creating-a-table-of-contents-with-pdf-js-4a4316472fff
  pdf.getOutline().then(outline => {    
    if (outline){
      for (let i =0; i< outline.length; i++){
        const title = outline[i].title
        const dest = outline[i].dest
        pdf.getDestinations(dest).then(function(dests){
          const ref = dests[dest][0]
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