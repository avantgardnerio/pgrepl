import uuidv4 from 'uuid/v4';

export default class SocketService {
    constructor(url, WebSocket) {
        this.url = url;
        this.WebSocket = WebSocket;
        this.id = uuidv4();
        this.timer = undefined;

        this._onopen = this._onopen.bind(this);
        this._send = this._send.bind(this);
        this._onmessage = this._onmessage.bind(this);
        this._onclose = this._onclose.bind(this);
    }

    connect() {
        this._ws = new this.WebSocket(this.url);
        this._ws.onopen = this._onopen;
        this._ws.onmessage = this._onmessage;
        this._ws.onclose = this._onclose;
        console.log('Connecting WebSocket', this.id);
    }

    close() {
        this._ws.close(1000);
        if (this.timer) clearInterval(this.timer);
        this._ws = undefined;
    }

    write(msg) {
        console.log(`Sending ${msg.type} on WebSocket ${this.id}`);
        const json = JSON.stringify(msg);
        this._send(json);
    };

    get connected() {
        return this._ws !== undefined;
    }

    _onopen() {
        console.info(`WebSocket ${this.id} Connected`);
        if (this.onConnect) this.onConnect();
        this.timer = setInterval(() => this.write({type: 'PING'}), 30000);
    };

    _send(message) {
        this._ws.send(message);
    };

    _onmessage(ev) {
        const msg = JSON.parse(ev.data);
        console.log(`Received ${msg.type} on WebSocket ${this.id}`);
        if (this.onMsg) this.onMsg(msg);
    };

    _onclose(ev) {
        if (this.timer) clearInterval(this.timer);
        this.timer = undefined;
        this._ws = undefined;
        if (this.onClose) this.onClose();
        console.log('Closing WebSocket', this.id);

        let codeMap = {};
        codeMap[1000] = "(NORMAL)";
        codeMap[1001] = "(ENDPOINT_GOING_AWAY)";
        codeMap[1002] = "(PROTOCOL_ERROR)";
        codeMap[1003] = "(UNSUPPORTED_DATA)";
        codeMap[1004] = "(UNUSED/RESERVED)";
        codeMap[1005] = "(INTERNAL/NO_CODE_PRESENT)";
        codeMap[1006] = "(INTERNAL/ABNORMAL_CLOSE)";
        codeMap[1007] = "(BAD_DATA)";
        codeMap[1008] = "(POLICY_VIOLATION)";
        codeMap[1009] = "(MESSAGE_TOO_BIG)";
        codeMap[1010] = "(HANDSHAKE/EXT_FAILURE)";
        codeMap[1011] = "(SERVER/UNEXPECTED_CONDITION)";
        codeMap[1015] = "(INTERNAL/TLS_ERROR)";
        const codeStr = codeMap[ev.code];
        console.info("  .code = " + ev.code + "  " + codeStr);
        console.info("  .reason = " + ev.reason);
    }
}
