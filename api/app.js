var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressSanitizer = require('express-sanitizer');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var mysql = require('mysql')

let con = mysql.createConnection({
  host     : 'localhost',
  user     : 'admin',
  password : 'password',
  database : 'matcha_db'
});
con.connect()
app.use(function(req, res, next){
	res.locals.connection = con
//	res.locals.connection.connect();
	next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(expressSanitizer());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  res.locals.connection.end()
});

module.exports = app;
