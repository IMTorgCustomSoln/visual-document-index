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
* basic
  - ~~combine path and filename~~
  - ~~add title~~
  - ~~add upload icon with highlight, then disable~~
* bootstrap-vue
  - ~~check whether clean_body has duplicates, such as beginning~~
  - ~~results score should be formatted and rounded~~
  - ~~get positions for ALL terms from search: https://lunrjs.com/guides/core_concepts.html~~
  - ~~add error response for incorrect search~~
  - try search patterns:
    'foo' all search is on stemmed terms
    '+foo +bar' for logical AND search, '+foo bar -baz' 
    '*foo'
    'title:foo'
    'foo^10 bar' for weigting of 10times higher than bar 
    'foo~1' one edit distance of foo in fuzzy matching 
  - ~~add page numbers to result snippets~~
  - ~~determine strongest N positions to display - WAIT, how to determine N ??? options~~
    ~~N as a proportion of document length~~
    ~~show all and scroll down (will this effect performance)~~
  - add other fields to search: keywords, summary
  - add summary by taking first N of each clean_body
  - 
  - ~~clean_body - improve formatting and determination of sentences~~
  - ~~upload icon - https://stackoverflow.com/questions/572768/styling-an-input-type-file-button~~
  - search 
    - ~~sort rows by highest lunr score~~
    - ~~total number of results below search~~, result count in each row_details
    - ~~use results position array to fill snippets~~
    - ~~loop row_details snippets to show top N results~~
  - ~~snippet - reduce font size~~
  - snippet - enable multiple search hits within a document `more...`
  - ~~snippet - change between summary and search results~~
  - tooltips - create tips for search, others
  - useTextSelection: https://vueuse.org/core/useTextSelection/
  - sidebar - https://bootstrap-vue.org/docs/components/sidebar
  - testing - vitest, jest: https://vuejs.org/guide/scaling-up/testing.html
* wink
  - subject
  - keywords
  - snippet - extract summary
  - snippet - improve search results
* file-type: ensure only `.pdf` can be uploaded
* ~~textract: improve raw data extraction~~
* advanced
  - allow selecting / highlighting of text within search results
  - open sidebar to reveal topics management
  - save selected text to specific topic
  - fix TOC
* import pdf nested loops
  - promises in loop: https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
  - extract pdf: [ref-1](https://stackoverflow.com/questions/1554280/how-to-extract-text-from-a-pdf-in-javascript?rq=3), [ref-2](https://stackoverflow.com/questions/40635979/how-to-correctly-extract-text-from-a-pdf-using-pdf-js), [ref-3](https://stackoverflow.com/questions/40482569/troubles-with-pdf-js-promises/40494019#40494019), [ref-4](https://stackoverflow.com/questions/61669405/forcing-a-function-to-wait-until-another-function-is-complete)
  - 