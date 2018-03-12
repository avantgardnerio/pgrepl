import { getDocuments } from '../actions/actions.mjs';
import reducer from '../reducers/reducer.mjs';
import DocumentList from './DocumentList.mjs';
import DocumentNew from './DocumentNew.mjs';
import DocumentEdit from './DocumentEdit.mjs';

const { combineReducers, applyMiddleware, createStore } = Redux;
const { createBrowserHistory, routerReducer, routerMiddleware, startListener } = ReduxFirstRouting;

export default class App {
    constructor(id) {
        window.apps = window.apps || [];
        window.apps.push(this);
        
        const history = createBrowserHistory();

        const rootReducer = combineReducers({
            main: reducer,
            router: routerReducer
        });
        const middleware = applyMiddleware(
            ReduxThunk.default, 
            routerMiddleware(history)
        );
        this.store = createStore(rootReducer, middleware);
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
        if(`/documents/new` === url) this.el.appendChild(this.documentNew.el);
        else if(/\/documents\/(0-9a-zA-z\-)*/.test(url)) this.el.appendChild(this.documentEdit.el);
        else this.el.appendChild(this.documentList.el);
    }

    async load() {
        this.store.dispatch(getDocuments());
    }

    get element() {
        return this.el;
    }
}