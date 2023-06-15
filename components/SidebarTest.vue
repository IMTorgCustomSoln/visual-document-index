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

        lazy="false"
    >
        <div class="px-3 py-2">
            <div class="section"><b>Staging for selected notes:</b>
                <SidebarDrag v-if="isMounted"/>
                
            </div>
          </div>
    </b-sidebar>
  </div>

</template>

<script>
//import { NoteRecord } from './utils'
import SidebarDrag from './SidebarDrag.vue'

export default ({
    name: 'Sidebar',
    components: {
        SidebarDrag
    },
    data(){
        isMounted: false
    }, 
    mounted() {
        this.isMounted = true
    },
    computed: {
        meals:function(){
            return ['Hamburger',
                    'Pizza',
                    'Spaghetti',
                    'Tacos',
                    'Teriyaki Chicken'
                ];
        },
        draggingInfo() {
        return this.dragging ? "under drag" : "";
        }
    },
    methods:{
        addNote(e){
            const value = e.target.value.trim()
            if (!value) {
              return
            }
            const noteRecord = {
                id: Date.now(),
                type: 'hand',
                innerText: value
            }
            console.log(noteRecord)
            this.stagingNotes.push(noteRecord)
            e.target.value = ''
        },
        removeNote(note){
            this.stagingNotes.splice(this.stagingNotes.indexOf(note), 1)
        },
        checkMove: function(e) {
            window.console.log("Future index: " + e.draggedContext.futureIndex);
        },
        log: function(e) {
            window.console.log(e);
        }
    }
})



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