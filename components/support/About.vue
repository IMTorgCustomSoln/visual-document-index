<template>
    <!-- Open modal button -->
    <b-button
         id='btnAbout' 
         v-b-modal="'about-modal'"
         variant="primary"
         class="fixed-large"
         >
         About
     </b-button>
 
     <!-- modal -->
     <b-modal id='about-modal' ok-only>
         <template #modal-title>
             About Visual Document Index (VDI)
         </template>
         <br>

         <div>
             <p>
             The VDI browser application is designed to solve two problems:
             <ul>
                <li>flexibly search large amounts of text across multiple documents</li>
                <li>select, organize, and output references for follow-on work</li>
             </ul>
             It addresses these problems fairly well, but with some caveats.  The tool is limited
             in the number and types of documents that can be uploaded.  The application's performance 
             degrades after around 10 individual documents and a total upload size of 50MB.  
             Additionally, there is no Optical Character Recognition (OCR) capabilities, so only true 
             text (selectable) .pdf files can be searched - not scans of documents.  
             
             These caveats will be addressed as the project progresses.
             </p>
         </div>
 
         <!-- Control 
         <template #modal-footer>
             <div v-if="description">
                 <b-button @click="saveWork" v-b-modal.modal-close_visit class="btn-sm m-1" variant="primary" >Save Workspace</b-button>
             </div>
         </template>-->
     </b-modal>
 </template>


<script>

export default({
    name: "About"
})

</script>


<style scoped>
.fixed-large{
    width: 150px !important;
    margin: 5px;
}
</style>