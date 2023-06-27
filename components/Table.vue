<template>
<div>

    <!-- Search -->
    <b-row id="table-panel">
        <b-col>
            <span>
                <h5 style="display:inline">Search: </h5>
                <Guide v-bind="guides.search"/>
                <input type="text" class="form-control" id="search-field" v-model="query" @input="searchQuery" placeholder="type search text here..." />
                <div v-if="!searchResults.errorMsg">{{ searchResultsCount }}</div>
                <div v-else class="errorMsg"> {{ searchResults.errorMsg }}</div>
            </span>
            <div>
                <b-button size="sm" v-on:click="expandAll" >Expand All</b-button>
                <b-button size="sm" v-on:click="collapseAll" >Collapse All</b-button>
            </div>
        </b-col>
    </b-row>

        <div>
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
            </div>
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
        this.lunrIndex = null
        
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
                search:{
                    id:'search',
                    title:'Search Patterns',
                    markdown:`The following are patterns used in search terms:
* \`foo\` - all search is on stemmed terms so dno't worry about case or word ending
* \`+foo +bar\` - for logical AND search; otherwise, all search use OR with terms
* \`+foo bar -baz\` - search without 'baz'
* \`*foo\` - search terms with characters before foo
* \`title: foo\` - only search document titles for term foo
* \`foo^10 bar\` - weight term foo 10-times the importance of bar
* \`foo~1\` - one edit distance of foo (fuzzy matching)
`
                },
                snippet:{
                    id:'snippet',
                    title:'Search Results',
                    markdown:`The search results display as snippets of text 
containing the highlighted search terms.  The begining of the text includes
the page number, and the location of text in characters from the begining, such as 
\`pg.3 | char.5340)\`.  

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
    computed: {
        searchResultsCount(){
            return this.query != '' ? `Search returned ${this.searchResults.count} hits, in ${this.searchResults.totalDocuments} documents, using terms: ${this.searchResults.searchTerms}`  : ''
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
            //console.log(this.items)

            //create lunr index
            const docs = this.items;
            const lunrIndex = lunr(function() {
                this.ref('id')
                this.field('clean_body')
                this.metadataWhitelist = ['position']
                docs.forEach(function(doc) {
                    this.add(doc)
                }, this)
            })
            //add to context
            this.lunrIndex = lunrIndex;
            this.initializeTable = true;
        },

        searchQuery() {
            /* Provide tableFilter of selected rows' id based on `this.query` input
            ~~_Note_: `search()` must be instatiated in template, so `return ''` is 
            used.  This is not clean, but computed's cacheing ability still makes
            it preferable over other methods.~~   =>  previously `computed`
            :query str - from text input, should match lunrjs patterns
            :filter [] - selected files' ids
            */
            console.log(this.query)
            this.searchResults = {...this.searchResults, errorMsg: ''}

            if (this.query.length === 0){
                this.resetAllItems()
                return false

            } else if (this.lunrIndex) {
                
                //query lunrjs index
                const queryVal = this.query
                var searchTerms = ''
                var results = ''
                try {
                    searchTerms = this.lunrIndex.pipeline.run(lunr.tokenizer(queryVal))
                    this.searchResults = {...this.searchResults, searchTerms: searchTerms}
                    results = this.lunrIndex.search(queryVal).map(resultFile => { return resultFile })
                } catch (error) {
                    this.searchResults = {...this.searchResults, errorMsg: error}
                    this.resetAllItems()
                    return false
                }
                const resultIds = results.map(resultFile => resultFile.ref)
                console.log(resultIds)

                //get hit counts for individual doc and total docs
                const resultGroups = []
                for(let resultFile of results){
                    let new_keys = Object.keys( resultFile.matchData.metadata )
                    let counts = []
                    let positions = []
                    let rec = {}
                    rec['ref'] = resultFile.ref
                    rec['score'] = resultFile.score.toFixed(3)
                    for (let key of new_keys){
                        counts.push( resultFile.matchData.metadata[key].clean_body.position.length )
                        positions.push( ...resultFile.matchData.metadata[key].clean_body.position )
                    }
                    rec['count'] = counts.reduce((pv,cv)=>{return pv+cv}, 0)
                    rec['positions'] = positions.sort(compareByFirstItem)
                    resultGroups.push( rec )
                    }
                let totalCount = 0
                totalCount = resultGroups.reduce(function(pv,cv) {return pv + cv.count}, 0)
                this.searchResults = {...this.searchResults, count: totalCount}
                console.log(resultGroups)

                //update table items based on query
                this.tableFilter.length = 0

                if (resultIds.length == 0){
                    this.resetAllItems()
                } else {
                this.items.map(item => {
                    if (resultIds.includes(item.id)){
                        //filter and sort table items 
                        this.tableFilter.push( item.id )
                        const idx = resultGroups.map(resultFile => resultFile.ref).indexOf(item.id)
                        if (idx <= -1){
                            this.resetItem(item)
                        } else {
                            let resultFile = resultGroups[idx]
                            item.sort_key = resultFile.score
                            item.hit_count = resultFile.count

                            //update item row details' snippets
                            this.searchResults = {...this.searchResults, totalDocuments: resultIds.length}
                            const MARGIN = 250
                            //const LIMIT_OUTPUT = 3
                            //this.searchResults = {...this.searchResults, displayLimit: LIMIT_OUTPUT}
                            item.snippets.length = 0

                            const positions = resultFile.positions.map(item => item)//.slice(0, LIMIT_OUTPUT)
                            const positionGroups = []
                            let incr = 0
                            for (let index = 0; (index + incr) < positions.length; index++){
                                let indexCorrected = index + incr
                                const pos = positions[indexCorrected]
                                const subgroup = []
                                subgroup.push(pos)
                                if (indexCorrected + 1 == positions.length){
                                    positionGroups.push(subgroup)
                                    break
                                } else {
                                    for(let nextIndex = indexCorrected + 1; nextIndex < positions.length; nextIndex++){
                                        const nextPos = positions[nextIndex]
                                        const diff = nextPos[0] - pos[0]
                                        if (diff < MARGIN * 2){
                                            subgroup.push(nextPos)
                                            incr++
                                            if (index + incr + 1 == positions.length){
                                                positionGroups.push(subgroup)
                                            }
                                        } else {
                                            positionGroups.push(subgroup)
                                            break
                                        }
                                    }
                                }
                            }
                            console.log(positionGroups)
                            for (let grp of positionGroups){
                                const snippet = []
                                for (let [index, pos] of grp.entries()){
                                    if (index==0){
                                        const start = pos[0] - MARGIN > 0 ? pos[0] - MARGIN : 0
                                        const pageIdx = item.accumPageLines.map(val => {return start < val }).indexOf(true)
                                        const pageNum = parseInt(pageIdx) + 1
                                        const hightlight = item.clean_body.slice(pos[0], pos[0]+pos[1])
                                        const startText = `<b>pg.${pageNum.toString()}| char.${start})</b>  ${item.clean_body.slice(start, pos[0])} <b style="background-color: yellow">${hightlight}</b>`
                                        const endText = grp.length == 1  ?  item.clean_body.slice(pos[0]+pos[1], pos[0]+pos[1] + MARGIN)  :  ''
                                        const text = startText + endText
                                        snippet.push(text)
                                    } else if (index == grp.length - 1){
                                        const middleStart = item.clean_body.slice(grp[index-1][0]+grp[index-1][1], pos[0])
                                        const hightlight = item.clean_body.slice(pos[0], pos[0]+pos[1])
                                        const end = pos[0]+pos[1] + MARGIN < item.clean_body.length ? pos[0]+pos[1] + MARGIN : item.clean_body.length
                                        const text = `${middleStart} <b style="background-color: yellow">${hightlight}</b> ${item.clean_body.slice(pos[0]+pos[1], end)}`
                                        snippet.push(text)
                                    } else {
                                        const middleStart = item.clean_body.slice(grp[index-1][0]+grp[index-1][1], pos[0])
                                        const hightlight = item.clean_body.slice(pos[0], pos[0]+pos[1])
                                        const text = `${middleStart} <b style="background-color: yellow">${hightlight}</b>`
                                        snippet.push(text)
                                    }
                                }
                                item.snippets.push( snippet )
                            }
                        }
                    }
                })
                this.sortDesc = true
                console.log(this.tableFilter)
                this.activeTab = 1
                return true
                }
            } else {
                return false
            }
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
        },

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


function compareByFirstItem( a, b ) {
  if ( a[0] < b[0] ){
    return -1;
  }
  if ( a[0] > b[0] ){
    return 1;
  }
  return 0;
}



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