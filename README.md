# Visual Document Index

## Build

This project builds into a single file: `./dist/index.html` using the [plugin](https://github.com/richardtallent/vite-plugin-singlefile) with command:

```
npm run build
```

## Develop

```
npm run dev
```

## References

* Bootstrap-vue is not quite ready for Vue3 (explained [here](https://bootstrap-vue.org/vue3))
* Vue3 compat(ability) [setup](https://stackblitz.com/edit/bootstrap-vue-with-compat?file=main.js) is used
* using pdfjs-dist with [vite, rollup](https://erindoyle.dev/using-pdfjs-with-vite/)
* import file, [ref](https://laracasts.com/discuss/channels/vue/how-to-import-a-js-file-in-vue)
* importing pdfjs-dist web worker, [ref](https://stackoverflow.com/questions/71551448/how-do-you-import-javascript-file-from-node-modules-into-react-using-vite)
* pdfjs-dist: `Warning: Setting up fake worker` is just a warning, not an error to worry about, [ref](https://stackoverflow.com/questions/74452371/pdfjs-what-is-a-fake-worker-how-to-solve-it)
* alternative module [pdfjs](https://github.com/rkusa/pdfjs)

## ToDo

* ~~pdfjs-dist~~
* bootstrap-vue
  - ~~row file_size - only keep human readable (check column sort)
  - clean_body - improve formatting and determination of sentences
  - search - sort id by highest lunr score
  - snippet - reduce font size
  - snippet - include page numbers, paragraph
  - snippet - enable multiple search hits within a document `more...`
  - snippet - change between summary and search results
  - tooltips - create tips for search, others
* wink
  - subject
  - keywords
  - snippet - extract summary
  - snippet - improve search results
* file-type: ensure only `.pdf` can be uploaded
* textract: improve raw data extraction
* advanced
  - allow selecting / highlighting of text within search results
  - open sidebar to reveal topics management
  - save selected text to specific topic
