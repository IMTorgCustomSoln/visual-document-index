
<template>
    <flipbook 
        class="flipbook" 
        :pages="pages"
        :zooms="[1,2]"
        :flipDuration="100"
        :zoomDuration="100"
        :singlePage="true"
        :dragToFlip="true"
        v-slot="flipbook"
        >
        <button @click="flipbook.flipLeft">Previous Page</button>
        <button @click="flipbook.flipRight">Next Page</button>
    </flipbook>
</template>

<script>
import Flipbook from 'flipbook-vue'

export default {
    name: 'FlipBook',
    props: {items: Array},
    watch: {
        items: {
            handler(newVal, oldVal) {
                console.log('NEW Prop changed: ', newVal, ' | was: ', oldVal)
                let pages = []
                for (let img of newVal[0].canvas_array){
                    if(img.img){
                        pages.append(img)
                    }
                }
                pages = pages.sort((a,b)=> a.idx - b.idx).map(img => img.img)
                this.pages.append(...pages)
            },
            deep: true
        },   
    },
    components:{Flipbook},
    data(){
        return{
            pages: []
        }
    },
    methods:{
}
}
</script>

<style>
.flipbook {
  width: 90vw;
  height: 90vh;
}
</style>