const browser = require('webextension-polyfill')

class NoteService {

    saveNote(request) {
        return browser.storage.local.set({
            [request.id]: request.note
        })
    }

    async getNote(id) {
        return (await browser.storage.local.get(id))[id] || null
    }
}

const noteService = new NoteService()

browser.runtime.onMessage.addListener( (message, sender, sendResponse) => {
    if (message.name === 'saveNote') {
        const saveNotePromise = noteService.saveNote(message.payload)
        saveNotePromise.then(() => sendResponse({status: 'success'})).catch(err => {
            console.error(err)
            sendResponse({status: 'failure', message: err.message})
        })
    } else if (message.name === 'getNote') {
        const getNotePromise = noteService.getNote(message.payload)
        getNotePromise.then(note => sendResponse({status: 'success', response: note})).catch(err => {
            console.error(err)
            sendResponse({status: 'failure', message: err.message})
        })
    }

    return true
})

