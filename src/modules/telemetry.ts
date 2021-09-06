import { client } from '../main.js';

export function initTelemetry(): void {
  client.on('rateLimit', data => {
    console.warn(
      [
        'Client Rate Limit:',
        `${data.method} ${data.path}`,
        `Limit: ${data.limit}`,
        `Global: ${data.global}`,
        `Timeout: ${data.timeout}`,
      ].join('\n'),
    );

    client.on('warn', message => {
      console.warn(['Client Warning:', message].join('\n'));
    });

    client.on('error', error => {
      console.error(['Client Error:', `${error.name}: ${error.message}`].join('\n'));
    });
  });
}

export function logError(name: string, title: string, error: unknown): void {
  console.error(error);
}

export function logMessage(name: string, message: string): void {
  console.log(message);
}
