<template>

<div>
    <b-row id="table-panel">
        <!--
        <b-col cols="5"></b-col>
        <b-col cols="7">-->
        <b-col>
        <span>
            <h5 style="display:inline">Search: </h5>
            <input type="text" class="form-control" id="search-field" @input="search()" placeholder="type search text here..." />
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
                    * ...
                -->
                <b-table hover 
                  :items="items" 
                  :fields="fields"
                  :filter="filter"
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
                    console.log('its an array')
                    this.createTable();
                }
            },
            deep: false
        }
    },
    data(){return {
            fields: fields,
            items: [],
            lunrIndex: null,
            filter: [],
            filterString: [],
            initializeTable: false
        }
    },
    methods: {
        createTable() {
            //modify data items
            let idx = 0;
            for (const item of this.$props.records) {
                const record = JSON.parse(JSON.stringify(item));   //remove reactivity
                console.log(record)
                record.id = String(idx);
                let length_lines = 0;
                if (record.length_lines_array.length > 0){
                    if (record.length_lines_array.length > 1){
                        length_lines = record.length_lines_array.reduce((s, v) => s += (v | 0));
                    }else{
                        length_lines = record.length_lines_array[0];
                    }
                }else{
                    length_lines = 1;
                }
                let dt = getDateFromJsNumber(record.date);
                record.original_date = record.date;
                record.date = dt;
                record.length_lines = length_lines;
                let bodyArr = Object.values(record.body);
                let clean_body = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : '';
                record.clean_body = clean_body;

                idx++;
                this.$data.items.push(record);
            }
            //create lunr index
            console.log('start')
            const docs = this.$data.items;
            const lunrIndex = lunr(function() {
                this.ref('id')
                this.field('clean_body')
                docs.forEach(function(doc) {
                    this.add(doc)
                }, this)
            })
            console.log(lunrIndex);
            this.$data.lunrIndex = lunrIndex;
            this.$data.initializeTable = true;
            console.log('done')
        },

        // Table logic
        /*
        Onclick handler for search button
        When we call search, we will call the search function on lunr with the parameters from 
        the input. Lunr is going to return an array containing a score and URL. We are using the 
        filter function to match that with the items from the response (saved in allposts) so 
        that we can grab the title as well.
        I am doing another filter at the end to remove all the null elements. 
        */
        search() {
            //document.getElementById("results").innerHTML = "results go here...";
            let query = document.getElementById("search-field").value;
            if (query == '') {
                while (this.$data.filter.length > 0) {
                    this.$data.filter.pop()
                }
                this.$data.filterString.pop()
                return []
            }
            let results = this.$data.lunrIndex.search(query).map(result => {
                return this.$data.items.filter(file => {
                    return String(file.id) === result.ref; //&& result.score > .4;
                })[0];
            });
            console.log(results)
            results = results.filter(p => {
                if (p) {
                    return true;
                }
            });
            while (this.$data.filter.length > 0) {
                this.$data.filter.pop()
            }
            this.$data.filterString.pop()
            this.$data.filterString.push(query)
            results.map(p => this.$data.filter.push(String(p.id)))
                //displayResults = results.map(p => (` ${p.id})  ${p.body} \n`))
                //document.getElementById("results").innerHTML = displayResults;
        },

        onFiltered(row, filter) {
            const MARGIN = 250;
            row.snippet = null;
            if (filter.length == 0) {
                row.snippet = null;
                return true;
            } else if (filter.includes(row.id)) {
                let body = row.clean_body;
                let idx = body.indexOf(this.$data.filterString)
                row.snippet = body.slice(idx - MARGIN, idx + MARGIN)
                return true;
            } else {
                row.snippet = null
                return false;
            }
        },
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








       //support functions
        const getDateFromPythonString = str => {
            /* Usage:
            //const dt = getDateFromString(value)
            //const formattedDate = dt.toLocaleDateString()
            //return formattedDate;
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
            console.log(result)
            return result;
        };

        function getFormattedFileSize(numberOfBytes) {
            // Approximate to the closest prefixed unit
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