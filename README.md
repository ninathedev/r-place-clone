# place
r/place clone

## config
most of it is pretty self-explanatory. 

but how about the mysql part?

to make a mysql database that is compatible with this project, make a new table.

here is for a 70x70 canvas (table name HAS to be `place`):

```sql
INSERT INTO place (x, y, r, g, b)
SELECT 
    (t3.x) AS x,
    (t3.y) AS y,
    255 AS r,
    255 AS g,
    255 AS b
FROM
    (SELECT
        t1.x,
        t2.y
    FROM
        (SELECT 0 AS x UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50 UNION ALL SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL SELECT 55 UNION ALL SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL SELECT 60 UNION ALL SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL SELECT 64 UNION ALL SELECT 65 UNION ALL SELECT 66 UNION ALL SELECT 67 UNION ALL SELECT 68 UNION ALL SELECT 69) AS t1
    CROSS JOIN
        (SELECT 0 AS y UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50 UNION ALL SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL SELECT 55 UNION ALL SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL SELECT 60 UNION ALL SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL SELECT 64 UNION ALL SELECT 65 UNION ALL SELECT 66 UNION ALL SELECT 67 UNION ALL SELECT 68 UNION ALL SELECT 69) AS t2) AS t3
LIMIT 4900;
```
you can ask chatgpt to change it to your needs.

NOTE: you do not need to update the database for canvas expansions. for example, your final canvas will be 70x70, but you want to start at 35x35. make a table for 70x70 and make the canvas size 35x35. then make canvas expansions over time by changing the canvas size in config.yml and restarting the server.

## how to use
clone this repo and set up node.js. then install all dependencies by:

```sh
# you need to install pnpm.
# install it using `npm i -g pnpm`
pnpm i
```

then run the server:

```sh
node .
```

## API!
so you are a developer? here's the endpoints for your custom client:

### GET requests
#### /place
returns index.html of place
#### /place/data
returns (not sure if array in array or array in JSON. check your console logs):

```js
[
  [x, y, r, g, b],
  [x, y, r, g, b],
  ...
]
```


#### /place/config
returns config:

```json
{
  "canvas": { "width": 35, "height": 35 },
  "timer": 60,
  "colorPalette": 0,
  "mysql": {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "pixelcanvas"
  }
}
```

#### /place/palette
returns current palette (not sure if array in array or array in JSON. check your console logs):

```js
['hex', 'hex', 'hex', ...]
```

#### /place/events
used for real time updates.
returns 2D array of x, y, r, g, b where last array is the latest.

#### /place/timer
returns current state of timer of your IP.
```js
if (endTime && endTime > Date.now()) {
		res.send({ time: remainingTime, serverTimerRunning: true });
	} else {
		res.send({ time: 0, serverTimerRunning: false });
	}
```

### PATCH request
#### /place/draw
gets `{x, y, r, g, b}`. all respone codes:

| Response Code | Description |
| ------------- | ----------- |
| 204           | Drawn succcessfully          |
| 401           | Timer is still on going|
| 403           | Wrong color   |
| 404           | Coordinates are outside canvas boundaries   |
| 500           | Server Error|

NOTE: this endpoint has a rate limit.

```json
{
	"windowMs": (config.timer - 1) * 1000,
	"max": 10, // limit each IP to 10 requests per windowMs
	"message": 'Too many requests from this IP, please try again later'
}
```