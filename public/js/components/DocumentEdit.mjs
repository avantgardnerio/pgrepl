import uuidv4 from '../util/uuid.mjs';
import {createInsertRowAction, createTxnAction, openDoc} from '../actions/databaseActions.mjs';

export default class DocumentEdit {
    constructor(store) {
        this.store = store;
        this.store.subscribe(() => this.onChange());
        this.src = undefined;
        this.dst = undefined;

        const html = `
        <svg style="width: 100%; height: 100%" viewbox="0 0 1 1" 
                preserveAspectRatio="xMidyMid meet">
            <rect x="0" y="0" width="1" height="1" stroke-width="2" stroke="black" vector-effect="non-scaling-stroke" 
                fill-opacity="0"/>
        </svg>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;

        this.el.onclick = (e) => this.onClick(e);
        this.el.onmousemove = (e) => this.onMouseMove(e);

        this.onChange();
    }

    screenToView(pos) {
        if (this.el.clientHeight > this.el.clientWidth) {
            const offset = (this.el.clientHeight - this.el.clientWidth) / 2;
            const x = pos[0] / this.el.clientWidth;
            const y = (pos[1] - offset) / this.el.clientWidth;
            return [x, y];
        } else {
            const offset = (this.el.clientWidth - this.el.clientHeight) / 2;
            const y = pos[1] / this.el.clientHeight;
            const x = (pos[0] - offset) / this.el.clientHeight;
            return [x, y];
        }
    }

    onClick(e) {
        if (!this.currentEl) {
            const pos = [e.offsetX, e.offsetY];
            this.src = this.screenToView(pos);
            this.dst = this.screenToView(pos);
            this.currentEl = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            this.currentEl.setAttribute("x1", this.src[0]);
            this.currentEl.setAttribute("y1", this.src[1]);
            this.currentEl.setAttribute("x2", this.dst[0]);
            this.currentEl.setAttribute("y2", this.dst[1]);
            this.currentEl.setAttribute("vector-effect", "non-scaling-stroke");
            this.currentEl.setAttribute("stroke", "black");
            this.currentEl.setAttribute("stroke-width", "2");
            this.el.appendChild(this.currentEl);
        } else {
            const line = {
                id: uuidv4(),
                documentId: uuidv4(), // TODO: correct id
                x1: this.src[0],
                y1: this.src[1],
                x2: this.dst[0],
                y2: this.dst[1],
                'stroke-width': 2,
                'vector-effect': "non-scaling-stroke"
            };
            const insertLine = createInsertRowAction('line', line);
            const txn = createTxnAction([insertLine]);
            this.store.dispatch(txn);
            this.el.removeChild(this.currentEl);
            this.currentEl = undefined;
        }
    }

    onMouseMove(e) {
        if (!this.currentEl) return;
        const pos = [e.offsetX, e.offsetY];
        this.dst = this.screenToView(pos);
        this.currentEl.setAttribute(`x2`, this.dst[0]);
        this.currentEl.setAttribute(`y2`, this.dst[1]);
    }

    get docId() {
        const url = this.store.getState().router.pathname;
        const matches = url.match(/\/documents\/([0-9a-zA-Z-]*)/);
        if (!matches || !matches.length || matches.length < 2) return undefined;
        const docId = matches[1];
        return docId;
    }

    onChange() {
        const state = this.store.getState();
        const doc = state.db.documents[this.docId];
        if(!doc) this.store.dispatch(openDoc(this.docId));
    }

    get element() {
        return this.el;
    }
}