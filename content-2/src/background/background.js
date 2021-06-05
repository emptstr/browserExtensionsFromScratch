const browser = require('webextension-polyfill')

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.name === 'saveContent') {
        console.log('received message')
    } else if (message.name === 'getCurrentVideoId') {

    }
    sendResponse('response sent')
    return true
})