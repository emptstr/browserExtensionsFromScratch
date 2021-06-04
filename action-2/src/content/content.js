const NoteEditorComponent = require('../content/components/noteEditor.js')

class PauseVideoListener {

    listen() {
        const copyElapsedTime = () => {
            const textArea = document.createElement('textarea')
            textArea.value = `${window.location.href}&t=${this._getElapsedSeconds()}`
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            console.log('Copied elapsed time to clipboard')
        }

        document.querySelector('button[class^=ytp-play-button]').onclick = copyElapsedTime
        document.addEventListener('keydown', e => {
            if (e.code !== 'Space') return
            copyElapsedTime()
        })
    }

    _getElapsedSeconds() {
        return document.querySelector('div[class=ytp-progress-bar]').getAttribute('aria-valuenow')
    }
}

window.addEventListener('load', () => {
    new NoteEditorComponent().render()
    new PauseVideoListener().listen()
})