import { getDocuments } from '../actions/actions.mjs';
import reducer from '../reducers/reducer.mjs';
import DocumentList from './DocumentList.mjs';

export default class App {
    constructor(id) {
        const middleware = Redux.applyMiddleware(ReduxThunk.default);
        this.store = Redux.createStore(reducer, middleware);
        const html = `<div id=${id}></div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;

        this.documentList = new DocumentList(this.store);
        this.el.appendChild(this.documentList.el);
        this.load();
    }

    async load() {
        this.store.dispatch(getDocuments());
    }

    get element() {
        return this.el;
    }
}