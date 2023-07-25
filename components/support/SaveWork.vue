<template>
   <!-- Open modal button -->
   <b-button
        id='btnSaveContinue' 
        v-b-modal="'save-continue-modal'"
        variant="primary"
        :class="{'btn-success': componentBtn}"
        class="fixed-large"
        >
        {{ btnText }}
    </b-button>

    <!-- modal -->
    <b-modal id='save-continue-modal' ok-only>
        <template #modal-title>
            Save current work session
        </template>
        <br>
        <!-- Explanation TODO:fix-->
        <div v-if="description">
            <p>
            Because this is an offline application, the Workspace cannot be automatically saved.  <bold style="font-weight: bold">If you close 
            your browser, all work will be lost.</bold> <br><br> 
            
            To maintain your application state, including imported data files and managed notes, the 
            Workspace data can be saved to a machine-readable file on your machine.  This can be imported, later,
            to continue where you last saved.<br><br>  
            
            <em>Note: the saved file is typically quite large in size (several megabytes).  If you want a light-weight file with only your managed notes (such as to share with team 
            members), instead, open the <code>Notes Manager</code> sidebar and click <code>Export</code> > <code>Data Storage</code></em>.
            </p>
        </div>
        <!--
        <div v-else>
            <form name="uploadForm">
                <p>
                Select a previously saved session file (ie. <code>VDI_ApplicationStateData_v*.*.*.json'</code>) to continue your work.
                </p>
            <label for="uploadAppDataInput" class="custom-file-upload">
                <b-icon-cloud-arrow-up-fill class="h2 mb-0" variant="success" /> Upload
            </label><br/>
            <input id="uploadAppDataInput" 
                   type="file" 
                   @change="previewFile"
                   accept=".json"
            />
            <ul class="no-li-dot">
                <li><label for="fileName">File: &nbsp</label><output id="fileName">{{ preview.fileName }}</output></li>
                <li><label for="fileSize">Size: &nbsp</label><output id="fileSize">{{ preview.fileSize }}</output></li>
            </ul>
        </form><br/>

        </div>-->

        <!-- Control -->
        <template #modal-footer>
            <div v-if="description">
                <b-button @click="saveWork" v-b-modal.modal-close_visit class="btn-sm m-1" variant="primary" >Save Workspace</b-button>
                <!--<b-button @click="importToContinue" v-b-modal.modal-close_visit class="btn-sm m-1" variant="primary">Continue</b-button>-->
            </div>
            <!--
            <div v-else>
                <b-button @click="uploadAppDataInput" v-b-modal.modal-close_visit class="btn-sm m-1" variant="success">Upload</b-button>
            </div>
            -->
        </template>
    </b-modal>
</template>

<script>
import { isProxy, toRaw } from 'vue'
import { DocumentIndexData, ManagedNotesData } from './data'
import { ExportAppStateFileName } from './data.js'
import { getFormattedFileSize } from './utils.js'

export default({
    name: 'SaveWork',
    //emits:['imported-workspace'],
    data(){
        return {
            btnText: 'Save Workspace',
            description: true,
            preview: {
                fileName: '',
                fileSize: ''
            },
            documentsIndex: DocumentIndexData,
            managedNotes: ManagedNotesData,

            //topics: ManagedNotesData.value.topics,
            //notes: ManagedNotesData.value.notes,
        }
    },
    methods: {
        saveWork(e){
            const create = e.target
            const object = {
                documentsIndex: this.documentsIndex,
                managedNotes: this.managedNotes
                //topics: this.topics,
                //notes: this.notes
            }
            const jsonObj = JSON.stringify( toRaw(object) )
            const a = document.createElement('a')
            var link = create.appendChild(a)
            link.setAttribute('download', ExportAppStateFileName)
            link.href = makeTextFile(jsonObj)
            document.body.appendChild(link)

            // wait for the link to be added to the document
            window.requestAnimationFrame(function () {
                var event = new MouseEvent('click')
                link.dispatchEvent(event)
                document.body.removeChild(link)
            })
            this.$bvModal.hide("save-continue-modal")
        },

        /*
        importToContinue(){
            this.description = false
        },

        
        previewFile() {
            // Preview files to upload and process
            const file = uploadAppDataInput.files[0]
            const fileSize = getFormattedFileSize(file.size)
            this.preview = {...this.preview, fileSize: fileSize}
            this.preview = {...this.preview, fileName: file.name}
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
            this.$bvModal.hide("save-continue-modal")
            this.description = true
        }*/
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

/*
async function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = event => resolve(JSON.parse(event.target.result))
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}
*/

</script>

<style scoped>
.fixed-large{
    width: 150px !important;
}
#btnSaveContinue {
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
input[type="file"] {
    display: none;
}
.custom-file-upload {
    display: inline-block;
    padding: 6px 12px;
    cursor: pointer;
}
</style>