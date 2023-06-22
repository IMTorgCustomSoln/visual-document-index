<!--
    ref: https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript
-->

<template>
    <div id="sidebar-btns">
    <b-button id="create" size="sm" @click="exportToFile">Export</b-button>

    <b-button v-b-modal.import-notes-modal size="sm">Import</b-button>
        <b-modal id="import-notes-modal">
            <template #modal-title>
                Select 'ManagedNotes' file
            </template>
            <form name="uploadForm">
                <label for="uploadInput" class="custom-file-upload">
                    <b-icon-cloud-arrow-up-fill class="h2 mb-0" variant="success" /> Upload
                </label><br/>
                <input id="uploadInput" 
                       type="file" 
                       @change="previewFile"
                       accept=".json"
                />
                <label for="fileName">File: &nbsp</label>
                <output id="fileName">{{ file }}</output>
            </form><br/>
                Select whether to append to existing notes or replace them:
                <template #modal-footer>
                    <button @click="appendNotes" v-b-modal.modal-close_visit class="btn-sm m-1">Append</button>
                    <button @click="replaceNotes" v-b-modal.modal-close_visit class="btn-sm m-1">Replace</button>
                </template>
        </b-modal>
    </div>
</template>

<script>
import { isProxy, toRaw } from 'vue'
import {ExportFileName, ManagedNotesData} from './utils.js'


export default{
    name: 'NotesIO',
    data(){
        return {
            topics: ManagedNotesData.value.topics,
            notes: ManagedNotesData.value.notes,
            file: ''
        }
    },
    methods:{
        exportToFile(e){
            const create = e.target
            const object = {
                topics: this.topics,
                notes: this.notes
            }
            const jsonObj = JSON.stringify( toRaw(object) )
            const a = document.createElement('a')
            var link = create.appendChild(a)
            link.setAttribute('download', ExportFileName)
            link.href = makeTextFile(jsonObj)
            document.body.appendChild(link)

            // wait for the link to be added to the document
            window.requestAnimationFrame(function () {
                var event = new MouseEvent('click')
                link.dispatchEvent(event)
                document.body.removeChild(link)
            })
        },
        previewFile() {
            const file = uploadInput.files[0]
            this.file = file.name
        },
        async appendNotes(){
            const file = uploadInput.files[0]
            const object = await parseJsonFile(file)
            this.topics.push(...object.topics)
            this.notes.push(...object.notes)
            this.$bvModal.hide("import-notes-modal")
        },
        async replaceNotes(){
            const file = uploadInput.files[0]
            const object = await parseJsonFile(file)
            this.topics.length = 0
            this.notes.length = 0
            Object.assign(this.topics, object.topics)
            Object.assign(this.notes, object.notes)
            this.$bvModal.hide("import-notes-modal")
        }
    }
}


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

</script>


<style>
/*TODO: align right
#sidebar-btns{
    margin-left: auto; 
    margin-right: 0;
    display: block;
    display: inline-block;
    float: right;
}#si */

.btn-sm {
    font-size:12px;
    padding:2px;
    margin:5px;
}

</style>