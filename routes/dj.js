var express = require('express');
var router = express.Router();
var http = require('http');

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
      return next();
  // if the user is not authenticated then redirect them to the login page
  res.redirect('/dj');
}

var updateUser = function(users, user, callback) {
  users.findOne({ 'username' :  user.username }),
    function(err, userupdate) {
      return callback(userupdate)
    }
}

// var delSet = function()

module.exports = function(passport, db){
  var users = db.collection("djs")

  /* GET login page. */
  router.get('/', function(req, res) {
      // Display the Login page with a flash message, if any
      res.render('index', { message: req.flash('message') });
  });

  router.get('/play/:username',function(req, res) {
      res.render('dj', { dj : req.user })
  })

  /* Handle Login POST */
  router.post('/signin', 
    passport.authenticate('login'), 
    function(req,res) {
    res.redirect('/dj/play/'+req.user.username)
  });

  /* GET Registration Page */
  router.get('/signup', function(req, res) {
      res.render('dj/register',{message: req.flash('message')});
  });

  /* Handle Registration POST */
  router.post('/signup', passport.authenticate('signup', {
      successRedirect: '/dj/home',
      failureRedirect: '/dj/signup',
      failureFlash : true  
  }));

  /* GET Home Page */
  router.get('/home', isAuthenticated, function(req, res) {
    res.render('dj', {dj : req.user})
  });

  /* Handle Logout */
  router.get('/signout', function(req, res) {
      req.logout();
      res.redirect('/dj');
  });

  /* Handle New Set POST */
  router.post('/set/new', isAuthenticated, function(req, res) {
    users.update(
      { _id: req.user._id },
      { $push: { playlists: { title: req.body.title, songs: [] } } }
    );
    res.redirect('/dj/home');
  });

  router.post('/set/current', isAuthenticated, function(req, res) {
    users.findOne(
      {
        _id : req.user._id,
      },
      {
        playlists : { $elemMatch : { title :  req.body.playlist } }
      },
      function(err, user) {
        if (err) {
          res.redirect('/')
        }
        else {
          users.update(
            { _id : user._id },
            { $set :
              { currentPlaylist : user.playlists[0] }
            }
          )
          res.redirect('/dj/home')
        }
      }
    )
    // res.end()
  })

  router.post('/set/refresh', isAuthenticated, function(req, res) {
    users.findOne(
      {
        _id : req.user._id,
      },
      {
        playlists : { $elemMatch : { title :  req.user.currentPlaylist.title } }
      },
      function(err, user) {
        if (err) {
          console.log(err)
        }
        else {
          users.update(
            { _id : user._id },
            { $set :
              { currentPlaylist : user.playlists[0] }
            }
          )
        }
      }
    )
    res.end()
  })

  router.post('/set/delete', isAuthenticated, function(req, res) {
    users.update(
      {
        _id: req.user._id
      },
      { 
        $pull : {
          playlists : { title : req.body.playlist } 
        }
      },
      function(err) {
        if (err) {
          console.log(err)
        }
      }
    )
    res.redirect('/dj/home')
  })

  //   /* Handle Delete POST */
  // router.post('/delete', isAuthenticated, function(req, res) {
  //   function(req) {deactivateUser = function(){
  //         console.log("deactivate user")
  //         // find a user in Mongo with provided username
  //         User.findOne({ 'username' :  req.user.username }, function(err, user) {
  //             // In case of any error, return using the done method
  //             if (err){
  //                 console.log('Error in Deactivation: '+err);
  //                 res.redirect('/dj/home')
  //             }
  //             // User does not exist
  //             if (user == null) {
  //                 console.log('User does not exist with the username '+username);
  //                 res.redirect('/dj/home')
  //             } else {
  //                 // if there is a user with that username
  //                 // set isActive to false
  //                 // if needed, admins can fully delete accounts
  //                 user.isActive = false;
  //                 console.log("user.isActive = " + user.isActive)

  //                 // save the user
  //                 user.save(function(err) {
  //                     if (err){
  //                         console.log('Error in Saving user: '+err);  
  //                         throw err;  
  //                     }
  //                     console.log('User '+username+' is now deactivated');    
  //                     res.redirect('/')
  //                 })
  //             }
  //         })
  //     }
  //     // Delay the execution of deactivateUser and execute the method
  //     // in the next tick of the event loop
  //     process.nextTick(deactivateUser);
  //   }
  // })

  router.get('/player/:id',function(req,res,next){
    res.render('player', { title: 'Playing'});
  });

  router.get('/playlist/:id',function(req,res,next){
    res.render('djplaylist', { title: 'Playlist'});
  });

  return router;
}