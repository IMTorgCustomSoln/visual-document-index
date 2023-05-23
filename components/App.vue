<template>
  <div class="container">
    <b-jumbotron
      header="Visual Document Index"
      lead="Bring your files to life"
    >
      <!--<b-button variant="primary" @click="showModal"> Click me! </b-button>-->
    </b-jumbotron>
  </div>
  <b-container>
    <b-row>
      <b-col cols="5">Image</b-col>
      <b-col cols="7">
        <ImportData v-on:set-child-data="updateParent" />
        <div>Search</div>
        <div>{{ files }}</div>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
      Table
    </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { BIcon, BIconCamera } from 'bootstrap-vue';
import ImportData from './ImportData.vue';
export default {
  name: '',
  components: {
    ImportData
  },
  data(){return {
    files: []
    }
  },
  methods: {
    updateParent (newFiles){
      for(const file of newFiles){
        this.files.push(file);
      }
    }
    /*
    showModal() {
      this.$bvModal.msgBoxOk('Modal from @vue/compat');
    },*/
  },
};
</script>
