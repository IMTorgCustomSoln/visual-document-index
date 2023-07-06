<template>
    <div v-if="initializeTable">
        <!--refs
            * showDetails: https://stackoverflow.com/questions/52327549/bootstrap-vue-table-show-details-when-row-clicked
            * reactivity: https://github.com/bootstrap-vue/bootstrap-vue/issues/2960
            * max recursion error can occur if filtering or other props are not correct
        -->
        <b-table hover 
          :items="items" 
          :fields="fields"
          :filter="tableFilter"
          :filter-function="onFiltered"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"

          primary-key='id'
          striped small
          responsive="sm" sticky-header="1000px"
          bordered
          thead-class="tableHead bg-dark text-white"
          @row-clicked="expandAdditionalInfo"                     
          >

          <template #cell(show_details)="row">
              <!-- As `row.showDetails` is one-way, we call the toggleDetails function on @change -->
              <b-form-checkbox v-model="row.detailsShowing" @change="row.toggleDetails">
                -
              </b-form-checkbox>
            </template>

        <template #row-details="row">
              <b-card>
                <b-row class="mb-2">
                    <b-col sm="6" class="text-sm-left">
                        <b-tabs
                            v-model="activeTab"
                            active-nav-item-class="font-weight-bold" 
                            content-class="mt-3">
                            <b-tab title="Summary" active>
                                <b-card>
                                <b-row>
                                    <b-col sm="5" class="text-sm-left">
                                        <b-row ><b>Author: &nbsp</b> {{row.item.author}}</b-row>
                                        <b-row ><b>Subject: &nbsp</b> {{row.item.subject}}</b-row>
                                        <b-row ><b>Keywords: &nbsp</b> {{row.item.keywords}}</b-row>
                                    </b-col>
                                    <b-col sm="7" class="text-sm-left">
                                        <b>Contents:</b> <br><span v-html="row.item.pp_toc.join('<br>')"></span> 
                                    </b-col>
                                </b-row>
                            </b-card>
                            </b-tab>
                            <b-tab title="FlipBook" lazy>
                                <b-card>
                                <b-row>
                                    <b-col sm="9">
                                        <FlipBook 
                                            :selectedPage="searchResults.mouseOverSnippet" 
                                            :imageArray="row.item.canvas_array"
                                            />
                                    </b-col>
                                </b-row>
                                </b-card>
                            </b-tab>
                        </b-tabs>
                    </b-col>
                
                <b-col sm="6" class="text-sm-left">
                    <div v-if="!searchResults.totalDocuments"><b>Document summary: </b> <br/>
                        {{ row.item.summary }}
                    </div>
                    <div v-else><b>Search results in {{ row.item.hit_count }} hits: </b> <Guide v-bind="guides.snippet" /> </div><!--, showing the first {{ searchResults.displayLimit }}:</b></div>-->
                    <br/>
                    <div class="left_contentlist">
                        <div class="itemconfiguration">
                            <div id="search-results" v-for="(snippet, index) in row.item.snippets">
                                <div class="snippet" v-on:mouseover="selectSnippetPage(row.item.id, snippet)">
                                    <span :id="row.item.filepath + '-index_' + index" v-html="snippet"></span>
                                    <b-button size="sm" v-on:click="postNote($event)">Note
                                    </b-button>
                                </div>
                                <br/>
                            </div>
                        </div>
                    </div> 
                </b-col>
                </b-row>
              </b-card>
            </template>

        </b-table>
    </div>
</template>


<script>
import { getDateFromJsNumber, getFormattedFileSize } from './support/utils.js'
import FlipBook from './FlipBook.vue'
import Guide from './support/Guide.vue'



export default ({
    name: 'Table',
    props:{
        records: Array
    },
    watch: { 
        records: {
            handler: function(newVal, oldVal) {
                //console.log('Prop changed: ', newVal, ' | was: ', oldVal)
                if (this.$data.initializeTable==false && 
                    Array.isArray(this.$props.records) && 
                    this.$props.records.length > 0
                    ){
                    this.createTable();
                }
            },
            deep: false
        }
    },
    emits:['send-note'],
    components: {
        FlipBook,
        Guide
    },
    data(){
        this.fields = fields
        
        return {
            initializeTable: false,
            items: [],
            query: '',
            tableFilter: [],
            sortBy: 'sort_key',
            sortDesc: false,
            activeTab: 0,
            searchResults: {
                count: 0,
                totalDocuments: 0,
                searchTerms: '',
                displayLimit: 0,
                errorMsg: '',
                mouseOverSnippet: ''
            },
            guides: {
                snippet:{
                    id:'snippet',
                    title:'Search Results',
                    markdown:`The search results display as snippets of text 
containing the highlighted search terms.  The begining of the text includes
the page number, and the location of text in characters from the begining of the
page, such as \`pg.3 | char.5340)\`.  

When the cursor passes over an individual result snippet, an orange background will
note its selection, and the document images (to the left) will display the page of 
the text.

At the end of the snippet of text is a \`Note\` button.  When clicked, the Managed
Notes sidebar displays and the text snippet appears in the Staging Area.  It is 
ready to be organized with the note Topics.`
                }
            }
        }
    },
    methods: {
        selectSnippetPage(id, snippet){
            const mouseOverSnippet = `${id}-${snippet}`
            this.searchResults = {...this.searchResults, mouseOverSnippet: mouseOverSnippet}
        },
        postNote(event){
            const element = event.target.parentElement.children[0]
            //TODO: no the code below should use `new NoteRecord()`, but from within Draggable - not here
            const noteItem = {
                id: element.id.toString(),
                list: 'stagingNotes',
                type: 'auto',
                innerHTML: element.innerHTML.toString(),
                innerText: element.innerText.toString()
            }
            //console.log(noteItem)
            this.$emit('send-note', noteItem);
        },

        createTable() {
            // Populate the table with the transformed data records
            for (const record of this.$props.records) {
                const item = JSON.parse(JSON.stringify( record ))
                this.items.push( item )
            }
            this.initializeTable = true;
        },



        onFiltered(row, filter) {
            // Applied to each table row to determine if it 
            //should be displayed   //TODO: does this need to be computed?
            if (filter.length == 0) {
                return true;
            } else if (filter.includes(row.id)){
                return true;
            } else {
                return false;
            }
        },

        resetItem(item){
            item.sort_key = item.id
            item.hit_count = 0
            item.snippets = []
        },

        /*
        resetAllItems(){
            this.items.map(item => {
                this.resetItem(item)
            })
            this.searchResults = {...this.searchResults, count: 0}
            this.searchResults = {...this.searchResults, totalDocuments: 0}
            this.searchResults = {...this.searchResults, searchTerms: ''}
            this.searchResults = {...this.searchResults, displayLimit: 0}

            this.sortDesc = false
            this.tableFilter.length = 0
        },*/

        // buttons and formatting
        expandAll() {
            this.items.map(item => this.$set(item, '_showDetails', true))
        },
        collapseAll() {
            this.items.map(item => this.$set(item, '_showDetails', false))
        },
        expandAdditionalInfo(row) {
            row._showDetails = !row._showDetails;
        },
        formatDateAssigned(value) {
            const dt = getDateFromJsNumber(value)
            return dt;
        },
        getFormattedFileSize(value) {
            return getFormattedFileSize(value, false);
        },
        getFormattedPath(path) {
            return path ? path : './';
        }
    }
})






// Table data items
const fields = [{
        key: 'sort_key',
        label: 'Score',
        sortable: true
    }, {
        key: 'id',
        label: 'Id'
    }, {
        key: 'reference_number',
        label: 'Reference',
        sortable: true,
    }, {
        key: 'filepath',
        label: 'Path',
        sortable: true,
        formatter: "getFormattedPath"
    }, {
        key: 'title',
        label: 'Title',
        sortable: true
    }, {
        key: 'page_nos',
        label: 'Pages',
        sortable: true
    }, {
        key: 'length_lines',
        label: 'Sentences',
        sortable: true
    }, {
        key: 'file_size_mb',
        label: 'File Size',
        sortable: true,
        formatter: "getFormattedFileSize"
    }, {
        key: 'date',
        sortable: true,
        //formatter: "formatDateAssigned"
    }]



</script>


<style>
#table-panel input {
    margin:5px;
}
#table-panel button {
    margin:5px;
}
#search-results {
    font-size:12px;
}
.errorMsg {
    color: red;
}
.snippet > .btn-sm {
    font-size:8px;
    padding:2px;
}

/*ref: http://jsfiddle.net/7w8TC/1/ */
.itemconfiguration {
    height:700px;
	width:550px;		
    overflow-y:auto;
	float:left;
	position:relative;
	margin-left:-5px;
}
.left_contentlist {
    width:550px;
    float:left;
    padding:0 0 0 5px;
    position:relative;
    float:left;
    border-right: 1px #f8f7f3 solid;
}
.snippet:hover{
    background: #ffeecf;
}
</style>