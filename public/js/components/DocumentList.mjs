export default class DocumentList {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange());
        const html = `<ul></ul>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
        this.onChange();
    }

    onChange() {
        const state = this.store.getState();
        const html = state.documents.reduce((acc, p) => `${acc}<li>${p.name}</li>`, ``);
        this.el.innerHTML = html;
    }

    get element() {
        return this.el;
    }
}