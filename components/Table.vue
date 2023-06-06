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
                        <b-row >Author: {{row.item.author}}</b-row>
                        <b-row >Subject: {{row.item.subject}}</b-row>
                        <b-row >Keywords: {{row.item.keywords}}</b-row>
                        </b-col>
                        <b-col sm="3" class="text-sm-left">Contents: <br><span v-html="row.item.pp_toc"></span> </b-col>
                        <b-col sm="6" class="text-sm-left">
                            Search results: 
                            <div id="search-results">{{ row.item.snippet }}</div> 
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
            sortBy: 'id',
            sortDesc: false
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
            if(this.lunrIndex){
                const queryVal = this.query
                const searchTerms = this.lunrIndex.pipeline.run(lunr.tokenizer(queryVal))
                let resultsObj = this.lunrIndex.search(queryVal).map(result => {
                    //return this.items.filter(file => {
                        //console.log(result)
                        //return String(file.id) === result.ref; //&& result.score > .4;
                        return result
                    //})
                })
                let results = resultsObj[0]
                console.log(results)
                this.tableFilter.length = 0
                //results.map(p => this.tableFilter.push( String(p.id) ))
                results.map(p => this.tableFilter.push( String(p.ref) ))
                console.log(this.tableFilter)
                this.updateSnippets()
                return true
            }else{
                return false
            }
        },

        onFiltered(row, filter) {
            // Applied to each table row to determine if it 
            //should be displayed
            if (filter.length == 0) {
                return true;
            } else if (filter.includes(row.id)){
                return true;
            } else {
                return false;
            }
        },

        updateSnippets(){
            // Update snippets for every item in table
            const MARGIN = 250;
            for(const item of this.items){
                if(this.tableFilter.length == 0){
                    item.snippet = 'TODO: SUMMARY GOES HERE'
                }else if(this.tableFilter.includes(item.id)){
                    const idx = item.clean_body.indexOf(this.query)
                    item.snippet = item.clean_body.slice(idx - MARGIN, idx + MARGIN)
                }else{
                    item.snippet = null
                }
            }
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
        key: 'id',
        label: 'Id'
    }, {
        key: 'reference_number',
        label: 'Reference',
        sortable: true,
    }, {
        key: 'filepath',
        label: 'Path and Name',
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
#search-results{
    font-size:12px;
}
</style>