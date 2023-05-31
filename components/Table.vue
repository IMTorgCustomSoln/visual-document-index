<template>

<div class="item12 search_box">
    <span>
        <h5 style="display:inline">Search: </h5>
        <input type="text" class="form-control" id="search-field" oninput="search()" placeholder="type search text here..." />
    </span>
    
    <div v-if="initializeTable">
        <b-button size="sm" v-on:click="expandAll">Expand All</b-button>
        <b-button size="sm" v-on:click="collapseAll">Collapse All</b-button>
    </div>
    
    <div v-if="initializeTable">
        <template>
            <div>
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
                        <b-row >Author: [[row.item.author]]</b-row>
                        <b-row >Subject: [[row.item.subject]]</b-row>
                        <b-row >Keywords: [[row.item.keywords]]</b-row>
                        </b-col>
                        <b-col sm="3" class="text-sm-left">Contents: <br><span v-html="row.item.pp_toc"></span> </b-col>
                        <b-col sm="6" class="text-sm-left">Search results: <br>[[ row.item.snippet ]]</b-col>
                        
                        </b-row>
                    </b-card>
                </template>

                </b-table>
            </div>
        </template>
    </div>
</div>

</template>


<script>
export default ({
    name: 'Table',
    props:{
        records: Array
    },
    data(){return {
            fields: fields,
            items: [],
            lunrIndex: null,
            filter: [],
            filterString: [],
            showImportBtn: true,
            initializeTable: false
        }
    },
    computed:{
        onRecordsUpdate(){
            this.$data.items.push(...this.$props.records);
            if (this.$data.items.length > 0){
            this.createTable();
            }
        }
    },
    methods: {

        createTable() {
            //modify data items
            let idx = 0;
            for (const item of this.$data.items) {
                let lengthLines = item.length_lines_array.reduce((s, v) => s += (v | 0));
                this.$data.items[idx].length_lines = lengthLines;
                let bodyArr = Object.values(item.body);
                let clean_body = bodyArr.length > 0 ? bodyArr.reduce((partialSum, a) => partialSum += (a || 0)) : null;
                this.$data.items[idx].clean_body = clean_body;
                idx++;
            }
            /*create lunr index
            const lunrIndex = lunr(function() {
                this.ref('id')
                this.field('clean_body')
                vm._data.items.forEach(function(doc) {
                    this.add(doc)
                }, this)
            })
            this.$data.lunrIndex = lunrIndex;
            */
            this.$data.showImportBtn = false;
            this.$data.initializeTable = true;
        },

        // Table logic
        onFiltered(row, filter) {
            row.snippet = null
            if (filter.length == 0) {
                row.snippet = null
                return true;
            } else if (filter.includes(row.id)) {
                body = row.clean_body
                idx = body.indexOf(vm._data.filterString)
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
            //const dt = getDateFromString(value)
            //const formattedDate = dt.toLocaleDateString()
            //return formattedDate;
            return value;
        },
        getFormattedFileSize(value) {
            return getFormattedFileSize(value);
        },
        getFormattedPath(path) {
            return path ? path : './';
        }
    }
})



/*
Onclick handler for search button
When we call search, we will call the search function on lunr with the parameters from 
the input. Lunr is going to return an array containing a score and URL. We are using the 
filter function to match that with the items from the response (saved in allposts) so 
that we can grab the title as well.
I am doing another filter at the end to remove all the null elements. 
*/
function search() {
    //document.getElementById("results").innerHTML = "results go here...";
    let query = document.getElementById("search-field").value;
    if (query == '') {
        while (vm._data.filter.length > 0) {
            vm._data.filter.pop()
        }
        vm._data.filterString.pop()
        return []
    }
    let results = vm._data.lunrIndex.search(query).map(result => {
        return vm._data.items.filter(file => {
            return String(file.id) === result.ref; //&& result.score > .4;
        })[0];
    });
    results = results.filter(p => {
        if (p) {
            return true;
        }
    });
    while (vm._data.filter.length > 0) {
        vm._data.filter.pop()
    }
    vm._data.filterString.pop()
    vm._data.filterString.push(query)
    results.map(p => vm._data.filter.push(String(p.id)))
        //displayResults = results.map(p => (` ${p.id})  ${p.body} \n`))
        //document.getElementById("results").innerHTML = displayResults;
}


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
        formatter: "formatDateAssigned"
    }]








       //support functions
        const getDateFromString = str => {
            if (str.length > 10) {
                const [date, time] = str.split(" ");
                long_date = `${date}T${time}.000Z`; // reformat string into YYYY-MM-DDTHH:mm:ss.sssZ
                dt = new Date(long_date)
            } else {
                dt = new Date(str)
            }
            return dt;
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