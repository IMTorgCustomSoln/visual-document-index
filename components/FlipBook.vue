<!--
    TODO: the img style must be removed everytime - fails 
-->
<template>
    <flipbook 
        class="flipbook" 
        :pages="pages"
        :startPage="pageNum"
        :zooms="[1,2]"
        :flipDuration="500"
        :zoomDuration="300"
        :singlePage="true"
        :dragToFlip="false"
        @flip-left-end="onFlipLeftEnd"
        @flip-right-end="onFlipRightEnd"
        v-slot="flipbook"
        ref="flipbook"
        >
        <div class="action-bar">
            <b-icon-chevron-bar-left class="h5 mb-1 border" font-scale="1" @click="selectDisplayedPage(1)"/>
            <b-icon-chevron-compact-left class="h5 mb-1 " font-scale="1" @click="flipbook.flipLeft"/>
            <input size="1" v-model="pageNum"/>
            <b-icon-chevron-compact-right class="h5 mb-1 " font-scale="1" @click="flipbook.flipRight"/>
            <b-icon-chevron-bar-right class="h5 mb-1 border" font-scale="1" @click="selectDisplayedPage(-1)"/>
        </div>
    </flipbook>
</template>

<script>
import Flipbook from 'flipbook-vue/vue2'

export default {
    name: 'FlipBook',
    props: {
        selectedPage: String,
        imageArray: Array
    },
    watch: {
        selectedPage:{
            handler(newSelectedPage){
                const pg = newSelectedPage.split('pg.')[1].split('|')[0]
                this.pageNum = parseInt(pg)
            }
        },
        imageArray: {
            handler(newImageArray, oldImageArray) {
                this.setupPages()
            },
            deep: true
        },   
    },
    mounted(){
        this.setupPages()
    },
    components:{Flipbook},
    data(){
        return{
            pageNum: 1,
            pages: []
        }
    },
    methods:{
        setupPages(){
            let images = this.$props.imageArray.map(img => img.img)
            this.pages.push(...images)
        },
        selectDisplayedPage(num){
            const n = parseInt(num)
            console.log(n)
            if (n==-1){
                this.pageNum = this.imageArray.length
            } else {
            this.pageNum = n
            }
        },
        onFlipLeftEnd(page) {
            this.pageNum = page
        },
        onFlipRightEnd(page) {
            this.pageNum = page
        },
}
}
</script>

<style>
.action-bar {
  width: 100%;
  height: 30px;
  padding: 10px 0;
  display: flex;
  justify-content: center;
  align-items: center;

/* allow flipbook to float up and over image*/
  z-index: 10;
  position: absolute;
}
.action-bar input{
    text-align: center;
    border-color: #e1e1e1;
}

.flipbook .viewport {
    width: 500px;
}
/*
.flipbook .viewport {
    position: absolute !important;
    left: 0 !important;
    width: 100% !important;
}*/

.flipbook-container img{
    position: absolute !important;
    left: 0 !important;
    width: 100% !important;
}

/*

.page .fixed {
    all: unset;
}


/*
.bounding-box{
    box-shadow: 0 0 20px #0000003b;
}*/




/*
img {
    display: block;
}
.page .fixed {
    width: 500px;
}
/*
.flipbook{
    width: 100px;
    height: 100px;
}
.flipbook .bounding-box {
  box-shadow: 0 0 20px #000;
}*/

/*
.flipbook {
  width: 90vw;
  height: 90vh;
}
.flipbook .viewport {
  width: 90vw !important;
  height: calc(100vh - 50px - 40px) !important;
}

img {
    width: 500px !important;
    height: 600px !important;
}*/
/*
.bounding-box {
    width: 490px !important;
    height: 700px !important;
}*/
</style>