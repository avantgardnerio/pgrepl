import express from 'express';
import path from 'path';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import debug from 'debug';
import dotenv from 'dotenv';
import expressWs from 'express-ws';
import migrations from 'sql-migrations';

import documents from './routes/documents';
import cfgSvc from '../src/services/ConfigService.mjs';
import SnapshotService from './services/SnapshotService.mjs';

debug('express:server');
dotenv.config();

const app = express();
expressWs(app);

app.ws('/echo', (ws, req) => {
    ws.on('message', async (msg) => {
        const action = JSON.parse(msg);
        console.log('websocket msg=', action);
        switch (action.type) {
            case 'SNAPSHOT_REQUEST':
                const ss = await SnapshotService.takeSnapshot(true);
                const msg = {
                    type: `SNAPSHOT_RESPONSE`,
                    payload: ss
                };
                ws.send(JSON.stringify(msg));
                break;
            default:
                console.log(`Unknown msg type:`, action.type);
                break;
        }
    });
});

// view engine setup
app.set('views', path.join(path.resolve('./src'), 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(path.resolve('./src'), 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

express.static.mime.define({'application/javascript': ['mjs', 'js']});
app.use(express.static(path.join(path.resolve('./src'), '../public')));
app.use(express.static(path.join(path.resolve('./src'), '../node_modules')));
app.use('/node_modules', (req, res) => {
    res.setHeader('content-type', 'text/javascript');
    res.end(`export default false; // Fool chrome into working with node`);
});

app.use('/api', documents);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    if (req.url.startsWith(`/api`)) {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    } else {
        res.sendFile(path.join(path.resolve('./src'), '../public/index.html'));
    }
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const port = parseInt(process.env.PORT, 10) || 3000;
app.set('port', port);

// export const server = http.createServer(app);

app.on('error', (er) => {
    console.error(er);
    process.exit(1)
});
app.on('listening', () => console.log(`listening on ${server.address().port}`));

const configuration = {
    migrationsDir: './migrations',
    host: 'localhost',
    port: 5432,
    db: cfgSvc.dbName,
    user: 'postgres',
    password: 'postgres'
};
const migrate = async () => {
    await migrations.migrate(configuration);
    app.server = app.listen(port);
};

export const started = migrate();

export default app;
