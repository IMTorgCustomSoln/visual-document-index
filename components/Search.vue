<template>
        <!-- Search -->
        <b-row id="table-panel">
            <b-col>
                <span>
                    <h5 style="display:inline">Search: </h5>
                    <Guide v-bind="guides.search"/>
                    <input 
                        type="text" 
                        class="form-control" 
                        id="search-field" 
                        v-model="query" 
                        @input="searchQuery" 
                        placeholder="type search text here..." 
                        />
                    <div v-if="searchDisplayResults.searchTerms">
                        <div v-if="!searchDisplayResults.errorMsg">{{ searchResultsCount }}</div>
                        <div v-else class="errorMsg"> {{ searchDisplayResults.errorMsg }}</div>
                    </div>
                </span>
            </b-col>
        </b-row>
</template>    

<script>
import Guide from './support/Guide.vue'
import {DocumentIndexData} from './support/data'

export default{
    name: 'Search',
    props:{
        records: Array
    },
    watch: { 
        records: {
            handler: function(newVal, oldVal) {
                //console.log('Prop changed: ', newVal, ' | was: ', oldVal)
                if (Array.isArray(this.$props.records) && 
                    this.$props.records.length > 0
                    ){
                    this.createIndex()
                }
            },
            deep: false
        }
    },
    emits:['search-table-results'],
    components: {
        Guide
    },
    data(){
        this.indices = DocumentIndexData.value.indices
        
        return{
            searchTableResults:{
                query: '',
                resultIds: [],
                resultGroups: []
            },
            searchDisplayResults: {
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
                }
            }
        }
    },
    computed: {
        searchResultsCount(){
            return this.query != '' ? `Search returned ${this.searchDisplayResults.count} hits, in ${this.searchDisplayResults.totalDocuments} documents, using terms: ${this.searchDisplayResults.searchTerms}`  : ''
        }
    },
    methods: {
        createIndex(){
            //create lunr index
            const records = this.$props.records
            const lunrIndex = lunr(function() {
                this.ref('id')
                this.field('clean_body')
                this.metadataWhitelist = ['position']
                records.forEach(function(rec) {
                    this.add(rec)
                }, this)
            })
            //add to context
            this.indices = {...this.indices, lunrIndex: lunrIndex}
        },
        searchQuery() {
            /* Provide tableFilter of selected rows' id based on `this.query` input
            ~~_Note_: `search()` must be instatiated in template, so `return ''` is 
            used.  This is not clean, but computed's cacheing ability still makes
            it preferable over other methods.~~   =>  previously `computed`
            :query str - from text input, should match lunrjs patterns
            :filter [] - selected files' ids
            */
            console.log(`query: ${this.query}`)
            this.searchTableResults = {...this.searchTableResults, query: this.query}
            this.searchResults = {...this.searchDisplayResults, errorMsg: ''}
            const backticksLength = (this.query.match(/`/g) || []).length
            const checkBackticks = backticksLength > 0 && backticksLength % 2 == 0

            // no query input
            if (this.query.length === 0){
                this.resetAllItems()
                this.$emit('search-table-results', this.searchTableResults)
                return false

            // exact phrase search using backticks
            } else if (checkBackticks) {
                //collect phrases
                const phrases = []
                let substr = ''
                let select = false
                for(let char of this.query.length){
                    if(this.query[char]=='`' && select==false){ 
                        select=true
                    } else if(this.query[char]=='`' && select==true){
                        select=false
                        phrases.push(substr)
                        substr = '' 
                    } else if(select){
                        substr += this.query[char]
                    } 
                }
                //select hits for each phrase
                for(let phrase of phrases){

                }

    
            // lunrJs query
            } else if (this.indices.lunrIndex) {
                
                //query lunrjs index
                const queryVal = this.query
                var searchTerms = ''
                var results = ''
                try {
                    searchTerms = this.indices.lunrIndex.pipeline.run(lunr.tokenizer(queryVal))
                    this.searchDisplayResults = {...this.searchDisplayResults, searchTerms: searchTerms}
                    results = this.indices.lunrIndex.search(queryVal).map(resultFile => { return resultFile })
                } catch (error) {
                    this.searchDisplayResults = {...this.searchDisplayResults, errorMsg: error}
                    this.resetAllItems()
                    return false
                }
                const resultIds = results.map(resultFile => resultFile.ref)
                console.log(`resultdIds: ${resultIds}`)
                this.searchTableResults = {...this.searchTableResults, resultIds: resultIds}
                this.searchDisplayResults = {...this.searchDisplayResults, totalDocuments: resultIds.length}

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
                this.searchDisplayResults = {...this.searchDisplayResults, count: totalCount}
                this.searchTableResults = {...this.searchTableResults, resultGroups: resultGroups}
                console.log(`resultGroups: `); console.log(resultGroups)

                this.$emit('search-table-results', this.searchTableResults)
            } else {
                return false
            }
        },
        resetAllItems(){
            this.searchTableResults = {...this.searchTableResults, query: ''}
            this.searchTableResults = {...this.searchTableResults, resultIds: []}
            this.searchTableResults = {...this.searchTableResults, resultGroups: []}

            this.searchDisplayResults = {...this.searchDisplayResults, count: 0}
            this.searchDisplayResults = {...this.searchDisplayResults, totalDocuments: 0}
            this.searchDisplayResults = {...this.searchDisplayResults, searchTerms: ''}
            this.searchDisplayResults = {...this.searchDisplayResults, displayLimit: 0}
        },
    },
}




function compareByFirstItem( a, b ) {
  if ( a[0] < b[0] ){
    return -1;
  }
  if ( a[0] > b[0] ){
    return 1;
  }
  return 0;
}

</script>




<style>


</style>