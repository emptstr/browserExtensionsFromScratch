const HelloWorldComponent = require('./components/helloWorld.js')

window.addEventListener('load', () => {
    window.document.body.innerHTML = new HelloWorldComponent().render()
})