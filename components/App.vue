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
          <ImportData v-on:imported-records="addRecords"/>
          <Sidebar :note="note" />
        </div>
      </b-col>
      <b-col cols="2"></b-col>
    </b-row>
      <div v-show="showTablePanel">
        <Search :records="documents" v-on:search-table-results="searchTable"></Search>
        <!--
        <Table :records="files" v-on:send-note="updateNotes">{{ createTable }}</Table>
        -->
      </div>
  </b-container>
</template>

<script>
import ImportData from './ImportData.vue'
import Search from './Search.vue'
import Table from './Table.vue'
import Sidebar from './Sidebar.vue'

import { DocumentIndexData } from './support/data'



export default {
  name: 'app',
  components: {
    ImportData,
    Search,
    Table,
    Sidebar
  },
  data(){return {
    showTablePanel: false,
    documents: DocumentIndexData.value.documents,
    note: {}
    }
  },
  methods: {
    addRecords(newRecords){
      //check file for uniqueness in reference_number, then append
      const refNums = this.documents.map(item => item.reference_number)
      let maxId = Math.max( this.documents.map(item => item.id) )
      for(let file of newRecords){
        if(!refNums.includes(file.reference_number)){
          file.id = maxId + 1
          this.documents.push(file)
          maxId++
        }
      }
      this.showTablePanel = true
    },
    searchTable(){

    },
    updateNotes(newNote){
      Object.assign(this.note, newNote)
    }
  },
};
</script>

<style>
#jumbotron{
  padding-bottom: 16px;
}
#btnMainPanel{
  float: right;
}
</style>