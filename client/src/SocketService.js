import uuidv4 from 'uuid/v4';

export default class SocketService {
    constructor() {
        this.id = uuidv4();
        this.timer = undefined;
    }

    connect() {
        const location = document.location.toString()
                .replace('http://', 'ws://')
                .replace(":3000", ":8080")
            + "echo";
        try {
            this._ws = new WebSocket(location);
            this._ws.onopen = this._onopen;
            this._ws.onmessage = this._onmessage;
            this._ws.onclose = this._onclose;
            console.log('Connecting WebSocket', this.id);
        } catch (exception) {
            console.error("Connect Error: " + exception);
        }
    }

    close() {
        this._ws.close(1000);
        this._ws = undefined;
    }

    write(msg) {
        const json = JSON.stringify(msg);
        this._send(json);
    };

    _onopen = () => {
        console.info("Websocket Connected");
        if(this.onConnect) this.onConnect();
        this.timer = setInterval(() => this.write({type: 'PING'}), 30000);
    };

    _send = (message) => {
        console.log('Sending message on WebSocket', this.id);
        this._ws.send(message);
    };

    _onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if(this.onMsg) this.onMsg(msg);
    };

    _onclose = (ev) => {
        if(this.timer) clearInterval(this.timer);
        this.timer = undefined;
        this._ws = undefined;
        if(this.onClose) this.onClose();
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
