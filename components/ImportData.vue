<template>
    <b-button variant="primary" @click="setChildData">Import Files</b-button>
</template>

<script>
export default ({
    name:'ImportData',
    emits:['set-child-data'],
    data(){return {
        newFiles: ['File-1', 'File-2', 'File-3']
    }},
    methods: {
        setChildData(){
            this.$emit('set-child-data', this.newFiles)
        }
    }

})

</script>