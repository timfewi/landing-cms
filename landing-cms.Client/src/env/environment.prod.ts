// environment.prod.ts
export const environment = {
  production: true,
  OTEL_EXPORTER_OTLP_ENDPOINT: 'https://production-server:21231',
  OTEL_EXPORTER_OTLP_HEADERS: 'x-otlp-api-key=PROD_API_KEY',
  OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf'
};
