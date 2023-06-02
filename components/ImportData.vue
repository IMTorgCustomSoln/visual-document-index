<template>
    <!--
    <b-button variant="primary" @click="setChildData">Import Files</b-button>
    -->
    <p>Click to import files and populate a table:</p>
    <b-button size="sm" v-b-modal="'import-modal'" class="btn btn-success btn-sm m-1">Import Files</b-button>
    <div>
        <!-- The modal -->
        <b-modal id="import-modal" ok-only>
            <template #modal-title>
                Select files for import
            </template>
            <br>
            <form name="uploadForm">
                <div>
                    <input id="uploadInput" type="file" @change="previewFiles" multiple /><br>
                    <label for="fileSize">Total size: &nbsp</label>
                    <output id="fileSize">0</output>
                </div>
            </form>
            <template #modal-footer>
                    <button @click="uploadInput" v-b-modal.modal-close_visit class="btn btn-success btn-sm m-1">Import</button>
                </template>
        </b-modal>
    </div>
</template>

<script>
export default ({
    name:'ImportData',
    emits:['imported-records'],
    data(){return {
        //newFiles: ['File-1', 'File-2', 'File-3']
        newFiles: []
    }},
    methods: {
        previewFiles() {
            // Calculate total size
            let numberOfBytes = 0;
            for (const file of uploadInput.files) {
                numberOfBytes += file.size;
            }
            const output = getFormattedFileSize(numberOfBytes);
            document.getElementById("fileSize").textContent = output;
        },
        uploadInput(){
            // Load files into records
            processFiles(uploadInput.files).then(
                (recs)=>{
                    this.$data.newFiles.push(...recs);
                    this.$bvModal.hide("import-modal");
                    this.$emit('imported-records', this.newFiles);      
            })
    }
}
})




function getFormattedFileSize(numberOfBytes) {
    // Approximate to the closest prefixed unit
    const units = [
        "B",
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB",
    ];
    const exponent = Math.min(
        Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
        units.length - 1
    );
    const approx = numberOfBytes / 1024 ** exponent;
    const output =
        exponent === 0 ?
        `${numberOfBytes} bytes` :
        `${approx.toFixed(3)} ${
              units[exponent]
            } (${numberOfBytes} bytes)`;
    return output;
}


async function processFiles(files){
    // process files selected for upload and return an array of records
    let idx = 0
    const newFiles = []
    for (const file of files) {
        let data = await getFileRecord(file);

        //DocumentRecord
        const record = {};

        // file indexing
        record.id = String(idx);
        record.reference_number = null;
        record.filepath = file.webkitRelativePath ? file.webkitRelativePath : null;
        var re = /(?:\.([^.]+))?$/;
        let extension = re.exec(file.name)[1];
        record.filename_original = file.name.replace('.' + extension, '');
        record.filename_modified = null;

        // raw
        record.file_extension = extension;
        record.filetype = file.type;
        record.page_nos = data.page_nos;
        record.length_lines_array = data.length_lines_array;
        record.length_lines = null;
        record.file_size_mb = file.size;
        record.date = file.lastModified;

        //inferred / searchable
        record.title = null;
        record.author = null;
        record.subject = null;
        record.toc = null;
        record.pp_toc = null;

        record.body = data.body;
        record.clean_body = null;
        record.readability_score = null;
        record.tag_categories = null;
        record.keywords = null;
        record.summary = null;

        //frontend field
        record.snippet = null;
        record._showDetails = false;

        newFiles.push(record);
        }
    return newFiles;
}


function getFileRecord(file){
    // create a file record from the FileReader() API
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let typedarray = new Uint8Array(e.target.result); //Step 4:turn array buffer into typed array
            const loadingTask = pdfjsLib.getDocument(typedarray); //Step 5:pdfjs should be able to read this
            loadingTask.promise.then(pdf => {
                //document is loaded
                let total = pdf.numPages;
                let length_lines_array = [];
                let layers = {};
                for (let i = 1; i <= total; i++) {
                    pdf.getPage(i).then(function(page) {
                        let n = page.pageNumber;
                        let page_text = "";
                        page.getTextContent().then(function(textContent) {
                            for (let item of textContent.items) {
                                page_text += String(item.str);
                            }
                            let sentence_count = (page_text.match(/./g) || []).length;
                            length_lines_array.push(sentence_count);
                            layers[n] = page_text + "\n\n";
                        });
                    });
                };
                console.log(`${file} pdf loaded with body: ${layers}`)
                resolve({
                    //index: idx,
                    page_nos: total,
                    length_lines_array: length_lines_array,
                    body: layers
                });
            });
        }
        reader.readAsArrayBuffer(file);
        reader.onerror = reject;
    })
}

</script>