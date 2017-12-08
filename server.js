var express = require('express');
var app = express();
var path = require('path');
const bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
const saltRounds = 10;
var mongo = require('mongodb').MongoClient;
ObjectID = require('mongodb').ObjectID;
var url = process.env.MONGOLAB_URI;
var port = process.env.PORT || 8080;
var loggedIn = false;
var username = '';
var errorCodes = ['It looks like you have entered an incorrect password. Please try again.', 'Your poll must have a title.',
'You haven\'t entered any valid options for your poll. Please try again', 'Sorry, a poll with this title already exists.',
'Sorry, you have already voted in this poll.', 'wWe could not find your username. Please double check spelling or sign up.',
'Sorry, this user already exists'];


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

//home page
app.get('/', function(req,res) {
	mongo.connect(url, function(err,db) {
			if (err) {
				console.log(err);
				return res.redirect('/err?errorCode=' + err);
			}
			
			else {
				var collection = db.collection('polls1');
				collection.find().toArray(function(err, data) {
					if (err) {
						console.log(err);
						return res.redirect('/err?errorCode=' + err);
					}
					
					else {
						return res.render('pages/index', {data: data, loggedIn: loggedIn, email: username});
					}
				});
			}
		});
});

//render template for registered users to authenticate themselves
app.get('/signin', function(req,res) {
	return res.render('pages/signin');
});

//user signs in
app.post('/signin', function(req,res) {
	var email = req.body.email;
	var password = req.body.password;
	mongo.connect(url, function(err,db) {
		var collection = db.collection('users1');
		collection.find({email: email}).toArray(function(err,data) {
			if (err) {
				console.log(err);
				return res.redirect('/err?errorCode=' + err);
			}

			else {
				//see if search returned a user
				if (data.length == 1) {
					var hash = data[0].password;
					bcrypt.compare(password, hash, function(err, response) {
					    if (err) {
					    	console.log(err);
					    	return res.redirect('/err?errorCode=' + err);
					    }

					    else {
					    	//all tests passed log use in
                            if (response) {
                                loggedIn = true;
                                username = email;
                                return res.redirect('/');
                            }
                            //use entered incorrect password.
                            else {
								console.log('Incorrect password.');
								return res.redirect('/error?errorCode=' + errorCodes[0]);
                            }
                            
					    }

					});

				}

				else {
					console.log('we could not find your username. please double check spelling or sign up.');
					return res.redirect('/error?errorCode=' + errorCodes[5])
				}
			}
		});
	});
});

//log user out
app.get('/logout', function(req, res) {
    loggedIn = false;
    username = '';
    return res.redirect('/');
});

//render sign up template
app.get('/signup', function(req,res) {
	return res.render('pages/signup');
});

//user submits data to create an account
app.post('/signup', function(req,res) {
	var email = req.body.email;
	var password = req.body.password;
	//create variable for potential new password hash if it is a new user
	var hashedPassword;
	mongo.connect(url, function(err,db) {
		var collection = db.collection('users1');
		collection.find({email: email}).toArray(function(err,data) {
			if (err) {
				console.log(err);
				return res.redirect('/err?errorCode=' + err);
			}

			else {
				//check to see if user name is found
				if (data.length < 1) {
					//no user found, so has password before storing
					bcrypt.hash(password, saltRounds, function(err, hash) {
					  // Store hash in your password DB.
					  if (err) {
					  	console.log(err);
					  	return res.redirect('/err?errorCode=' + err);
					  }

					  else {
					  	hashedPassword = hash;
					  	//instert username w/ hashed password into the db
					  	collection.insert({
					  		email: email,
					  		password: hashedPassword
					  	}, function(err, data) {
					  		if (err) {
					  			console.log(err);
					  			return res.redirect('/err?errorCode=' + err);
					  		}
							//probably should remove this else bc its irrelevant////////////////////////////////////////////////////////////////////////////
					  		else {
					  			//log submitted entry
					  			console.log(data);

					  		}
					  	});
					  }
					});
					return res.redirect('/');
				}

				else {
					console.log('user already exists');
					return res.redirect('/error?errorCode=' + errorCodes[6]);
				}
			}
		});
	});
});

//load new poll form page
app.get('/newpoll', function(req,res) {
	return res.render('pages/newpoll', {email: username});
});

//create new poll
app.post('/newpoll', function(req,res) {
    var title = req.body["poll-title"]; 
    if (title == null || title == undefined || title == '') {
    	console.log('it looks like your poll does not have a title. please try again');
    	return res.redirect('/error?errorCode=' + errorCodes[1]);
    }
    var options = req.body.options;
    options = options.split(/\r?\n/);
    var temp = {};
    for (var i = 0; i < options.length; i++) {
    	
    	if (options[i] == null || options[i] == undefined || options[i] == '') {
    	}

    	else {
    		temp[options[i]] = 0;
    	}
    	//after checking last element in array, set temp equal to options and end the loop
    	if (i == options.length - 1) {
    		options = temp;
    		break;
    	}
    }

    if (Object.keys(options).length === 0) {
    	console.log('you haven\'t entered any valid options for your poll. please try again');
    	return res.redirect('/error?errorCode=' + errorCodes[2]);
    } 

    mongo.connect(url, function(err,db) {
        var collection = db.collection('polls1');
        collection.find({title: title}).toArray(function(err,data) {
            if (err) {
                console.log(err);
                return res.redirect('/err?errorCode=' + err);
            }

            else {
                if (data.length !== 0) {
                    console.log('sorry, a poll with this title already exists.');
                    return res.redirect('/error?errorCode=' + errorCodes[3])
                }

                else {
                    collection.insert({
                        creator: username,
                        title: title,
                        options: options,
                        votedIP: [],
                        votedUser: []
                    }, function(err,data) {
                        if (err) {
                            console.log(err);
                            return res.redirect('/err?errorCode=' + err);
                        }

                        else {
                        	console.log(data);
                            return res.redirect('/poll/' + data.ops[0]["_id"]);
                        }
                    });
                }
            }
        });
    });
});

//load polls created by individual user
app.get('/mypolls', function(req,res) {
	mongo.connect(url, function(err,db) {
		if (err) {
			console.log(err);
			return res.redirect('/err?errorCode=' + err);
		}

		else {
			var collection = db.collection('polls1');
			collection.find({creator: username}).toArray(function(err,data) {
				if (err) {
					console.log(err);
					return res.redirect('/err?errorCode=' + err);
				}

				else {
					res.render('pages/mypolls', {
						email: username,
						data: data
					});
				}
			});
		}
	});
});

//front end makes calls to this url to get data to populate graph
app.get('/ajax/:poll', function(req,res) {
	var poll = req.params.poll;
	mongo.connect(url, function(err,db) {
		var collection = db.collection('polls1');
		collection.find({_id: new ObjectID(poll)}).toArray(function(err,data) {
			if (err) {
				console.log(err);
				return res.redirect('/err?errorCode=' + err);
			}
	/////////////////////may be some issue w this else brick of code. do some error checking//////////////////////////////////////////////
			else {
				var createdBy = data[0].creator == username ? true : false;
				var title = data[0].title;
				var keys = Object.keys(data[0].options);
            	const values = Object.keys(data[0].options).map(key => data[0].options[key]);
				return res.send({keys: keys, values: values, title: title, createdBy: createdBy});
			}
		})
	});
});

//land here when user creates poll or clicks poll to view
app.get('/poll/:poll', function(req,res) {
    var poll = req.params.poll;
    var link = 'http://localhost:9229/poll/' + poll;
    return res.render('pages/poll', {email: username, loggedIn: loggedIn, poll: poll, link: link});
});

//land here when user casts a new vote on a poll
app.post('/poll/:poll', function(req, res) {
		var poll = req.params.poll;
		//see if user entered a customer option
		var custom = req.body.custom.replace(/\s/g, "").length > 0 ? req.body.custom : undefined;
 		var option = custom == undefined ? req.body.option : custom;
		mongo.connect(url, function(err, db) {
			if (err) {
				console.log(err);
				return res.redirect('/err?errorCode=' + err);
			}
			
			else {
				var collection = db.collection('polls1');
				collection.find({_id: new ObjectID(poll)}, {votedUser: 1, votedIP: 1}).toArray(function(err,data) {
					if (err) {
						console.log(err);
						return res.redirect('/err?errorCode=' + err);
					}

					else {
						//search returned array for username or ip address
						if (loggedIn) {
							var new1 = true;
							for (var i = 0; i < data[0].votedUser.length; i++) {
								if (data[0].votedUser[i] == username) {
									console.log('you have already voted in this poll.');
									new1 = false;
								}
							}

							if (new1) {
								collection.update({_id: new ObjectID(poll)}, 
									{ $inc: { ['options.' + option]: 1}, $push: { votedUser: username} });
								return res.redirect('/poll/' + poll);
							}

							else {
								return res.redirect('/error?errorCode=' + errorCodes[4]);
							}
							
						}

						else {
							var new1 = true;
							for (var j = 0; j < data[0].votedIP.length; j++) {
								if (data[0].votedIP[j] == req.ip) {
									console.log('you have already voted in this poll.');
									new1 = false;
								}
							}

							if (new1) {
								collection.update({_id: new ObjectID(poll)}, 
									{ $inc: { ['options.' + option]: 1}, $push: { votedIP: req.ip} });
								return res.redirect('/poll/' + poll);
							}	

							else {
								return res.redirect('/error?errorCode=' + errorCodes[4]);
							}
							
						}
					}
				});
			}
		});		
});

app.post('/delete/:poll', function(req,res) {
	var poll = req.params.poll;
	mongo.connect(url, function(err, db) {
		if (err) {
			console.log(err);
			return res.redirect('/err?errorCode=' + err);
		}
		
		else {
			var collection = db.collection('polls1');
			collection.deleteOne({_id: new ObjectID(poll)}, function(err,data) {
				if (err) {
					console.log(err);
					return res.redirect('/err?errorCode=' + err);
				}
				
				else {
					//data got deleted
					return res.redirect('/');
				}
			});
		}
	});
});

app.get('/error', function(req,res) {
	var error = req.query.errorCode;
	return res.render('pages/error', {loggedIn: loggedIn, email: username, error: error});
});

//catch people going to routes that dont exist
app.get('*', function(req,res) {
	var error = 'The page you are looking for does not exist.';
	return res.render('pages/error', {loggedIn: loggedIn, email: username, error: error});
});


app.listen(port, function(req,res) {
	console.log('go on ' + port);
});

