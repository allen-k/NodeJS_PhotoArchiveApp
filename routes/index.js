var fs = require('fs');

exports.index = function(req, res){
	if (req.session.user) {

		fs.readdir('./protectedPhotos/' + req.session.user, function (err, files) {
		  if (err) throw err;
		  imageList = files;
		  console.log('Files Found: ' + files.length);
		  res.render('home', { title: 'Home', user: req.session.user, images: files });
		});
	} else {
		res.render('login', { title: 'Login' });
	}
};

exports.loginError = function(req, res) {
	res.render('login', { title: 'Login Error' });
};

exports.register = function(req, res){
  res.render('register', { title: 'Register' });
};