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

  - ~~fix TOC~~
  - ~~highlight dropzone background on dragover~~
  - create new Search parent component to Table
  - tooltip on notes for document reference (doc:name, pg:page, charac:index_by_page)
  - ~~download notes to readable format~~
  - backticks to support alternative search format
  - zoom on bootstrap-vue image carousel
  - row details small, (more) btn click to lengthen down
  - file loading
    + check file sizes
    + checl file load takes too long
    + additional error handling for the browser
  - unit testing - vitest, jest: https://vuejs.org/guide/scaling-up/testing.html
  - load test File Reader
  - append additional data records to table
  - export / import logic for primary data records and lunrjs
  - add Tour, About, and Settings buttons
  - add other fields to search: keywords, summary
  - highlight text snippet in document image (remove `char.` locator)
  - useTextSelection: https://vueuse.org/core/useTextSelection/
* wink
  - subject
  - keywords
  - snippet - extract summary
  - snippet - improve search results
* ~~file-type: ensure only `.pdf` can be uploaded~~
* ~~import pdf nested loops~~
  - promises in loop: https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
  - extract pdf: [ref-1](https://stackoverflow.com/questions/1554280/how-to-extract-text-from-a-pdf-in-javascript?rq=3), [ref-2](https://stackoverflow.com/questions/40635979/how-to-correctly-extract-text-from-a-pdf-using-pdf-js), [ref-3](https://stackoverflow.com/questions/40482569/troubles-with-pdf-js-promises/40494019#40494019), [ref-4](https://stackoverflow.com/questions/61669405/forcing-a-function-to-wait-until-another-function-is-complete)