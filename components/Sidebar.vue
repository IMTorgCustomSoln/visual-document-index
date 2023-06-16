<template>
  <div>
    <b-button id='btnSidebar' ref='btnSidebar' v-b-toggle.sidebar>Manage Notes</b-button>

    <b-sidebar 
        id="sidebar" 
        title="Manage Notes"
        width="500px" 
        right
        :backdrop-variant="variant"
        backdrop 
        shadow
    >
        <div class="px-3 py-2">
            <div class="section"><h3>Notes Staging Area</h3>
                <div>
                    <label for="noteName">Create new personal note:</label>
                    <input type="text" 
                    name="noteName" 
                    ref="noteName"
                    style="margin-left:8px"
                    autofocus 
                    placeholder="add note..."
                    @keyup.enter="addNote"
                    >
                </div>
                <Draggable :listName="stagingNotesList"/>
                
                

            </div>
            <div class="section"><h3>Topics</h3>
                <div>
                    <label for="topicName">Create new topic:</label>
                    <input type="text" 
                    name="topicName" 
                    ref="topicName"
                    style="margin-left:8px"
                    autofocus 
                    placeholder="add topic..."
                    @keyup.enter="addTopic"
                    >
                </div>
                <div>
                    <div v-for="topic in topics" 
                        :key="topic.id"
                        >
                        <div>{{ topic.title }} <button class="destroy" @click="removeTopic(topic)">x</button> </div>
                        <Draggable :listName="topic.dropZoneName"/>
                    </div>
                </div>
            </div>
          </div>
    </b-sidebar>
  </div>
</template>



<script>
import NoteRecord from './utils'
import shared_array from './utils.js'
import Draggable from './Draggable.vue'

const stagingNotesList = 'stagingNotes'


export default ({
    name: 'Sidebar',
    props:['note'],
    watch: { 
        note: {
            handler: function(newNote, oldNote) {
                console.log('Prop changed: ', newNote, ' | was: ', oldNote)
                const noteItem = JSON.parse(JSON.stringify( newNote ))
                this.stagingNotes.push(noteItem)
                this.$refs.btnSidebar.click()
                },
                deep: true
        }
    },
    components: {
        Draggable
    },
    data(){
        return {
            stagingNotes: shared_array,
            topics: [],

            stagingNotesList: stagingNotesList,
            dropZoneName: {
                createDropList: ''
            }
        }
    },
    /*
    computed: {
        draggingInfo() {
        return this.dragging ? "under drag" : "";
        }
    },*/
    methods:{

        // Topics
        addTopic(e){
            const value = e.target.value.trim()
            if (!value) {
              return
            }
            const dzName = camelize(value)
            this.dropZoneName = {...this.dropZoneName, createDropList: dzName}
            const topicRecord = {
                id: Date.now(),
                title: value,
                dropZoneName: dzName
            }
            this.topics.push(topicRecord)
            e.target.value = ''
        },
        removeTopic(topic){
            this.topics.splice(this.topics.indexOf(topic), 1)
        },

        // Notes
        addNote(e){
            const value = e.target.value.trim()
            if (!value) {
              return
            }
            const noteRecord = {
                id: Date.now(),
                list: stagingNotesList,
                type: 'hand',
                innerHTML: '',
                innerText: value,
            }
            this.stagingNotes.push(noteRecord)
            e.target.value = ''
        },
        removeNote(note){
            this.stagingNotes.splice(this.stagingNotes.indexOf(note), 1)
        },
        /*
        editNote(topic) {
            this.beforeEditCache = topic.title
            this.editedTopic = topic
        },*/
        checkMove: function(e) {
            window.console.log("Future index: " + e.draggedContext.futureIndex);
        },
        log: function(e) {
            window.console.log(e);
        }
    }
})

// Support Functions

function camelize(str) {
    //Turn any string into camelCase
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

/*
TODO: is this promise needed to create a NoteRecord object?
async function addNoteFromTable(newNote){
    return new Promise(function(resolve, reject){
        const noteRec = new NoteRecord(
                newNote.id, 
                stagingNotesList, 
                'auto', 
                newNote.innerHTML, 
                newNote.innerText
                )
        resolve(noteRec)
    })
}*/


</script>



<style scoped>
#btnSidebar {
  float:right;
}
.note {
    font-size: 12px;
}
.section h3 {
    padding-top: 20px;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}


/*ref: https://vuejs.org/examples/#todomvc
.destroy {
	display: none;
	position: absolute;
	top: 0;
	right: 10px;
	bottom: 0;
	width: 40px;
	height: 40px;
	margin: auto 0;
	font-size: 30px;
	color: #949494;
	transition: color 0.2s ease-out;
}
.destroy:hover,
.destroy:focus {
	color: #C18585;
}
.destroy:after {
	content: '×';
	display: block;
	height: 100%;
	line-height: 1.1;
}*/

</style>