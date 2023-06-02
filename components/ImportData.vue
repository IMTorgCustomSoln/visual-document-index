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




function getFormattedFileSize(numberOfBytes) {
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
    const output =
        exponent === 0 ?
        `${numberOfBytes} bytes` :
        `${approx.toFixed(3)} ${
              units[exponent]
            } (${numberOfBytes} bytes)`;
    return output;
}


async function processFiles(files){
    // process files selected for upload and return an array of records
    let idx = 0
    const newRecords = []
    for (const file of files) {
        let record = await getFileRecord(file);
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
        record.length_lines = 1;
        if (record.length_lines_array.length > 0){
            if (record.length_lines_array.length > 1){
                record.length_lines = record.length_lines_array.reduce((s, v) => s += (v | 0));
            }else{
                record.length_lines = record.length_lines_array[0];
            }
        }
        //record.file_size_mb = file.size;
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
        let bodyArr = JSON.parse(JSON.stringify( Object.values(record.body) ));
        let clean_body_proc1 = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : '';
        let clean_body_proc2 = clean_body_proc1.replaceAll('- ','')
        record.clean_body = clean_body_proc2

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
        const reader = new FileReader();
        reader.onload = (e) => {
            let typedarray = new Uint8Array(e.target.result); //Step 4:turn array buffer into typed array
            const loadingTask = pdfjsLib.getDocument(typedarray); //Step 5:pdfjs should be able to read this
            loadingTask.promise.then(pdf => {
                //document is loaded
                record.page_nos = pdf.numPages;
                pdf.getDestinations().then(dest => {
                    record.destinations = dest
                })
                pdf.getMetadata().then(meta => {
                    record.title = meta.info.Title
                    record.subject = meta.info.Subject
                    record.author = meta.info.Author
                    record.date_created = meta.info.CreationDate
                    record.date_mod = meta.info.ModDate
                    record.keywords = meta.info.Keywords
                })
                pdf.getOutline().then(outline => {
                    if (outline){
                        record.toc_js = outline.map(item => item.title ? item.title : null)
                    }
                    return record
                }).then(record => {
                    for (let i = 1; i <= record.page_nos; i++) {
                        const page = pdf.getPage(i)
                        return page
                        .then(page => {
                            const n = page.pageNumber;
                            let page_text = "";
                            const textContent = page.getTextContent()
                            return textContent
                        .then(textContent => {
                            for (let item of textContent.items) {
                                page_text += String(item.str);
                                if (item.hasEOL==true){ page_text += ' '}   //>>>alternative: ' <EOL> '
                            }
                            let sentence_count = (page_text.match(/./g) || []).length;
                            record.length_lines_array.push(sentence_count);
                            record.body[n] = page_text + "\n\n";
                        })
                        })
                    }
                })
            });
        }
        reader.readAsArrayBuffer(file);
        reader.onerror = reject;
        resolve(record);
    })
}


</script>