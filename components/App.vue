<template>
  <div class="container">
    <b-jumbotron id="jumbotron"
      header="Visual Document Index"
      lead="Bring your files to life"
    >
      <!--<b-button variant="primary" @click="showModal"> Click me! </b-button>-->
    </b-jumbotron>
  </div>
  <b-container>
    <b-row>
      <b-col cols="5"></b-col><!--Image Placeholder -->
      <b-col cols="7">
        <ImportData v-on:imported-records="updateParent" v-if="showImportBtn"/>
        <!--<div>{{ files }}</div>-->
      </b-col>
    </b-row>
        <Table :records="files" v-show="showTablePanel">{{ createTable }}</Table>
  </b-container>
</template>

<script>
import ImportData from './ImportData.vue';
import Table from './Table.vue';



export default {
  name: 'app',
  components: {
    ImportData,
    Table
  },
  data(){return {
    showImportBtn: true,
    showTablePanel: false,
    files: []
    }
  },
  methods: {
    updateParent (newFiles){
      this.files.push(...newFiles);
      this.showImportBtn = false;
      this.showTablePanel = true;
    }
    /*
    showModal() {
      this.$bvModal.msgBoxOk('Modal from @vue/compat');
    },*/
  },
};
</script>

<style>
#jumbotron{
  padding-bottom: 16px;
}
</style>