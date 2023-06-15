<template>
  <div class="drop-zone"
    @drop="onDrop($event, listName)"
    @dragenter.prevent    
    @dragover.prevent
    >
    <div v-for="item in getList(listName)" 
      :key="item.id" 
      class="drag-el"
      draggable="true"
      @dragstart="startDrag($event, item)"
      >
      {{ item.innerHTML ? item.innerHTML : item.innerText }}
    </div>
  </div>
</template>


<script>
import shared_array from './utils.js'

export default ({
  name: "Draggable",
  props: {listName: String},
  data(){
    return{
      items: shared_array
    }
   },
    methods: {
      getList(list){
        return this.items.filter(item=>item.list == list)
      },
      startDrag(event, item){
        console.log(item)
        event.dataTransfer.dropEffect = 'move'      //visual effect
        event.dataTransfer.effectAllowed = 'move'   //move instead of copy
        event.dataTransfer.setData('itemID',item.id)
      },
      onDrop(event, list){
        const itemId = event.dataTransfer.getData('itemID')
        const item = this.items.find(item => item.id==itemId)    //find selected item
        item.list = list                                    //change items list
      }
    }
  })
</script>

<style>
.drop-zone{
  width: 90%;
  margin: 50px auto;
  background-color: rgb(204, 228, 249);
  padding: 10px;
  min-height: 10px;
  font-size: 8px;
}
.drag-el{
  padding-bottom: 10px;
}

</style>