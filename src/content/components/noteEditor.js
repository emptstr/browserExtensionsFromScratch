const Bacon = require('baconjs')
const SimpleMDE = require('simplemde')
const {Notyf} = require('notyf')
const browser = require('webextension-polyfill')

class NoteEditorComponent {

    constructor() {
        this.mde = null
    }

    async render() {
        const relatedVideosSidebar = document.getElementById('related')
        let noteWidget = document.createElement('noteWidget')
        relatedVideosSidebar.insertBefore(noteWidget, relatedVideosSidebar.childNodes[0])

        noteWidget.innerHTML = `
        <div id="noteEditor">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
          <textarea id='noteEditorTextArea' cols="30" rows="10"></textarea>
        </div>`

        const markdownEditor = await MarkdownEditorFactory.getInstance()

        const contentChangeListener = new ContentChangeListener({
            markdownEditor
        })
        contentChangeListener.listen()
    }
}

class CurrentVideo {

    static id() {
        return /v=(.*)/.exec(window.location.href)[1]
    }
}

class MarkdownEditorFactory {

    static async getInstance() {
        const markdownEditor = new SimpleMDE({
            element: document.getElementById('noteEditorTextArea'),
            autofocus: true
        })

        const result = await browser.runtime.sendMessage({
            name: 'getNote',
            payload: CurrentVideo.id()
        })

        markdownEditor.value(result.response || 'Start typing something...')
        return markdownEditor
    }
}

class ContentChangeListener {

    constructor({markdownEditor}) {
        this.markdownEditor = markdownEditor
    }

    listen() {
        const stream = Bacon.fromEvent(this.markdownEditor.codemirror, 'change').debounce(3000)
        stream.onValue(async () => {
            const note = this.markdownEditor.value()

            const result = await browser.runtime.sendMessage({
                name: 'saveNote',
                payload: {id: CurrentVideo.id(), note: note}
            })

            const notfy = new Notyf({duration: 5000, dismissible: true, position: {x: "center", y: "top"}})

            console.log(result)

            if (result.status === 'success') {
                notfy.success('All changes saved')
            } else {
                notfy.error(result.message || 'Failed to save note')
            }
        })
    }
}

module.exports = NoteEditorComponent