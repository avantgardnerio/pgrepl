import proc from 'child_process';
import fetch from 'isomorphic-fetch';
import webdriver from 'w3c-webdriver';

// (async () => {
//     try {
//         await session.go('http://localhost:8080');
//         const input = await session.findElement('css selector', '[name="first-name"]');
//         await a.sendKeys('Hello World');
//     } catch (err) {
//         console.log(err.stack);
//     } finally {
//         session.delete();
//     }
// })();

const BASE_URL = `http://127.0.0.1:4444`;

export default class WebDriver {
    constructor() {
        console.log('Starting webdriver...');
        this.proc = proc.spawn('chromedriver', ['--port=4444']);
        this.proc.stdout.on('data', async (data) => {
            const str = data.toString();
            if (str.includes(`on port 4444`)) this.started = true;
            console.log(str);
        });
        this.proc.stderr.on('data', (data) => console.error(data.toString()));
        console.log('Started webdriver.')
    }

    async getStatus() {
        const res = await fetch(`${BASE_URL}/status`);
        const obj = await res.json();
        return obj;
    }

    waitStart() {
        return new Promise((resolve, reject) => {
            const id = setInterval(() => {
                if (this.started) {
                    console.log(`chromedriver listening!`)
                    clearInterval(id);
                    resolve(true);
                }
            }, 100)
        })
    }

    waitForElements(qs, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = new Date().getTime();
            const id = setInterval(() => {
                if (new Date().getTime() - start >= 5000) {
                    clearInterval(id);
                    reject(new Error(`Timeout waiting for elements: ${qs}`));
                }
                this.find(qs).then((elements) => {
                    if(elements.length > 0) {
                        clearInterval(id);
                        resolve(elements);
                    }
                });
            }, 100);
        })
    }

    async createSession() {
        await this.waitStart();
        this.session = await webdriver.newSession('http://127.0.0.1:4444', {
            "desiredCapabilities": {
                "browserName": "chrome",
                "chromeOptions": {
                    "args": ["--headless", "--disable-gpu", "--no-sandbox"]
                }
            }
        });
    }

    async execute(script, args) {
         const message = await this.session.executeScript(script, args);
         return message;
    }

    async visit(url) {
        await this.session.go(url);
    }

    async find(qs) {
        return await this.session.findElements('css selector', qs);
    }

    async close() {
        console.log('Terminating webdriver...');
        if (this.session) await this.session.delete();
        this.proc.stdin.pause();
        this.proc.kill('SIGKILL');
    }
}