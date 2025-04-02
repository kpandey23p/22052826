const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

// Configuration
const WINDOW_SIZE = 10;
const TIMEOUT_MS = 500; // Max 500ms response time from test server
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/evaluation-service';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNjAxMjgyLCJpYXQiOjE3NDM2MDA5ODIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc2ZGVhNTg4LTI2YzgtNDQ0YS1iZWFkLTAwYTgzN2Y4NmUzMSIsInN1YiI6InBhbmRleWt1c2hhZ3JhMzNAZ21haWwuY29tIn0sImVtYWlsIjoicGFuZGV5a3VzaGFncmEzM0BnbWFpbC5jb20iLCJuYW1lIjoia3VzaGFncmEgZHV0dCBwYW5kZXkiLCJyb2xsTm8iOiIyMjA1MjgyNiIsImFjY2Vzc0NvZGUiOiJud3B3cloiLCJjbGllbnRJRCI6Ijc2ZGVhNTg4LTI2YzgtNDQ0YS1iZWFkLTAwYTgzN2Y4NmUzMSIsImNsaWVudFNlY3JldCI6InhOTlJWdk50ZVFZa3lGVnYifQ.i3srm1rv2RAFbNeLEqaRFgC6Z6qPYOJtzZmXD1-o9ms'; 

// Store numbers in memory with a fixed window size
let numberWindow = [];

// Valid number IDs
const VALID_IDS = ['p', 'f', 'e', 'r'];
const ID_TO_ENDPOINT = {
  p: 'primes',
  f: 'fibo',
  e: 'even',
  r: 'rand'
};

// Middleware to validate number ID
const validateNumberId = (req, res, next) => {
  const numberId = req.params.numberid;
  if (!VALID_IDS.includes(numberId)) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
  }
  next();
};

// Helper function to fetch numbers from test server
async function fetchNumbers(numberId) {
  const endpoint = ID_TO_ENDPOINT[numberId];
  try {
    const response = await axios.get(`${TEST_SERVER_BASE_URL}/${endpoint}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      timeout: TIMEOUT_MS
    });
    return response.data.numbers || [];
  } catch (error) {
    console.error(`Error fetching ${numberId} numbers:`, error.message);
    return []; // Return empty array on timeout or error
  }
}

// Helper function to calculate average
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
}

// Main API endpoint
app.get('/numbers/:numberid', validateNumberId, async (req, res) => {
  const numberId = req.params.numberid;

  // Capture previous state
  const windowPrevState = [...numberWindow];

  // Fetch new numbers from test server
  const fetchedNumbers = await fetchNumbers(numberId);
  if (fetchedNumbers.length === 0) {
    return res.status(503).json({ error: 'Failed to fetch numbers from test server' });
  }

  // Add unique numbers to the window
  fetchedNumbers.forEach(num => {
    if (!numberWindow.includes(num)) {
      if (numberWindow.length >= WINDOW_SIZE) {
        numberWindow.shift(); // Remove oldest number
      }
      numberWindow.push(num);
    }
  });

  // Calculate average
  const avg = calculateAverage(numberWindow);

  // Prepare response
  const response = {
    windowPrevState,
    windowCurrState: [...numberWindow],
    numbers: fetchedNumbers,
    avg
  };

  res.json(response);
});

// Start the server
app.listen(port, () => {
  console.log(`Average Calculator Microservice running on http://localhost:${port}`);
});