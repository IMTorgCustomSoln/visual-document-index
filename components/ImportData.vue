<template>
    <!-- Open modal button -->
    <b-button
        id='btnImport'
        v-b-modal="'import-modal'" 
        variant="primary"
        :class="{'btn-success': componentBtn}"
        class="fixed-large"
        >
        {{ btnText }}
    </b-button>
    <b-popover
        id="btnImportPop" 
        target="btnImport"
        triggers="manual"
        :show.sync="componentBtn"
        placement="top"
        container="null"
        >
        Click to import files and populate a table. Follow
        the green buttons if you're a new user.
    </b-popover>

    <!-- modal -->
    <b-modal 
        id="import-modal" 
        ok-only>
        <template #modal-title>
            Import files or workspace
        </template>
        <p>
        To begin, import individual files or continue from a previous state by 
            uploading from a saved workspace file.
        </p>

        <!-- tabs -->
        <b-tabs
            v-model="activeTab"
            active-nav-item-class="font-weight-bold" 
            content-class="mt-3"
            >

            <!-- Files -->
            <b-tab title="Files" 
                active
                id="tabFiles"
                >
                <!--  // maybe some explanation for why the Workspace tab is disabled is needed
                <b-popover
                    target="tabFiles"
                    triggers="hover"
                    :show.sync="disableWorkspaceBtn"
                    placement="top"
                    container="null"
                    >
                    Workspace tab is disabled.  Loading a Workspace after loading 
                    files is not allowed as it will remove all current data.  To 
                    load a Workspace, reload the app, first.
                </b-popover>
                -->

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
                        <ul class="no-li-dot">
                            <li><label for="fileCount">Files: &nbsp</label> <output id="fileCount">{{ preview.fileCount }}</output></li>
                            <li><label for="fileSize">Total size: &nbsp</label> <output id="fileSize"> {{ preview.fileSize }}</output></li>
                            <li><label for="estimatedTime">Approximate time to upload and process: &nbsp</label> <output id="estimatedTime"> {{ preview.estimateProcessTime }}</output></li>
                        </ul>
                    </div>
                </form>

                <!-- Progress Bar -->
                <div>
                    <b-progress 
                        class="progress" 
                        :max="progressBar.max" 
                        height="1rem"
                        show-progress
                        animated
                        >
                        <b-progress-bar 
                            :value="progressBar.fileProgress" 
                            :variant="progressBar.variant"
                            >
                            <span>
                                Processed <strong>{{ progressBar.fileProgress }} 
                                of {{ progressBar.max }} bytes</strong>
                            </span>
                        </b-progress-bar>
                    </b-progress>
                    <br/>

                    <!-- Conditional Results Display -->
                    <div v-if="resultDisplay.display" style="color: red">
                        <bold style="font-weight: bold">Results: </bold><br/>
                        Actual upload time was {{ resultDisplay.actualProcessTime }}<br/>
                        <div v-if="resultDisplay.checkFilesUsable.length > 0">
                            The following files are not loaded because they do not appear to be searchable:<br/>
                            <div v-for="filepath in resultDisplay.checkFilesUsable">
                                <div>{{ filepath }}</div>
                            </div>
                        </div>
                        <div v-else>
                            All files are loaded
                        </div>
                        <b-button
                            size="sm" 
                            variant="primary" 
                            class="fixed-small"
                            @click="exportLogsToText" 
                            >
                            Logs
                        </b-button>
                    </div><br/>

                    <!-- Notes -->
                    <div>
                        <em>
                            Note that at this time:
                            <ul>
                                <li>only PDF files can be used</li>
                                <li>PDF files must contain searchable text - not images</li>
                                <li>only 6 files should be imported per upload processing</li>
                                <li>subsequent uploads are only performed on files with different reference numbers</li>
                            </ul>
                        </em>
                    </div>
                </div>
            </b-tab>

            
            <!-- Workspace -->
            <b-tab 
                title="Workspace"
                :disabled = disableWorkspaceBtn
                id="tabWorkspace"
                > <!-- popover placed in tab-0 -->
                <div>
                <form name="uploadForm">
                    <p>
                    Select a previously saved session file (ie. <code>VDI_ApplicationStateData_v*.*.*.json'</code>) to continue your work.
                    </p>
                <label for="uploadAppDataInput" class="custom-file-upload">
                    <b-icon-cloud-arrow-up-fill class="h2 mb-0" variant="success" /> Upload
                </label><br/>
                <input id="uploadAppDataInput" 
                       type="file" 
                       @change="previewWorkspace"
                       accept=".json"
                />
                <ul class="no-li-dot">
                    <li><label for="fileName">File: &nbsp</label><output id="fileName">{{ preview.fileName }}</output></li>
                    <li><label for="fileSize">Size: &nbsp</label><output id="fileSize">{{ preview.fileSize }}</output></li>
                </ul>
                </form>
                </div>
            </b-tab>
        </b-tabs>



        <!-- Control -->
        <template #modal-footer>
            <div v-if="activeTab==0">
                <b-button @click="uploadInput" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !uploadBtn}" :disabled=uploadBtn>Upload Files</b-button>
                <b-button @click="processData" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !processBtn}" :disabled=processBtn>Process Data</b-button>
            </div>
            <div v-else>
                <b-button @click="uploadAppDataInput" v-b-modal.modal-close_visit class="btn-sm m-1" :class="{'btn-success': !uploadWorkspaceBtn}" :disabled=uploadWorkspaceBtn>Upload</b-button>
            </div>
        </template>

    </b-modal>
</template>

<script>
import { ExportLogsFileName } from './support/data.js'
import { DocumentIndexData, ManagedNotesData } from './support/data.js'

import { getFileRecord } from './support/utils.js'
import { getEstimatedProcessTime, getFormattedMilliseconds } from './support/utils.js'
import { getDateFromJsNumber, getFormattedFileSize, getFileReferenceNumber } from './support/utils.js'


export default({
    name:'ImportData',
    emits:['imported-records', 'imported-workspace'],
    data(){
        return {
            uploadIcon: ["success","secondary"],   //TODO
            btnText: 'Import Data',
            activeTab: 0,
            componentBtn: true,
            uploadBtn: true,
            processBtn: true,
            uploadWorkspaceBtn: true,
            disableWorkspaceBtn: false,

            documentsIndex: DocumentIndexData,
            managedNotes: ManagedNotesData,

            preview: {
                fileCount: 0,
                fileName: '',
                fileSize: 0.0,
                estimateProcessTime: '0.0 sec'
            },

            //both arrays are epemeral and will always be emptied after use
            importedFiles: [],
            processedFiles: [],

            progressBar:{
                variant: "success",
                importLogs: [],
                fileProgress: 0,
                totalProgress: 0,
                max: 0
            },
            
            resultDisplay: {
                display: false,
                actualProcessTime: 0,
                checkFilesUsable: [],
            }
        }
    },
    mounted(){
        this.$root.$on('bv::modal::show', (bvEvent, modalId)=> {
            if(modalId=="import-modal" ){
                this.componentBtn = false
            }
        })
        /* //not necessary
        this.$root.$on('bv::modal::hide', (bvEvent, modalId)=> {
            if(modalId=="import-modal" ){
                this.componentBtn = true
            }
        })*/
    },
    methods: {
        previewFiles() {
            // Preview files to upload and process
            let numberOfBytes = 0;
            const fileCount = uploadInput.files.length
            for (const file of uploadInput.files) {
                numberOfBytes += file.size;
            }
            this.progressBar = {...this.progressBar, max: numberOfBytes}
            this.preview = {...this.preview, fileCount: fileCount}
            const fileSize = getFormattedFileSize(numberOfBytes)
            this.preview = {...this.preview, fileSize: fileSize}
            const estimatedTime = getEstimatedProcessTime(fileCount, numberOfBytes)
            this.preview = {...this.preview, estimateProcessTime: estimatedTime}
            this.uploadBtn = false
        },
        uploadInput(){
            // Load files into records
            this.uploadBtn = true
            uploadFiles.bind(this)(uploadInput.files).then(
                (recs)=>{
                    this.importedFiles.push(...recs)
                    this.getResultDisplay()
                    this.processBtn = false         
            })
        },
        processData(){
            // Process files by adding / modifying attributes
            const processedFiles = processFiles(this.importedFiles)
            this.processedFiles.push(...processedFiles)

            this.$emit('imported-records', this.processedFiles)
            this.disableWorkspaceBtn = true
            this.resetModal()
            this.btnText = 'Add More Files'
        },
        getResultDisplay(){
            //actual process time
            const finalLogItemIdx = this.progressBar.importLogs.length
            const finalLogItem = this.progressBar.importLogs[finalLogItemIdx-1]
            const endTime = parseInt( finalLogItem.split(':')[0] )
            const startTime = parseInt( this.progressBar.importLogs[0].split(':')[0] )
            const duration = endTime - startTime    //in milliseconds, index based on performance.now() integer length
            this.resultDisplay = {...this.resultDisplay, actualProcessTime: getFormattedMilliseconds(duration) }

            //check files for searchable text
            for (const file of this.processedFiles){
                check_PageCount = file.bodyArr.filter(pageCharCount => pageCharCount < 1000)
                if (check_PageCount.length > 0){
                    this.resultDisplay.checkFilesUsable.push( file.filepath )
                }
            }
            this.resultDisplay.display = true
        },


        previewWorkspace(){
            // Preview files to upload and process
            const file = uploadAppDataInput.files[0]
            const fileSize = getFormattedFileSize(file.size)
            this.preview = {...this.preview, fileSize: fileSize}
            this.preview = {...this.preview, fileName: file.name}
            this.uploadWorkspaceBtn = false
        },
        async uploadAppDataInput(){
            const file = uploadAppDataInput.files[0]
            const object = await parseJsonFile(file)

            this.documentsIndex.documents.length = 0
            this.managedNotes.topics.length = 0
            this.managedNotes.notes.length = 0

            Object.assign(this.documentsIndex, object.documentsIndex)
            Object.assign(this.managedNotes.topics, object.managedNotes.topics)
            Object.assign(this.managedNotes.notes, object.managedNotes.notes)

            this.$emit('imported-workspace', true)
            this.disableWorkspaceBtn = true
            this.resetModal()
            this.btnText = 'Add More Files'
        },


        resetModal(){
            this.importedFiles.length = 0
            this.processedFiles.length = 0

            this.componentBtn = false
            this.uploadBtn = true
            this.processBtn = true
            this.uploadWorkspaceBtn = true
            this.$bvModal.hide("import-modal")

            this.preview.fileName = ''
            this.preview.fileSize = 0.0
            this.preview.fileCount = 0

            this.progressBar.fileProgress = 0
            this.progressBar.totalProgress = 0
            this.progressBar.max = 0

            this.resultDisplay.display = false
            this.resultDisplay.actualProcessTime = 0
            this.resultDisplay.checkFilesUsable.length = 0

            this.processBtn = true
        },
        exportLogsToText(e){
            const create = e.target
            const output = [...this.progressBar.importLogs]
            const strOutput = output.join(' ')
            const a = document.createElement('a')
            var link = create.appendChild(a)
            link.setAttribute('download', ExportLogsFileName)
            link.href = makeTextFile(strOutput)
            document.body.appendChild(link)

            // wait for the link to be added to the document
            window.requestAnimationFrame(function () {
                var event = new MouseEvent('click')
                link.dispatchEvent(event)
                document.body.removeChild(link)
            })
        },
        getFormattedFileSize(bytes, long){
            getFormattedFileSize(bytes, long)
        }
}
})





function makeTextFile(text) {
    let textFile = null
    const data = new Blob([text], {type: 'text/plain'})            
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile)
    }         
    textFile = window.URL.createObjectURL(data)          
    return textFile
}

async function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = event => resolve(JSON.parse(event.target.result))
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}


async function uploadFiles(files){
    // process files selected for upload and return an array of records
    let idx = 0
    const importedFiles = []
    const progress = {
        loaded: 0,
        total: 0
    }
    for (const file of files) {
        const FileStore = {
            idx: idx, 
            file:file, 
            ctx: this.progressBar
        }
        let record = await getFileRecord(FileStore)

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


<style scoped>

#btnImport {
  margin: 5px;
}
.no-li-dot{
    list-style-type: none;
    padding-left: 10px;
    margin-bottom: 0px !important;
}
.no-li-dot label{
    margin: 0px;
}
em{
    font-size: .85rem;
}
.fixed-small{
    width: 105px !important;
}

.btn-sm {
  padding: .25rem .5rem;
  font-size: .875rem;
  line-height: 1.5;
  border-radius: .2rem;
}   

.fixed-large{
    width: 150px !important;
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