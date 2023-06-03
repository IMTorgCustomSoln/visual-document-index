<template>
    <!--
    <b-button variant="primary" @click="setChildData">Import Files</b-button>
    -->
    <p>Click to import files and populate a table:</p>
    <b-button size="sm" v-b-modal="'import-modal'" class="btn btn-success btn-sm m-1">Import Files</b-button>
    <div>
        <!-- The modal -->
        <b-modal id="import-modal" ok-only>
            <template #modal-title>
                Select files for import
            </template>
            <br>
            <form name="uploadForm">
                <div>
                    <input id="uploadInput" type="file" @change="previewFiles" multiple /><br>
                    <label for="fileSize">Total size: &nbsp</label>
                    <output id="fileSize">0</output>
                </div>
            </form>
            <template #modal-footer>
                    <button @click="uploadInput" v-b-modal.modal-close_visit class="btn btn-success btn-sm m-1">Import</button>
                </template>
        </b-modal>
    </div>
</template>

<script>
import {DocumentRecord} from './utils.js'

export default ({
    name:'ImportData',
    emits:['imported-records'],
    data(){return {
        //newFiles: ['File-1', 'File-2', 'File-3']
        newFiles: []
    }},
    methods: {
        previewFiles() {
            // Calculate total size
            let numberOfBytes = 0;
            for (const file of uploadInput.files) {
                numberOfBytes += file.size;
            }
            const output = getFormattedFileSize(numberOfBytes);
            document.getElementById("fileSize").textContent = output;
        },
        uploadInput(){
            // Load files into records
            processFiles(uploadInput.files).then(
                (recs)=>{
                    this.$data.newFiles.push(...recs);
                    this.$bvModal.hide("import-modal");
                    this.$emit('imported-records', this.newFiles);      
            })
    }
}
})




function getFormattedFileSize(numberOfBytes, long=true) {
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
    if(long){
        output =
            exponent === 0 ?
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

function formatRecordLength(record){
    if (record.length_lines_array){
        if (record.length_lines_array.length > 1){
            let length_lines = record.length_lines_array.reduce((s, v) => s += (v | 0));
            return length_lines
        }else{
            let length_lines = record.length_lines_array[0];
            return length_lines
        }
    }else{
        return 1
    }
}



async function processFiles(files){
    // process files selected for upload and return an array of records
    let idx = 0
    const newRecords = []
    for (const file of files) {
        const record = await getFileRecord(file);

        // use for file-level attributes
        //DocumentRecord

        // file indexing
        record.id = String(idx);
        record.reference_number = null;
        record.filepath = file.webkitRelativePath ? file.webkitRelativePath : null;
        var re = /(?:\.([^.]+))?$/;
        let extension = re.exec(file.name)[1];
        record.filename_original = file.name.replace('.' + extension, '');
        record.filename_modified = null;

        // raw
        record.file_extension = extension;
        //record.filetype = file.type;
        //record.page_nos = data.page_nos;
        //record.length_lines_array = data.length_lines_array;

        /* TODO:add later
        record.length_lines = formatRecordLength(record)
        */
        record.file_size_mb = getFormattedFileSize(file.size, false)
        record.date = file.lastModified;

        /*inferred / searchable
        record.title = null;
        record.author = null;
        record.subject = null;
        record.toc = null;
        record.pp_toc = null;*/
        /*
        record.body = data.body;
        record.clean_body = null;
        record.readability_score = null;
        record.tag_categories = null;
        record.keywords = null;
        record.summary = null;*/

        /* TODO:add later
        console.log(record.body)
        let bodyArr = JSON.parse(JSON.stringify( Object.values(record.body) ));
        let clean_body_proc1 = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : '';
        let clean_body_proc2 = clean_body_proc1.replaceAll('- ','')
        record.clean_body = clean_body_proc2
        */

        //frontend field
        record.snippet = null;
        record._showDetails = false;

        newRecords.push(record);
        }
    return newRecords;
}






function getFileRecord(file){
    // Create a DocumentRecord from the FileReader() API
    return new Promise(function(resolve, reject) {
        const record = new DocumentRecord()
        record.length_lines_array = []
        record.body = {}

        const fr = new FileReader();
        var pdff = new Pdf2TextClass();
        fr.onload=function(){
            pdff.pdfToText(fr.result, null, (text) => { 
                console.log(text)
                record.body += text; 
            });
        }
        fr.readAsArrayBuffer(file);
        fr.onerror = reject;
        resolve(record)
    })
}





function Pdf2TextClass() {
        var self = this;
        this.complete = 0;

        this.pdfToText = function (data, callbackPageDone, callbackAllDone) {
            console.assert(data instanceof ArrayBuffer || typeof data == 'string');
            var loadingTask = pdfjsLib.getDocument(data);
            loadingTask.promise.then(function (pdf) {


                var total = pdf._pdfInfo.numPages;
                //callbackPageDone( 0, total );        
                var layers = {};
                for (let i = 1; i <= total; i++) {
                    pdf.getPage(i).then(function (page) {
                        var n = page.pageNumber;
                        page.getTextContent().then(function (textContent) {

                            //console.log(textContent.items[0]);0
                            if (null != textContent.items) {
                                var page_text = "";
                                var last_block = null;
                                for (var k = 0; k < textContent.items.length; k++) {
                                    var block = textContent.items[k];
                                    if (last_block != null && last_block.str[last_block.str.length - 1] != ' ') {
                                        if (block.x < last_block.x)
                                            page_text += "\r\n";
                                        else if (last_block.y != block.y && (last_block.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null))
                                            page_text += ' ';
                                    }
                                    page_text += block.str;
                                    last_block = block;
                                }

                                textContent != null && console.log("page " + n + " finished."); //" content: \n" + page_text);
                                layers[n] = page_text + "\n\n";
                            }
                            ++self.complete;
                            //callbackPageDone( self.complete, total );
                            if (self.complete == total) {
                                window.setTimeout(function () {
                                    var full_text = "";
                                    var num_pages = Object.keys(layers).length;
                                    for (var j = 1; j <= num_pages; j++)
                                        full_text += layers[j];
                                    callbackAllDone(full_text);
                                }, 1000);
                            }
                        }); // end  of page.getTextContent().then
                    }); // end of page.then
                } // of for
            });
        }; // end of pdfToText()
    }; // end of class







/*
function getFileRecord(file){
    // Create a DocumentRecord from the FileReader() API
    return new Promise(function(resolve, reject) {
        const record = new DocumentRecord()
        record.length_lines_array = []
        record.body = {}
        const reader = new FileReader();
        reader.onload = async function (e) {   //(e) => {
            let typedarray = new Uint8Array(e.target.result); //Step 4:turn array buffer into typed array
            const loadingTask = pdfjsLib.getDocument(typedarray); //Step 5:pdfjs should be able to read this
            loadingTask.promise.then(pdf => {
                //document is loaded
                record.page_nos = pdf.numPages;
                Promise.all([task1(pdf), task2(pdf), task3(pdf)]).then(function(values){
                    console.log(values)
                    const dest = values[0]
                    const meta = values[1]
                    const outline = values[2]
                    record.destinations = dest
                    record.title = meta.info.Title
                    record.subject = meta.info.Subject
                    record.author = meta.info.Author
                    record.date_created = meta.info.CreationDate
                    record.date_mod = meta.info.ModDate
                    record.keywords = meta.info.Keywords
                    record.toc_js = outline   //maybe wrong
                    //task4(pdf, record)
                })
            });
        }
        reader.readAsArrayBuffer(file);
        reader.onerror = reject;
        resolve(record);
    })
}

function task1(pdf){
    return pdf.getDestinations().then(dest => dest)
}

function task2(pdf){
    return pdf.getMetadata().then(meta => meta)
}
function task3(pdf){
    return pdf.getOutline().then(outline => {
                    if (outline){
                        outline.map(item => item.title ? item.title : null)
                    }
                })
}

function task4(pdf, record){
    return new Promise(function(resolve, reject) {
        for (let i = 1; i <= record.page_nos; i++) {
            Promise.all([ pdfGetPageText(pdf, i, record) ]).then(function(values){
                console.log(values)
            })
        }
        resolve(record)
    })
}

function pdfGetPageText(pdf, i, record){
    return pdf.getPage(i).then(page => 
        page.getTextContent().then( function(textContent){
            let n = page.pageNumber;
            let page_text = ""
            for (let item of textContent.items) {
                page_text += String(item.str);
                if (item.hasEOL==true){ page_text += ' '}   //>>>alternative: ' <EOL> '
            }
            let edit1 = page_text.replaceAll('- ','')
            record.body[n] = edit1 + "\n\n"
            let sentence_count = (edit1.match(/./g) || []).length;
            record.length_lines_array.push(sentence_count);
        })  
    )
}*/







</script>