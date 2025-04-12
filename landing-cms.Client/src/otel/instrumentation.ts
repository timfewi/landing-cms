// instrumentation.ts

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { environment

 } from '../env/environment';
function parseOtlpHeaders(headerString: string): Record<string, string> {
  return headerString.split(',')
    .map(pair => pair.trim())
    .reduce((headers, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        headers[key.trim()] = value.trim();
      }
      return headers;
    }, {} as Record<string, string>);
}

export function initOpenTelemetry(): void {
  const otlpEndpoint = `${environment.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`;
  const additionalHeaders = environment.OTEL_EXPORTER_OTLP_HEADERS
    ? parseOtlpHeaders(environment.OTEL_EXPORTER_OTLP_HEADERS)
    : {};

  const exporterHeaders = {
    'Content-Type': 'application/x-protobuf',
    ...additionalHeaders
  };

  const exporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: exporterHeaders
  });

  const provider = new WebTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager()
  });

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation()
    ]
  });
}
