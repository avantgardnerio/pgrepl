const { push } = ReduxFirstRouting;

export default class DocumentList {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange());
        const html = `
        <div>
            <ul></ul>
            <button class="documentNew">New Document</button>
        </div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
        this.ul = this.el.querySelector(`ul`);
        this.btnNewDoc = this.el.querySelector(`button`);
        this.btnNewDoc.onclick = () => this.newDocument();
        this.onChange();
    }

    newDocument() {
        this.store.dispatch(push(`/documents/new`));
    }

    onChange() {
        const state = this.store.getState();
        const html = state.main.documents.reduce((acc, p) => `${acc}<li>${p.name}</li>`, ``);
        this.ul.innerHTML = html;
    }

    get element() {
        return this.el;
    }
}