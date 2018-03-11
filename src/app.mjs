import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import debug from 'debug';
import http from 'http';

import index from './routes/index';
import users from './routes/users';

debug('express:server');

const app = express();

// view engine setup
app.set('views', path.join(path.resolve('./src'), 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(path.resolve('./src'), 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

express.static.mime.define({ 'application/javascript': ['mjs', 'js'] });
app.use(express.static(path.join(path.resolve('./src'), '../public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

const port = parseInt(process.env.PORT, 10) || '3000';
app.set('port', port);

export const server = http.createServer(app);

server.listen(port);
server.on('error', (er) => { console.error(er); process.exit(1) });
server.on('listening', () => console.log(`listening on ${server.address().port}`));

export default app;
