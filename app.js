
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var users = require('./users.json');
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir: './tempUpload',keepExtensions: true}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('allen-assign1-interactive'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'protectedPhotos')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function authenticate(name, pass, fn) {
  var user = users[name];
  if (!user) return fn(new Error('cannot find user'));
  if(users[name] == pass)
	return fn(null,name);
  else
	return fn(new Error("Invalid Password"));
}

function register(name, pass, fn) {
  var user = users[name];
  if (user) return fn(new Error('user already exists'));
  users[name] = pass;
  fs.writeFile('./users.json', JSON.stringify(users), function (err) {
    if (err) return console.log(err);
    console.log("users.json updated.");
  });
  fs.mkdir('./protectedPhotos/' + name, function (err) {
    if (err) return console.log(err);
    console.log("user folder created");
  });
  return fn(null,name);
}

app.get('/', routes.index);
app.get('/register', routes.register);
app.get('/loginError', routes.loginError);
app.post('/register/new', function(req, res) {
	register(req.body.uname, req.body.upass, function(err, user){
    if (user) {
      req.session.user = user;
      res.redirect('/');
    } else {
      res.render('registerError', { title: 'Register' });
    }
  });
});
app.get('/logout', function(req, res) {
	req.session.destroy(function(){
    res.redirect('/');
  });
});
app.post('/login', function(req, res) {
	authenticate(req.body.uname, req.body.upass, function(err, user){
    if (user) {
      req.session.regenerate(function(){
        req.session.user = user;
        res.redirect('/');
      });
    } else {
      res.redirect('/loginError');
    }
  });
});
app.post('/upload', function (req, res) {
  console.log("trying to upload image!");
  
  var tempPath = req.files.imageUpload.path;
  var d = new Date();
  var n = d.getTime();
  var targetPath = path.resolve('./protectedPhotos/' + req.session.user + '/' + n + '_' + req.files.imageUpload.name);
    fs.rename(tempPath, targetPath, function(err) {
      if (err) throw err;
      console.log("Upload completed!");
    });
  res.redirect('/');
});
app.get('/delete/:file', function (req, res) {
  var fileToDelete = './protectedPhotos/' + req.session.user + '/' + req.params.file;
  fs.unlink(fileToDelete, function (err) {
    if (err) throw err;
    console.log('successfully deleted /tmp/hello');
    res.redirect('/');
  });
});
app.get('/view/:file', function (req, res) {
  var fileToView = '/' + req.session.user + '/' + req.params.file;
  res.render('view', {title: 'View Image',user: req.session.user, file: fileToView, fileName: req.params.file});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('\n\n');
  console.log("IGNORE the connect.multipart() warning!\n");
  console.log('Express server listening on port ' + app.get('port'));
});
