import {getDocuments} from '../actions/appActions.mjs';
import DocumentList from './DocumentList.mjs';
import DocumentNew from './DocumentNew.mjs';
import DocumentEdit from './DocumentEdit.mjs';
import ReplClient from '../services/ReplClient.mjs';
import reducer from '../reducers/reducer.mjs';

const {createBrowserHistory, routerReducer, routerMiddleware, startListener} = ReduxFirstRouting || window.ReduxFirstRouting;

export default class App {
    constructor(id) {
        window.apps = window.apps || [];
        window.apps.push(this);

        const protocol = document.location.protocol === `http:` ? `ws:` : `wss:`;
        const wsUrl = `${protocol}//${document.location.host}/echo`;
        const history = createBrowserHistory();
        this.client = new ReplClient(
            {
                router: routerReducer,
                main: reducer
            },
            [routerMiddleware(history)],
            wsUrl,
            WebSocket
        );
        this.store = this.client.store;
        startListener(history, this.store);

        const html = `<div id=${id}></div>`;
        this.el = new DOMParser().parseFromString(html, `text/html`).body.firstChild;

        this.documentList = new DocumentList(this.store);
        this.documentNew = new DocumentNew(this.store);
        this.documentEdit = new DocumentEdit(this.store);
        this.el.appendChild(this.documentList.el);
        this.load();

        this.store.subscribe(() => this.render());
    }

    render() {
        const state = this.store.getState();
        const url = state.router.pathname;
        this.el.innerHTML = ``;
        if (`/documents/new` === url) this.el.appendChild(this.documentNew.el);
        else if (/\/documents\/(0-9a-fA-F-)*/.test(url)) this.el.appendChild(this.documentEdit.el);
        else this.el.appendChild(this.documentList.el);
    }

    async load() {
        this.store.dispatch(getDocuments());
    }

    get element() {
        return this.el;
    }
}