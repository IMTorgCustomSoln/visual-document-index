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

        async saveWorkStream(e){
            const create = e.target
            const object = {
                documentsIndex: this.documentsIndex,
                managedNotes: this.managedNotes
            }
            try {
                const readStream = new Blob( [JSON.stringify(object)], { type: 'application/json' }).stream()
                //const compressedStream = readStream.pipeThrough(new TextEncoderStream())    //(new CompressionStream('gzip'))   TODO: I don't know why decoding pipeline fails
                const compressedStream = readStream.pipeThrough(new CompressionStream('gzip'))
                const fileHandle = await showSaveFilePicker( {
                    suggestedName: ExportAppStateFileName,
                    types: [
                        {
                            description: "GZIP File",
                            accept: {
                                "application/gzip": [".gz"]
                            }
                        }
                    ]
                })
                const writableStream = await fileHandle.createWritable()
                compressedStream.pipeTo(writableStream)
              } catch (err) {
                console.error(err.name, err.message);
              }
              this.$bvModal.hide("save-continue-modal")
        },


    }
})

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