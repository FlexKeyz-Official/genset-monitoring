const http = require('http');

const PORT = process.env.PORT || 5000;

const sampleData = {
  time: new Date().toISOString(),
  message: 'SYSTEM NORMAL (mock)',
  fault_latched: false,
  trip_cause: null,
  voltage: 230.1,
  current: 12.34,
  frequency: 50.0,
  power_factor: 0.98,
  output_power: 2800,
  voltage_a: 230.3,
  current_a: 4.11,
  voltage_b: 229.9,
  current_b: 4.12,
  voltage_c: 230.0,
  current_c: 4.11,
  temperature: 45.5,
  vibration: 0.012,
  tilt: 0.0,
  oil_level: 74.2,
  wifi_ok: true,
  sd_ok: true,
  sd_log_records: 1234,
};

function sendJSON(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(s),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(s);
}

const server = http.createServer((req, res) => {
  const { method, url } = req;
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (url === '/ping' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    });
    return res.end('OK');
  }

  if (url === '/data' && method === 'GET') {
    sampleData.time = new Date().toISOString();
    return sendJSON(res, 200, sampleData);
  }

  // simple handler for POST endpoints used by the UI
  if (method === 'POST') {
    if (url.startsWith('/')) {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end('OK (mock)');
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Mock ESP32 server listening on http://localhost:${PORT}`);
});
