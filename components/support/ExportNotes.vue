<!--
    ref: https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript
-->

<template>
    <b-button id="create" size="sm" @click="exportToFile">Export</b-button>
    <b-button size="sm" @click="importFromFile">Import</b-button>
</template>

<script>
import { isProxy, toRaw } from 'vue'
import shared_array from './utils.js'


export default{
    name: 'ExportNotes',
    props: ['notes', 'topics'],
    methods:{
        exportToFile(e){
            const create = e.target
            //if (!isProxy(shared_array)){}
            const textbox = JSON.stringify( toRaw(shared_array)._rawValue )
            const a = document.createElement('a')
            var link = create.appendChild(a)
            link.setAttribute('download', 'notes.json')
            link.href = makeTextFile(textbox)
            document.body.appendChild(link)

            // wait for the link to be added to the document
            window.requestAnimationFrame(function () {
                var event = new MouseEvent('click')
                link.dispatchEvent(event)
                document.body.removeChild(link)
            })

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


</script>


<style>

.btn-sm {
    font-size:12px;
    padding:2px;
    margin:5px;
}

</style>