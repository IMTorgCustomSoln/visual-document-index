import {ref} from 'vue'



// Managed Notes

export const ExportFileName = `${__EXPORT_FILE_NAME__}_v${__VERSION__}.json` 

export class TopicRecord{
  constructor(id, title, dropZoneName){
    this.id = id
    this.title = title
    this.dropZoneName = dropZoneName
  }
}

export class NoteRecord{
  constructor(id, list, type, innerHTML, innerText){
    this.id = id
    this.list = list
    this.type = type
    this.innerHTML = innerHTML
    this.innerText = innerText
  }
}
const notes_records = []
for (let idx=1; idx<=2; idx++){     //change for testing
  let text = 'Item '+idx
  let note = new NoteRecord(idx.toString(), 'stagingNotes', 'hand', '', text)
  notes_records.push(note)
}
export const ManagedNotesData = ref({
  topics: [],
  notes: notes_records
})




// Upload Input

export class DocumentRecord{
  constructor(
    id, reference_number, filepath, filename_original, filename_modified, 
    file_extension, filetype, page_nos, length_lines, file_size_mb, date,
    title, author, subject, toc, pp_toc, 
    body_pages, body, clean_body, readability_score, tag_categories, keywords, summary
    ){
      //file indexing
      this.id = id
      this.reference_number = reference_number
      this.filepath = filepath
      this.filename_original = filename_original
      this.filename_modified = filename_modified

      //raw
      this.file_extension = file_extension
      this.filetype = filetype 
      this.page_nos = page_nos
      this.length_lines = length_lines
      this.file_size_mb = file_size_mb 
      this.date = date

      //inferred / searchable
      this.title = title
      this.author = author 
      this.subject = subject
      this.toc = []
      this.pp_toc = pp_toc

      this.body_pages = body_pages
      this.body = body
      this.clean_body = clean_body
      this.readability_score = readability_score
      this.tag_categories = tag_categories
      this.keywords = keywords
      this.summary = summary

      //added by frontend
      this.length_lines_array = null
      this.date_created = null
      this.date_mod = null
      this.canvas_array = []

      this.sort_key = null
      this.hit_count = null
      this.snippets = null
      this.selected_snippet_page = null
      this._showDetails = null
      this.accumPageLines = null
    }
}
