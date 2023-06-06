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
                    <button @click="uploadInput" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !uploadBtn}" :disabled=uploadBtn>Import Files</button>
                    <button @click="processData" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !processBtn}" :disabled=processBtn>Process Data</button>
                </template>
        </b-modal>
    </div>
</template>

<script>
import { getFileRecord, getDateFromJsNumber, getFormattedFileSize } from './utils';

export default ({
    name:'ImportData',
    emits:['imported-records'],
    data(){return {
        uploadBtn: true,
        processBtn: true,
        importedFiles: [],
        processedFiles: []
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
            this.$data.uploadBtn = false
        },
        uploadInput(){
            // Load files into records
            this.$data.uploadBtn = true
            uploadFiles(uploadInput.files).then(
                (recs)=>{
                    this.$data.importedFiles.push(...recs)
                    this.$data.processBtn = false         
            })
        },
        processData(){
            const processedFiles = processFiles(this.importedFiles)
            this.$data.processedFiles.push(...processedFiles)
            this.$bvModal.hide("import-modal")
            this.$emit('imported-records', this.processedFiles); 
        }
}
})






async function uploadFiles(files){
    // process files selected for upload and return an array of records
    let idx = 0
    const importedFiles = []
    for (const file of files) {
        let record = await getFileRecord(file);

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
        record.filetype = file.type;
        //record.page_nos = data.page_nos;
        //record.length_lines_array = data.length_lines_array;
        //record.length_lines = null;
        record.file_size_mb = file.size;
        record.date = file.lastModified;

        /*inferred / searchable
        none

        //frontend field*/
        record.snippet = null;
        record._showDetails = false;

        importedFiles.push(record);
        idx++
        }
    return importedFiles;
}



function processFiles(files){
    // process files selected for upload and return an array of records
    const processedFiles = []
    for (const file of files) {
        const item = JSON.parse(JSON.stringify( file ))

        // row items
        let length_lines = 0;
        if (item.length_lines_array.length > 0){
            if (item.length_lines_array.length > 1){
                length_lines = item.length_lines_array.reduce((s, v) => s += (v | 0));
            }else{
                length_lines = item.length_lines_array[0];
            }
        }else{
            length_lines = 1;
        }
        let dt = getDateFromJsNumber(item.date);
        item.original_date = item.date;
        item.date = dt;
        item.length_lines = length_lines;

        // body items
        let bodyArr = Object.values(item.body_pages)
        item.body = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : '';
        let clean_body = item.body
        item.clean_body = clean_body

        processedFiles.push(item);
        }
    return processedFiles;
}




</script>