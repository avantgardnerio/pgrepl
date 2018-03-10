export default class App {
    constructor() {
        const html = `
            <div>
                Hello world!
            </div>
        `;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
    }

    get element() {
        return this.el;
    }
}