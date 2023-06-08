<template>

<div>
    <b-row id="table-panel">
        <!--
        <b-col cols="5"></b-col>
        <b-col cols="7">-->
        <b-col>
        <span>
            <h5 style="display:inline">Search: </h5>
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
                        
                        <b-col sm="2" class="text-sm-left">
                        <b-row ><b>Author:</b> {{row.item.author}}</b-row>
                        <b-row ><b>Subject:</b> {{row.item.subject}}</b-row>
                        <b-row ><b>Keywords:</b> {{row.item.keywords}}</b-row>
                        </b-col>
                        <b-col sm="3" class="text-sm-left"><b>Contents:</b> <br><span v-html="row.item.pp_toc"></span> </b-col>
                        <b-col sm="6" class="text-sm-left">
                            <div v-if="!searchResults.totalDocuments"><b>Document summary:</b> <br/>
                                {{ row.item.summary }}
                            </div>
                            <div v-else><b>Search results in {{ row.item.hit_count }} hits, showing the first {{ searchResults.displayLimit }}:</b></div>
                            <br/>
                            <div id="search-results" v-for="snippet in row.item.snippets">
                                <div><span v-html="snippet"></span></div><br/>
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
import { getDateFromJsNumber, getFormattedFileSize } from './utils';

export default ({
    name: 'Table',
    props:{
        records: Array
    },
    watch: { 
        records: {
            handler: function(newVal, oldVal) {
                console.log('Prop changed: ', newVal, ' | was: ', oldVal)
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
            searchResults: {
                count: 0,
                totalDocuments: 0,
                searchTerms: '',
                displayLimit: 0,
                errorMsg: ''
            }
        }
    },
    computed: {
        searchResultsCount(){
            return this.query != '' ? `Search returned ${this.searchResults.count} hits, in ${this.searchResults.totalDocuments} documents, using terms: ${this.searchResults.searchTerms}`  : ''
        }
    },

    methods: {
        createTable() {
            // Populate the table with the transformed data records
            for (const record of this.$props.records) {
                const item = JSON.parse(JSON.stringify( record ))
                this.items.push( item )
            //this.updateSnippets()   <<< TODO: this will cause these records to react again, maybe add to processData
            }

            console.log(this.items)
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
                    let new_key = Object.keys( resultFile.matchData.metadata )[0]
                    let rec = {}
                    rec['ref'] = resultFile.ref
                    rec['score'] = resultFile.score
                    rec['count'] = resultFile.matchData.metadata[new_key].clean_body.position.length
                    rec['positions'] = resultFile.matchData.metadata[new_key].clean_body.position
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
                            const LIMIT_OUTPUT = 3
                            this.searchResults = {...this.searchResults, displayLimit: LIMIT_OUTPUT}
                            item.snippets.length = 0

                            const indices = resultFile.positions.map(item => item).slice(0, LIMIT_OUTPUT)
                            const chars = item.clean_body.length
                            for (let index of indices){
                                const start = index[0] - MARGIN > 0 ? index[0] - MARGIN : 0
                                const end = index[0]+index[1] + MARGIN < chars ? index[0]+index[1] + MARGIN : chars
                                const hightlight = item.clean_body.slice(index[0], index[0]+index[1])
                                const snippet = item.clean_body.slice(start, index[0]) + `<b style="background-color: yellow">${hightlight}</b>` + item.clean_body.slice(index[0]+index[1], end)
                                item.snippets.push( snippet )
                            }  
                        }
                    }
                })
                this.sortDesc = true
                console.log(this.tableFilter)
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






// Table data items
const fields = [{
        key: 'sort_key',
        label: 'Score',
        sortable: true,
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
</style>