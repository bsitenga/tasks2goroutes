const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose');
const app = express();
let Preferences = require('./models/preferences');
let Summary = require('./models/summary');

require('dotenv').config();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false }
);
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
})

//ALL API ENDPOINTS BELOW 
//test endpoint for heroku
app.get('/', function (req, res) {
    res.send("Hello Heroku");
})

//Get all summary data
app.get('/summary', function (req, res) {
    Summary.find()
        .then(summaries => res.json(summaries))
        .catch(err => res.status(400).json("Error: " + err))
})

//Adds one user's preferences to the db
app.post('/preferences', function (req, res) {
    const more = req.body.more;
    const less = req.body.less;
    const known = req.body.known;
    const unknown = req.body.unknown;
    const action = req.body.action;
    const inaction = req.body.inaction;
    const pedestrians = req.body.pedestrians;
    const passengers = req.body.passengers;
    const newPreferences = new Preferences({
        more,
        less,
        action,
        inaction,
        known,
        unknown,
        pedestrians,
        passengers
    })

    newPreferences.save()
        .then(() => res.json('Preferences added!'))
        .catch(err => res.status(400).json('Error: ' + err));
})

//Updates the average of user preferences
app.post('/summary', function (req, res) {
    const more = req.body.more;
    const less = req.body.less;
    const known = req.body.known;
    const unknown = req.body.unknown;
    const action = req.body.action;
    const inaction = req.body.inaction;
    const pedestrians = req.body.pedestrians;
    const passengers = req.body.passengers;

    //Finds the current Summary averages
    const query = Summary.where({ name: 'summary' });
    query.findOne(function (err, allPrefs) {
        if (err) return handleError(err);
        if (allPrefs) {
            //Recalculates user preference averages
            let pTotal = allPrefs.total + 1;
            let pMore = (Number(allPrefs.more) * Number(allPrefs.total) + Number(more)) / pTotal;
            let pLess = (Number(allPrefs.less) * Number(allPrefs.total) + Number(less)) / pTotal;
            let pAction = (Number(allPrefs.action) * Number(allPrefs.total) + Number(action)) / pTotal;
            let pInaction = (Number(allPrefs.inaction) * Number(allPrefs.total) + Number(inaction)) / pTotal;
            let pKnown = (Number(allPrefs.known) * Number(allPrefs.total) + Number(known)) / pTotal;
            let pUnknown = (Number(allPrefs.unknown) * Number(allPrefs.total) + Number(unknown)) / pTotal;
            let pPedestrians = (Number(allPrefs.pedestrians) * Number(allPrefs.total) + Number(pedestrians)) / pTotal;
            let pPassengers = (Number(allPrefs.passengers) * Number(allPrefs.total) + Number(passengers)) / pTotal;

            //Updates the current summary averages
            Summary.findOneAndUpdate({ name: "summary" }, {
                total: pTotal,
                more: pMore,
                less: pLess,
                action: pAction,
                inaction: pInaction,
                known: pKnown,
                unknown: pUnknown,
                pedestrians: pPedestrians,
                passengers: pPassengers
            }, function () {
                return res.json('Summary updated!')
            })
        }
    });
})

// Catchall for any request that doesn't
// match one above: sends back error message
app.get('*', (req, res) => {
    res.send("CATCHALL ERROR: UNKNOWN ROUTE");
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Ethics Engine listening on ${port}`);