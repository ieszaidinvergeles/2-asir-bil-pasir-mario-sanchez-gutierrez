import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errores');
const duracionPeticion = new Trend('duracion_peticion', true);

export const options = {
  stages: [
    { duration: '30s', target: 5  },  // Rampa de subida: 0 → 5 usuarios
    { duration: '1m',  target: 20 },  // Carga sostenida: 20 usuarios
    { duration: '30s', target: 50 },  // Pico de carga: 50 usuarios
    { duration: '1m',  target: 50 },  // Carga máxima sostenida
    { duration: '30s', target: 0  },  // Rampa de bajada
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // El 95% de peticiones < 2s
    errores:           ['rate<0.05'],  // Menos del 5% de errores
  },
};

const BASE_URL = 'https://tfg-plataforma.test';

// Payload de ejemplo para el formulario de leads
const LEAD_PAYLOAD = JSON.stringify({
  nombre:  'Usuario Test',
  email:   'test@ejemplo.com',
  empresa: 'Empresa Test SL',
});

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept':       'application/json',
};

export default function () {
  // 1. Carga del frontend
  const resHome = http.get(`${BASE_URL}/`, { tags: { name: 'frontend' } });
  check(resHome, { 'frontend OK (200)': (r) => r.status === 200 });
  errorRate.add(resHome.status !== 200);
  duracionPeticion.add(resHome.timings.duration, { endpoint: 'frontend' });

  sleep(0.5);

  // 2. Envío de un lead al backend
  const resApi = http.post(`${BASE_URL}/api/leads`, LEAD_PAYLOAD, {
    headers: { ...HEADERS },
    tags: { name: 'api-leads' },
  });
  check(resApi, {
    'api /leads OK (201)':      (r) => r.status === 201,
    'respuesta tiene message':  (r) => JSON.parse(r.body || '{}').message !== undefined,
  });
  errorRate.add(resApi.status >= 400);
  duracionPeticion.add(resApi.timings.duration, { endpoint: 'api-leads' });

  sleep(1);
}
