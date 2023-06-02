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
            <b-button size="sm" v-on:click="expandAll">Expand All</b-button>
            <b-button size="sm" v-on:click="collapseAll">Collapse All</b-button>
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
                        <b-col sm="6" class="text-sm-left">Search results: <br>{{ row.item.snippet }}</b-col>
                        
                        </b-row>
                      </b-card>
                    </template>


                </b-table>
            </div>
        </div>
</div>

</template>


<script>
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
        }
    },

    methods: {
        createTable() {
            // Populate the table with the transformed data records
            //modify data items (each row) before populating table
            let idx = 0;
            for (const record of this.$props.records) {
                const item = JSON.parse(JSON.stringify(record));   //remove reactivity

                // row items
                item.id = String(idx);
                let length_lines = 0;
                if (item.length_lines_array.length > 0){
                    if (item.length_lines_array.length > 1){
                        length_lines = item.length_lines_array.reduce((s, v) => s += (v | 0));
                    }else{
                        length_lines = item.length_lines_array[0];
                    }
                }else{
                    length_lines = 1;
                }
                let dt = getDateFromJsNumber(item.date);
                item.original_date = item.date;
                item.date = dt;
                item.length_lines = length_lines;

                // body items
                let bodyArr = JSON.parse(JSON.stringify( Object.values(record.body) ));
                let clean_body = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : '';
                item.clean_body = clean_body

                idx++;
                console.log(item)
                this.items.push(item)
                this.updateSnippets()
            }
            //create lunr index
            const docs = this.items;
            const lunrIndex = lunr(function() {
                this.ref('id')
                this.field('clean_body')
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
                let results = this.lunrIndex.search(queryVal).map(result => {
                    return this.items.filter(file => {
                        return String(file.id) === result.ref; //&& result.score > .4;
                    })[0];
                });
                console.log(results)
                this.tableFilter.length = 0
                results.map(p => this.tableFilter.push( String(p.id) ))
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
            return getFormattedFileSize(value);
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
        key: 'filepath',
        label: 'Path',
        sortable: true,
        formatter: "getFormattedPath"
    }, {
        key: 'filename_original',
        label: 'File Name',
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
        key: 'filename_original',
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








// Support functions

const getDateFromPythonString = str => {
    /* Usage:
    const dt = getDateFromString(value)
    const formattedDate = dt.toLocaleDateString()
    return formattedDate;
    */
    if (str.length > 10) {
        const [date, time] = str.split(" ");
        long_date = `${date}T${time}.000Z`; // reformat string into YYYY-MM-DDTHH:mm:ss.sssZ
        dt = new Date(long_date)
    } else {
        dt = new Date(str)
    }
    return dt;
};

const getDateFromJsNumber = num => {
    // Integer to string date
    let result = ''
    if (typeof(num)=='number'){
        if (String(num).length > 10) {
            let dt = new Date(num)
            result = `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`;
        }
    } else if (typeof(num)=='string' && num.length > 10) {
        const int = parseInt(num) 
        let dt = new Date(int)
        result = `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`;
    } 
    return result;
};

function getFormattedFileSize(numberOfBytes) {
    // TODO: move to utils.js, (also in ImportData)
    const units = [
        "B",
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB",
    ];
    const exponent = Math.min(
        Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
        units.length - 1
    );
    const approx = numberOfBytes / 1024 ** exponent;
    const output =
        exponent === 0 ?
        `${numberOfBytes} bytes` :
        `${approx.toFixed(3)} ${
              units[exponent]
            } (${numberOfBytes} bytes)`;
    return output;
}
</script>


<style>

#table-panel input {
    margin:5px;
}
#table-panel button {
    margin:5px;
}


</style>