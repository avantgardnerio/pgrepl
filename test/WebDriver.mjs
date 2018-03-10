import proc from 'child_process';

const BASE_URL = `http://127.0.0.1:9515`;

export default class WebDriver {
    constructor() {
        debugger;
        console.log(`spawn=`, proc.spawn);
        this.proc = proc.spawn('chromedriver', ['--port=9515']);
        this.proc.stdout.on('data', async (data) => console.log(data.toString()));
        this.proc.stderr.on('data', (data) => console.error(data.toString()));
        this.proc.on(`close`, (code) => this.exitCode = code);
    }

    async getStatus() {
        const res = await fetch(`${BASE_URL}/status`);
        const obj = await res.json();    
        return obj;
    }

    close() {
        const promise = new Promise((resolve) => this.proc.on(`close`, (code) => resolve(code)));
        this.proc.kill('SIGHUP');
        return promise;
    }
}