<template>
    <p v-if="componentBtn">
        Click to import files and populate a table:
    </p>
    <!-- The button -->
    <b-button
        id='btnImport' 
        v-b-modal="'import-modal'" 
        variant="primary"
        :class="{'btn-success': componentBtn}"
        >
        {{ btnText }}
    </b-button>

    <!-- The modal -->
    <b-modal id="import-modal" ok-only>
        <template #modal-title>
            Select files for import
        </template>
        <br>
        <form name="uploadForm">
            <div>
                <label for="uploadInput" class="custom-file-upload">
                    <b-icon-cloud-arrow-up-fill class="h2 mb-0" variant="success" /> Upload
                </label>
                <input id="uploadInput" 
                    type="file"
                    accept=".pdf" 
                    @change="previewFiles" 
                    multiple 
                    /> 
                <br/>
                <label for="fileCount">Files: &nbsp</label>
                <output id="fileCount">0</output><br/>
                <label for="fileSize">Total size: &nbsp</label>
                <output id="fileSize">0</output>
                <br/><div style="text-align: right;"><em>(note that only PDF files can be used at this time)</em></div>
            </div>
        </form>
            
        <div>
            <b-progress 
                class="progress" 
                :max="progressBar.max" 
                height="1rem"
                show-progress
                animated
                >
                <b-progress-bar 
                    :value="progressBar.value" 
                    :variant="progressBar.variant"
                    >
                    <span>Processed <strong>{{ progressBar.value }} of {{ progressBar.max }} files</strong></span>
                </b-progress-bar>
            </b-progress>
        </div>

        <template #modal-footer>
                <button @click="uploadInput" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !uploadBtn}" :disabled=uploadBtn>Upload Files</button>
                <button @click="processData" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !processBtn}" :disabled=processBtn>Process Data</button>
            </template>
    </b-modal>
</template>

<script>
import { getFileRecord } from './support/utils.js'
import { getDateFromJsNumber, getFormattedFileSize, getFileReferenceNumber } from './support/utils.js'


export default({
    name:'ImportData',
    emits:['imported-records'],
    data(){
        return {
            uploadIcon: ["success","secondary"],   //TODO
            btnText: 'Import Files',
            componentBtn: true,
            uploadBtn: true,
            processBtn: true,

            //both arrays are epemeral and will always be emptied after use
            importedFiles: [],
            processedFiles: [],

            progressBar:{
                variant: "success",
                value: 0,
                max: 0
            }
        }
    },
    methods: {
        previewFiles() {
            // Calculate total size
            let numberOfBytes = 0;
            const fileCount = uploadInput.files.length
            this.progressBar = {...this.progressBar, max: fileCount}
            for (const file of uploadInput.files) {
                numberOfBytes += file.size;
            }
            document.getElementById("fileCount").textContent = fileCount
            const fileSize = getFormattedFileSize(numberOfBytes);
            document.getElementById("fileSize").textContent = fileSize
            this.uploadBtn = false
        },
        uploadInput(){
            // Load files into records
            this.uploadBtn = true
            uploadFiles.bind(this)(uploadInput.files).then(
                (recs)=>{
                    this.importedFiles.push(...recs)
                    this.processBtn = false         
            })
        },
        processData(){
            const processedFiles = processFiles(this.importedFiles)
            this.processedFiles.push(...processedFiles)
            this.$emit('imported-records', this.processedFiles)
            this.resetModal()
            this.btnText = 'Add More Files'
        },
        resetModal(){
            this.importedFiles.length = 0
            this.processedFiles.length = 0

            this.componentBtn = false
            this.$bvModal.hide("import-modal")

            this.progressBar.value = 0
            this.progressBar.max = 0
            this.processBtn = true
        }
}
})






async function uploadFiles(files){
    // process files selected for upload and return an array of records
    let idx = 0
    const importedFiles = []
    const progress = {
        loaded: 0,
        total: 0
    }
    for (const file of files) {
        let record = await getFileRecord(file)     //TOOD:, progressCallback(progress))

        // file indexing
        record.id = String(idx)
        
        var re = /(?:\.([^.]+))?$/
        let extension = re.exec(file.name)[1]
        record.filename_original = file.name.replace('.' + extension, '')
        record.filepath = file.webkitRelativePath ? file.webkitRelativePath + '/' + record.filename_original : './'+record.filename_original
        record.filename_modified = null
        record.reference_number = getFileReferenceNumber(file.name)

        // raw
        record.file_extension = extension
        record.filetype = file.type
        record.file_size_mb = file.size
        record.date = file.lastModified

        /*inferred / searchable
        none

        //frontend field*/
        record.sort_key = 0     //record.id
        record.hit_count = 0
        record.summary = 'TODO:summary'
        record.snippets = []
        record._showDetails = false

        importedFiles.push(record)
        idx++
        this.progressBar = {...this.progressBar, value: idx}
        }
    return importedFiles;
}



function processFiles(files){
    // process files selected for upload and return an array of records
    const processedFiles = []
    for (const file of files) {
        const item = JSON.parse(JSON.stringify( file ))

        // row items
        let length_lines = 0
        if (item.length_lines_array.length > 0){
            if (item.length_lines_array.length > 1){
                length_lines = item.length_lines_array.reduce((s, v) => s += (v | 0))
            }else{
                length_lines = item.length_lines_array[0]
            }
        }else{
            length_lines = 1;
        }
        let dt = getDateFromJsNumber(item.date)
        item.original_date = item.date
        item.date = dt;
        item.length_lines = length_lines

        // body items
        let bodyArr = Object.values(item.body_pages)
        item.body = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : ''
        let clean_body = item.body
        item.clean_body = clean_body
        item.summary = clean_body.slice(0,500)   //TODO:set constant
        item.pp_toc = item.toc.map(section => `${section.title} (pg.${section.pageNumber})`)

        // prepare page numbers for search snippets
        item.accumPageLines = item.length_lines_array.map((sum => value => sum += value)(0))    //.map((sum = 0, n => sum += n))  -> assignment to undeclared variable
        // prepare images
        item.canvas_array = item.canvas_array.sort((a,b)=> a.idx - b.idx)
        item.selected_snippet_page = 1

        processedFiles.push(item)
        }
    return processedFiles;
}
</script>


<style>

#btnImport {
  margin: 5px;
}
input[type="file"] {
    display: none;
}
.custom-file-upload {
    display: inline-block;
    padding: 6px 12px;
    cursor: pointer;
}
.progress{
    margin-top:30px;
}
</style>