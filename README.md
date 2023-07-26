# Visual Document Index

## Build

This project builds into a single file: `./dist/index.html` using the [plugin](https://github.com/richardtallent/vite-plugin-singlefile) with command:

```
npm run build
```

## Develop

Begin interactive (hot-reload) development with command:

```
npm run dev
```

If you need to re-evaluate the model estimates, this can be done using python.  Either run the pytest `test_create_estimation_model.py`, interactively, or directly via the commandline:

```
python create_estimation_model.py --input_dir = "./tests/logs/"
```

## References

* Bootstrap-vue is not quite ready for Vue3 (explained [here](https://bootstrap-vue.org/vue3))
  - bootstrap-vue and vuetify are the most popular css frameworks
  - primevue seems to have many components / features and is steadily increasing in popularity
* Vue3 compat(ability) [setup](https://stackblitz.com/edit/bootstrap-vue-with-compat?file=main.js) is used
* using pdfjs-dist with [vite, rollup](https://erindoyle.dev/using-pdfjs-with-vite/)
* import file, [ref](https://laracasts.com/discuss/channels/vue/how-to-import-a-js-file-in-vue)
* importing pdfjs-dist web worker, [ref](https://stackoverflow.com/questions/71551448/how-do-you-import-javascript-file-from-node-modules-into-react-using-vite)
* pdfjs-dist: `Warning: Setting up fake worker` is just a warning, not an error to worry about, [ref](https://stackoverflow.com/questions/74452371/pdfjs-what-is-a-fake-worker-how-to-solve-it)
* alternative module [pdfjs](https://github.com/rkusa/pdfjs)
* using `draggable` component would enable sorting within dropzone


## ToDo

* ~~place About button~~
* ~~add `scoped` to all components' style~~
* exact phrase search
  - FAIL, search opens activeTab to image
  - page for snippet is sometimes incorrect; ensure this is aligned
  - fix score for failed exact match
  - highlight snippet in page image
  - fix `query` var to show actual terms searched and format nicely
* add save / continue functionality
  - ~~save lunrjs index to DocumentMetadata~~
  - ~~pass all of DocumentMetadata to App~~
  - ~~save all objects to file~~
  - ~~move 'continue' to the ImportData.vue~~
  - ~~deactivate 'Import Workspace' tab, or alert 'This will delete all current records'~~
  - ~~cleanup SaveWork.vue by removing comments and ensuring correctness~~
  
* file loading
  - checks
    + add batch_idx to log output
    + ~~fix progress bar (maybe load.event)~~
    + ~~provide load results instead of immediately exiting modal~~
    + ~~logs and export of import times~~
    + ~~check whether actual pdf or pdf of images (scanned) (acrobat enables OCR to make searchable)~~ DANGER OF NOT SEARCHING, SO DO NOT ADD TO FILES []
    + ~~provide estimate for load time (min,sec) based on (file count, file size)~~
    + create output report with model estimates (coef, rsq, ...)
    + find limits for upload capacity: number of files and total size
    + checks to determine if file load takes too long
    + additional error handling for the browser
* test
  - unit testing - vitest, jest: https://vuejs.org/guide/scaling-up/testing.html
  - load test File Reader

* search
  - drop-down for search type (stem, exact, proximity, word vector)
  - search within distance (proximity)
  - big pdf, ppt, excel, docx
  - 30-40 pdfs for loan file (hand-written, signatures, etc.)
* change layout to index and full-page pdf
* additional support
  - add Tour, About, and Settings buttons (https://driverjs.com/docs/installation/)
  - add other fields to search: keywords, summary
  - adjust row details to reasonable height
  - zoom on bootstrap-vue image carousel
  - row details small, (more) btn click to lengthen down
  - highlight text snippet in document image (remove `char.` locator)
  - useTextSelection: https://vueuse.org/core/useTextSelection/
* prepare for performance
  - what size dataset should we expect?
  - model load [ref](https://queue.acm.org/detail.cfm?id=3595862)
  - what should be done on the server? [ref](https://stackoverflow.com/questions/17078210/searching-a-large-amount-of-text-using-javascript-and-html5-storage)
  - writing to file: `Uncaught InternalError: allocation size overflow`
  - read files in chunks: [ref](https://stackoverflow.com/questions/14438187/javascript-filereader-parsing-long-file-in-chunks), [ref](https://stackoverflow.com/questions/50254537/how-to-read-any-local-file-by-chunks-using-javascript), [ref](https://stackoverflow.com/questions/55468777/json-stringify-large-object-optimization)
  - write files in [streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_writable_streams)
  - do not search until ready by pressing return
  - lazily return snippets
  - do not automatically move to page on snippet hover; instead, require a click
  - improve search speed

* wink nlp
  - subject
  - keywords
  - snippet - extract summary
  - snippet - improve search results
* ~~file-type: ensure only `.pdf` can be uploaded~~
* ~~import pdf nested loops~~
  - promises in loop: https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
  - extract pdf: [ref-1](https://stackoverflow.com/questions/1554280/how-to-extract-text-from-a-pdf-in-javascript?rq=3), [ref-2](https://stackoverflow.com/questions/40635979/how-to-correctly-extract-text-from-a-pdf-using-pdf-js), [ref-3](https://stackoverflow.com/questions/40482569/troubles-with-pdf-js-promises/40494019#40494019), [ref-4](https://stackoverflow.com/questions/61669405/forcing-a-function-to-wait-until-another-function-is-complete)