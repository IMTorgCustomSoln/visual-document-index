<template>
   <!-- Open modal button -->
   <b-button
        id='btnSaveContinue' 
        v-b-modal="'save-continue-modal'"
        variant="primary"
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

        <!-- Control -->
        <template #modal-footer>
            <div v-if="description">
                <b-button @click="saveWorkStream" v-b-modal.modal-close_visit class="btn-sm m-1" variant="primary" >Save Workspace</b-button>
            </div>
        </template>
    </b-modal>
</template>

<script>
import { isProxy, toRaw } from 'vue'
import { DocumentIndexData, ManagedNotesData } from './data'
import { ExportAppStateFileName } from './data.js'

export default({
    name: 'SaveWork',
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
        }
    },
    methods: {
        saveWork(e){
            const create = e.target
            const object = {
                documentsIndex: this.documentsIndex,
                managedNotes: this.managedNotes
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

        saveWorkBlob(e){
            const create = e.target
            const object = {
                documentsIndex: this.documentsIndex,
                managedNotes: this.managedNotes
            }
            const blob = new Blob([ JSON.stringify(object) ], { type: 'application/json' })
            const a = document.createElement('a')
            var link = create.appendChild(a)
            link.setAttribute('download', ExportAppStateFileName)
            link.href = window.URL.createObjectURL(blob)
            document.body.appendChild(link)

            // wait for the link to be added to the document
            window.requestAnimationFrame(function () {
                var event = new MouseEvent('click')
                link.dispatchEvent(event)
                document.body.removeChild(link)
            })
            this.$bvModal.hide("save-continue-modal")
        },

        async saveWorkStream(e){
            const create = e.target
            const object = {
                documentsIndex: this.documentsIndex,
                managedNotes: this.managedNotes
            }
            try {
                const blob = new Blob([ JSON.stringify(object) ], { type: 'application/json' })
                // create a new handle
                const newHandle = await window.showSaveFilePicker(e);
                // create a FileSystemWritableFileStream to write to
                const writableStream = await newHandle.createWritable();
                // write our file
                await writableStream.write(blob);
                // close the file and write the contents to disk.
                await writableStream.close();
              } catch (err) {
                console.error(err.name, err.message);
              }
              this.$bvModal.hide("save-continue-modal")
        },


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