const rx = require('rx');
const axios = require('axios');

const React = require('react');
const ReactDOM = require('react-dom');

const io = require('socket.io-client')();

const log = require('./logger');

const token$ = rx.Observable.fromPromise(axios.get('/user'))
    .map(response => response.data.token);

const get$ = path => token$.flatMap(token => rx.Observable.fromPromise(axios.get(`https://api.fitbit.com${path}`, {headers: {Authorization: 'Bearer ' + token}})));

const profile$ = get$('/1/user/-/profile.json')
    .map(response => response.data.user);

const today = new Date().toISOString().substr(0, 10);

const weightData$ = get$(`/1/user/-/body/log/weight/date/${today}.json`)
    .map(response => response.data.weight[0]);

profile$.subscribe(profile => {
    io.emit('activate', {user: profile.encodedId});
});

const measurements$ = new rx.Subject();

io.on('measurements', msg => {
    measurements$.onNext(msg);
});

const InputView = require('./InputView')(profile$, weightData$);
const MeasurementView = require('./MeasurementView')(measurements$);

ReactDOM.render(<InputView />, document.getElementById('inputView'));
ReactDOM.render(<MeasurementView />, document.getElementById('measurementView'));
