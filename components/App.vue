<template>
  <b-container class="px-5" fluid>
    <b-jumbotron id="jumbotron"
      header="Visual Document Index"
      lead="Bring your files to life"
    >
    </b-jumbotron>
    <b-row>
      <b-col cols="5"></b-col>
      <b-col cols="5">
        <div id="btnMainPanel">
          <ImportData 
            v-on:imported-records="addRecords"
            />
          <Sidebar 
            :note="note" 
            />
          <SaveWork/>
        </div>
      </b-col>
      <b-col cols="2"></b-col>
    </b-row>
      <div v-show="showTablePanel">
        <Search 
          :records="documents" 
          v-on:search-table-results="searchTable"
          >
        </Search>
        <Table 
          :records="documents" 
          :search="searchTableResults" 
          v-on:send-note="updateNotes"
          >
          {{ createTable }}
        </Table>
      </div>
  </b-container>
</template>

<script>
import ImportData from './ImportData.vue'
import Search from './Search.vue'
import Table from './Table.vue'
import Sidebar from './Sidebar.vue'

import SaveWork from './support/SaveWork.vue'
import { DocumentIndexData } from './support/data'



export default {
  name: 'app',
  components: {
    ImportData,
    Sidebar,
    SaveWork,
    Search,
    Table,
  },
  data(){
    return {
      showTablePanel: false,
      documents: DocumentIndexData.value.documents,
      searchTableResults: {
        query: '',
        searchTerms: [],
        resultIds: [],
        resultGroups: []
      },
      note: {}
    }
  },
  methods: {
    addRecords(newRecords){
      //check file for uniqueness in reference_number, then append
      let refNums = []
      let maxId = 0
      if(this.documents.length>0){
        refNums.push(...this.documents.map(item => item.reference_number) )
        const ids = this.documents.map(item => parseInt(item.id)).filter(item => isNaN(item)==false)
        maxId = Math.max(...ids)
      }
      for(let file of newRecords){
        if(!refNums.includes(file.reference_number)){
          file.id = String( maxId + 1 )
          this.documents.push( file )
          maxId++
        }
      }
      this.showTablePanel = true
    },
    searchTable(results){
      this.searchTableResults = {...this.searchTableResults, query: results.query}
      this.searchTableResults = {...this.searchTableResults, searchTerms: results.searchTerms}
      this.searchTableResults = {...this.searchTableResults, resultIds: results.resultIds}
      this.searchTableResults = {...this.searchTableResults, resultGroups: results.resultGroups}
    },
    updateNotes(newNote){
      Object.assign(this.note, newNote)
    }
  },
}
</script>

<style>
#jumbotron{
  padding-bottom: 16px;
}
#btnMainPanel{
  float: right;
}
</style>