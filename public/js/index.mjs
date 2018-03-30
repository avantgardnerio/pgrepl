import App from './components/App.mjs';

onload = async () => {
    try {
        const app = new App(`app`);
        document.body.appendChild(app.el);
    } catch (er) {
        console.error(`index.mjs`, er);
    }
};