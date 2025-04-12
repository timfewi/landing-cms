// environment.ts
export const environment = {
  production: false,
  SERVER_URL: 'https://localhost:5000',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'https://localhost:21231',
  OTEL_EXPORTER_OTLP_HEADERS: 'x-otlp-api-key=9deaf402b72bdc213d07efa5d247c223',
  OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf'
};
