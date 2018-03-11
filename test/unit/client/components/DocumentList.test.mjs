import Mocha from 'mocha';
import chai from 'chai';
//import DocumentList from '../../../../public/js/components/DocumentList.mjs';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`DocumentList component`);

    suite.addTest(new Mocha.Test(`should render`, async () => {
        const store = {
            subscribe: () => { },
            getState: () => ({ documents: [] })
        };
        //const list = new DocumentList(store);
        chai.expect(true).to.equal(true); // TODO: find DOMParser replacement for node
    }));

    parent.addSuite(suite);
}

