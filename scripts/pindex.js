let canvasData = [];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pixelSize = 10;
let canvasWidth;
let canvasHeight;
let timerSeconds;
fetch('/place/config')
  .then(response => response.json())
  .then(data => {
    canvasWidth = data.canvas.width;
    canvasHeight = data.canvas.height;
    timerSeconds = data.timer;
  });

canvas.width = pixelSize * canvasWidth;
canvas.height = pixelSize * canvasHeight;


fetch('/place/data')
	.then(response => response.json())
	.then(data => {
		canvasData.push(data);
		drawCanvas(canvasData);
	})
	.catch(error => {
		console.error('Error fetching canvas data:', error);
	});

// Create an EventSource connection to the server
const eventSource = new EventSource('/place/events');
// Handle incoming messages from the server
eventSource.onmessage = (event) => {
	const parsedData = JSON.parse(event.data);
	drawPixel(parsedData.x, parsedData.y, parsedData.r, parsedData.g, parsedData.b, true);
};

// Handle connection errors
eventSource.onerror = (error) => {
	console.error('Error with EventSource connection:', error);
};

// Optional: Handle connection closure
eventSource.onclose = () => {
	console.log('EventSource connection closed');
};

function drawPixel(x, y, r, g, b, isLocal) {
	isLocal = isLocal || false;
	if (x < 0 || y < 0 || x >= canvasWidth || y >= canvasHeight) return;
  if (isLocal) {
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    console.log(x, y, r, g, b);
    return;
  }
  const bodie = JSON.stringify({ x, y, r, g, b });
  fetch('/place/draw', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: bodie
  }).then(response => {
    if (response.ok) {
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      console.log('Pixel drawn successfully');
    } else if (response.status === 403) {
      alert('Invalid color; reloading page to fetch new palette');
      location.reload();
    } else if (response.status === 401 || response.status === 429) {
      alert('If timer shown here is 0 seconds (most likely server and client timer mismatch), please wait for a few seconds before drawing again.');
      return;
    } else {
      return response.json().then(data => {
        throw new Error(data.error);
      });
    }
  })
    .catch(error => {
      console.error('Error drawing pixel:', error.message);
    });
  return;
}

function drawCanvas(canv) {
  if (!canv) return;

  const visibleCanvasHeight = Math.min(canvasHeight, canvasData[0].length);
  for (let i = 0; i < canv[0].length; i++) {
    const { x, y, r, g, b } = canv[0][i];
    // Only draw within the visible portion of the canvas
    if (y < visibleCanvasHeight) {
      drawPixel(x, y, r, g, b, true);
    }
  }
}

// Call drawCanvas with the canvasData array
drawCanvas(canvasData);


let selectedColor = '#FFFFFF';
function setPaletteColors() {
	const paletteColors = [];
	fetch('/place/palette', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		}
	}).then(response => response.json())
		.then(data => {
			paletteColors.push(data);
		}).catch(error => {
			console.error('Error fetching canvas data:', error);
		});
	setTimeout(() => {
		const paletteContainer = document.createElement('div');
		paletteContainer.style.display = 'flex';
		document.body.appendChild(paletteContainer);

		const numColors = paletteColors[0].colors.length;
		const buttonSize = numColors === 32 ? '40px' : `${Math.floor(1280 / numColors)}px`;

		for (const color of paletteColors[0].colors) {
			const colorButton = document.createElement('button');
			colorButton.style.backgroundColor = color;
			colorButton.style.width = buttonSize;
			colorButton.style.height = '40px';
			colorButton.title = hexToName(color); // Set tooltip as the name of the color
			colorButton.addEventListener('click', () => {
				selectedColor = color;
				document.getElementById('current').innerText = `Selected color: ${hexToName(selectedColor)}`;
			});

			paletteContainer.appendChild(colorButton);
		}
	}, 1000);
}

function hexToName(hex) {
	const colors = {
		'#FFFFFF': 'White',
		'#E4E4E4': 'Light Gray',
		'#888888': 'Gray',
		'#222222': 'Dark Gray',
		'#FFA7D1': 'Pink',
		'#E50000': 'Red',
		'#E59500': 'Orange',
		'#A06A42': 'Brown',
		'#E5D900': 'Yellow',
		'#94E044': 'Light Green',
		'#02BE01': 'Green',
		'#00D3DD': 'Light Blue',
		'#0083C7': 'Blue',
		'#0000EA': 'Dark Blue',
		'#CF6EE4': 'Purple',
		'#820080': 'Dark Purple',
		'#6D001A': 'Maroon',
		'#BE0039': 'Crimson',
		'#FF4500': 'Orange Red',
		'#FFA800': 'Amber',
		'#FFD635': 'Golden Yellow',
		'#FFF8B8': 'Light Yellow',
		'#00A368': 'Green Cyan',
		'#00CC78': 'Spring Green',
		'#7EED56': 'Pastel Green',
		'#00756F': 'Deep Aquamarine',
		'#009EAA': 'Strong Cyan',
		'#00CCC0': 'Turquoise',
		'#2450A4': 'Indigo',
		'#3690EA': 'Soft Blue',
		'#51E9F4': 'Ice Blue',
		'#493AC1': 'Light Purple',
		'#6A5CFF': 'Soft Purple',
		'#94B3FF': 'Powder Blue',
		'#811E9F': 'Dark Magenta',
		'#B44AC0': 'Lavender',
		'#E4ABFF': 'Pink Lavender',
		'#DE107F': 'Cerise Pink',
		'#FF3881': 'Strong Pink',
		'#FF99AA': 'Peach Pink',
		'#6D482F': 'Cinnamon',
		'#9C6926': 'Sandy Brown',
		'#FFB470': 'Light Salmon',
		'#000000': 'Black',
		'#515252': 'Charcoal Gray',
		'#898D90': 'Silver',
		'#D4D7D9': 'Light Silver',
	};

	return colors[hex];
}

function hexToRgb(hex) {
	const bigint = parseInt(hex.slice(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return [r, g, b];
}
setPaletteColors();

// Add border around the canvas
ctx.strokeStyle = 'black';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);

let isDrawingEnabled = true;
const timerText = document.getElementById('timer');
let timer = 0;
let clientTimerRunning = false; // Flag to track if client-side timer is running

// Function to start the countdown timer
function startTimer() {
	const countdown = setInterval(() => {
		isDrawingEnabled = false;
		timer--;
		timerText.innerText = `Drawing disabled (${timer} seconds)`;

		if (timer <= 0) {
			clearInterval(countdown);
			isDrawingEnabled = true;
			timerText.innerText = 'Drawing enabled';
			clientTimerRunning = false; // Reset client timer flag
		}
	}, 1000); // 1 second interval
}

// Function to fetch server timer and start client-side timer
async function fetchAndStartTimer() {
	try {
		const response = await fetch('/place/timer');
		const data = await response.json();
		const serverTimer = data.time;

		if (serverTimer === 0) {
			isDrawingEnabled = true;
			timerText.innerText = 'Drawing enabled';
			timer = 0; // Reset timer if server timer is not running
			if (clientTimerRunning) {
				clearInterval(clientTimerRunning); // Clear client timer if running
				clientTimerRunning = false; // Reset client timer flag
			}
		} else {
			timer = serverTimer; // Set timer with server timer value
			timerText.innerText = `Drawing disabled (${timer} seconds)`;
			if (!clientTimerRunning) {
				startTimer(); // Start countdown only if client timer is not running
				clientTimerRunning = true; // Set client timer flag
			}
		}
	} catch (error) {
		console.error('Error fetching timer:', error);
	}
}

// Fetch server timer and start client-side timer
fetchAndStartTimer();



// Function to handle the canvas click event
canvas.addEventListener('click', async (event) => {
	if (!isDrawingEnabled) return;

	const rect = canvas.getBoundingClientRect();
	const x = Math.floor((event.clientX - rect.left) / pixelSize);
	const y = Math.floor((event.clientY - rect.top) / pixelSize);
	const [r, g, b] = hexToRgb(selectedColor);
	drawPixel(x, y, r, g, b);

	isDrawingEnabled = false;
	timer = timerSeconds; // Reset timer to 60 seconds

	timerText.innerText = `Drawing disabled (${timer} seconds)`;

	try {
		const response = await fetch('/place/timer');
		const data = await response.json();
		const serverTimer = data.time;

		if (serverTimer === 0) {
			isDrawingEnabled = true;
			timerText.innerText = 'Drawing enabled';
		} else {
			timer = serverTimer; // Update timer with server timer value
			if (!clientTimerRunning) {
				startTimer();
				clientTimerRunning = true;
			}
		}
	} catch (error) {
		console.error('Error fetching timer:', error);
	}
});