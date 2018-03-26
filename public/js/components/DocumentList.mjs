import {openDoc} from "../actions/databaseActions.mjs";

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

    docSelected(doc) {
        this.store.dispatch(push(`/documents/${doc.id}`));
    }

    onChange() {
        const state = this.store.getState();
        this.ul.innerHTML = ``;
        state.main.documents.forEach((doc) => {
            const li = document.createElement(`li`);
            li.onclick = () => this.docSelected(doc);
            li.innerText = doc.name;
            this.ul.appendChild(li);
        });
    }

    get element() {
        return this.el;
    }
}