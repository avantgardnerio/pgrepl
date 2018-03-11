import { saveDocument } from '../actions/actions.mjs';
import uuid from '../util/uuid.mjs';

export default class DocumentNew {
    constructor(store) {
        this.store = store;
        const html = `
        <div>
            <table>
                <tr>
                    <td>Document Name</td>
                    <td><input type="text"></input></td>
                </tr>
            </table>
            <button>Save</button>
        </div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;
        this.tbName = this.el.querySelector(`input`);
        this.btnSave = this.el.querySelector(`button`);
        this.btnSave.onclick = () => this.onSave();
    }

    onSave() {
        const doc = {
            id: uuid(),
            name: this.tbName.value,
            curTxnId: uuid()
        };
        this.store.dispatch(saveDocument(doc));
    }

    get element() {
        return this.el;
    }
}