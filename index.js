import express from 'express';
import mysql from 'mysql';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs'
import YAML from 'yaml'

const __dirname = path.resolve();

const file = fs.readFileSync('./config.yml', 'utf8')
const config = YAML.parse(file);

const app = express();
app.use(express.json());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/scripts/pindex.js', (req, res) => {
  res.sendFile('./scripts/pindex.js', {root: __dirname});
});

let clients = [];
let updates = [];

const list = [{
	name: '2017/2022 initial',
	colors: ['#FFFFFF', '#E4E4E4', '#888888', '#222222', '#FFA7D1', '#E50000', '#E59500', '#A06A42', '#E5D900', '#94E044', '#02BE01', '#00D3DD', '#0083C7', '#0000EA', '#CF6EE4', '#820080']
}, {
	name: '2022 day 2',
	colors: ['#BE0039', '#FF4500', '#FFA800', '#FFD635', '#00A368', '#00CC78', '#7EED56', '#00756F', '#009EAA', '#2450A4', '#3690EA', '#51E9F4', '#493AC1', '#6A5CFF', '#811E9F', '#B44AC0', '#FF3881', '#FF99AA', '#6D482F', '#9C6926', '#000000', '#898D90', '#D4D7D9', '#FFFFFF']
}, {
	name: '2022 day 3',
	colors: ['#6D001A', '#BE0039', '#FF4500', '#FFA800', '#FFD635', '#FFF8B8', '#00A368', '#00CC78', '#7EED56', '#00756F', '#009EAA', '#00CCC0', '#2450A4', '#3690EA', '#51E9F4', '#493AC1', '#6A5CFF', '#94B3FF', '#811E9F', '#B44AC0', '#E4ABFF', '#DE107F', '#FF3881', '#FF99AA', '#6D482F', '#9C6926', '#FFB470', '#000000', '#515252', '#898D90', '#D4D7D9', '#FFFFFF']
}, {
	name: '2023 Greyout',
	colors: ['#000000', '#515252', '#898D90', '#D4D7D9', '#FFFFFF']
}, {
	name: '2022/2023 Whiteout',
	colors: ['#FFFFFF']
}];

function rgbToHex(r, g, b) {
	const hex = ((r << 16) | (g << 8) | b).toString(16).toUpperCase();
	return '#' + hex.padStart(6, '0');
}

app.get('/place', (req, res) => {
	res.sendFile('./public/place/index.html', {root: __dirname});
});

app.get('/place/config', (req, res) => {
  res.send(config);
});

app.get('/place/palette', (req, res) => {
	res.send(list[config.colorPalette]);
});

app.get('/place/events', (req, res) => {
	const headers = {
		'Content-Type': 'text/event-stream',
		'Connection': 'keep-alive',
		'Cache-Control': 'no-cache'
	};
	res.writeHead(200, headers);

	const clientId = Date.now();

	const newClient = {
		id: clientId,
		res
	};

	clients.push(newClient);

	res.write(`data: ${JSON.stringify(updates)}\n\n`);

	res.on('close', () => {
		clients = clients.filter(client => client.id !== clientId);
	});
});

function sendEventsToAll(newPixel) {
	clients.forEach(client => client.res.write(`data: ${JSON.stringify(newPixel)}\n\n`));
}

let timers = {};

const limiter = rateLimit({
	windowMs: (config.timer - 1) * 1000,
	max: 10, // limit each IP to 10 requests per windowMs
	message: 'Too many requests from this IP, please try again later'
});
app.patch('/place/draw', (req, res) => {
	let clientIP = req.socket.remoteAddress;
	if (timers[clientIP]) {
		// Check if timer is still running
		if (timers[clientIP] > Date.now()) {
			res.status(401).send('Timer is still ongoing');
			return;
		} else {
			// If timer has expired, delete the timer entry
			delete timers[clientIP];
		}
	}

	if (!list[config.colorPalette].colors.includes(rgbToHex(req.body.r, req.body.g, req.body.b))) {
		res.status(403).send('Invalid color');
		return;
	}

  if (req.body.x < 0 || req.body.x >= canvasWidth || req.body.y < 0 || req.body.y >= canvasHeight) {
    res.status(404).send('Coordinates are outside canvas boundaries');
    return;
  }

	const con = mysql.createConnection({
		host: config.mysql.host,
		user: config.mysql.user,
		password: config.mysql.password,
		database: config.mysql.database,
    port: config.mysql.port
	});

	const sql = `UPDATE place SET r = ${req.body.r}, g = ${req.body.g}, b = ${req.body.b} WHERE x = ${req.body.x} AND y = ${req.body.y};`;

	con.query(sql, (err, result) => {
		if (err) {
			res.status(500).send(err);
			return;
		}
		updates.push(req.body);
		sendEventsToAll(req.body);
		res.status(204);
		con.end();
	});

	// Store the end time of the client-side timer
	timers[clientIP] = Date.now() + (config.timer * 1000); // End time in milliseconds
});
app.use('/place/draw', limiter);
app.get('/place/timer', (req, res) => {
	const clientIP = req.socket.remoteAddress;
	const endTime = timers[clientIP];

	if (endTime && endTime > Date.now()) {
		const remainingTime = Math.floor((endTime - Date.now()) / 1000); // Calculate remaining time
		res.send({ time: remainingTime, serverTimerRunning: true });
	} else {
		res.send({ time: 0, serverTimerRunning: false });
	}
});



app.get('/place/data', (req, res) => {
	const con = mysql.createConnection({
		host: config.mysql.host,
		user: config.mysql.user,
		password: config.mysql.password,
		database: config.mysql.database,
    port: config.mysql.port
	});

	const sql = 'SELECT * FROM place;';

	con.query(sql, (err, result) => {
		if (err) {
			res.status(500).send('Error retrieving data from database');
		} else {
			res.send(result);
		}
		con.end();
	});
});

// Handle 404
app.use(function(req, res) {
	res.status(404).sendFile('./public/404/index.html', {root: __dirname});
});

app.listen(8080, () => {
	console.log('Server is running on port 8080');
});