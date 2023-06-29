<template>
  <b-container class="px-5" fluid>
    <b-jumbotron id="jumbotron"
      header="Visual Document Index"
      lead="Bring your files to life"
    >
    </b-jumbotron>
    <b-row>
      <b-col cols="5"></b-col>
      <b-col cols="7">
        <ImportData v-on:imported-records="updateParent"/> <!-- v-if="showImportBtn"/>-->
        <!--<Sidebar :note="note" />-->
      </b-col>
    </b-row>
    <!--
    <Table v-show="showTablePanel" :records="files" v-on:send-note="updateNotes">{{ createTable }}</Table>
    -->
  </b-container>
</template>

<script>
import ImportData from './ImportData.vue'
//import Table from './Table.vue'
//import Sidebar from './Sidebar.vue'

import { DocumentRecordsData } from './support/data'



export default {
  name: 'app',
  components: {
    ImportData,
    //Table,
    //Sidebar
  },
  data(){return {
    showImportBtn: true,
    showTablePanel: false,
    files: DocumentRecordsData.documents,
    note: {}
    }
  },
  methods: {
    updateParent(newFiles){
      this.files.push(...newFiles)
      this.showImportBtn = false
      this.showTablePanel = true
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
</style>