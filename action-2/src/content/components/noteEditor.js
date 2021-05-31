const Bacon = require('baconjs')
const SimpleMDE = require('simplemde')
const { Notyf } = require('notyf')

class NoteEditorComponent {

    constructor() {
        this.mde = null
    }

    render() {
        const relatedVideosSidebar = document.getElementById('related')
        const noteWidget = document.createElement('div')
        relatedVideosSidebar.insertBefore(noteWidget, relatedVideosSidebar.childNodes[0])
        noteWidget.innerHTML = `
        <div id="noteEditor">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
          <textarea id='noteEditorTextArea' cols="30" rows="10"></textarea>
        </div>`
        const contentChangeListener = new ContentChangeListener({
            markdownEditor: MarkdownEditorFactory.getInstance(),
        })
        contentChangeListener.listen()
    }
}

class MarkdownEditorFactory {

    static getInstance() {
        const markdownEditor = new SimpleMDE({
            element: document.getElementById('noteEditorTextArea'),
            autofocus: true
        })
        markdownEditor.value(window.note || 'Start typing something...')
        return markdownEditor
    }
}

class ContentChangeListener {

    constructor({ markdownEditor }) {
        this.markdownEditor = markdownEditor
    }

    listen() {
        const stream = Bacon.fromEvent(this.markdownEditor.codemirror, 'change').debounce(3000)
        stream.onValue(() => {
            console.log('Content changed')
            window.note = this.markdownEditor.value()
            const notfy = new Notyf({duration: 5000, dismissible: true, position: { x: "center", y: "top"}})
            notfy.success('All changes saved')
        })
    }
}

module.exports = NoteEditorComponent