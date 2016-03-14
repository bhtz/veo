import passport from 'passport';
import {Strategy} from 'passport-local';
import FacebookStrategy from 'passport-facebook';
import session from 'express-session';
import flash from 'connect-flash';
import User from '../models/User';

// Use local strategy
passport.use(new Strategy(
    function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
            if (err) { return done(err); }

            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            return user.comparePassword(password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            });
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: '1017990444940154',
    clientSecret: '5342ad97580ddbe01eefb992fc1c69e8',
    callbackURL: "https://veo-app.herokuapp.com/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'email']
},
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOne({ 'facebookId': profile.id }, function(err, user) {
            if (err) {
                return cb(err, null);
            }

            if (user) {
                return cb(null, user);
            }
            else {

                let newUser = new User({
                    username: profile.displayName,
                    facebookId: profile.id,
                    password: 'facebook',
                    email: profile.displayName + '@facebook.com',
                    provider: 'facebook'
                });

                newUser.save(function(err) {
                    if (err){ throw err; }
                    return cb(null, newUser);
                });
            }
        });
    }
));

// serialize user
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// deserialize user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// register middlewares 
export function authentication(app) {
    app.use(session({ secret: 'microscopejs', resave: false, saveUninitialized: false }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        res.locals.flash = req.flash('info');
        next();
    });
}