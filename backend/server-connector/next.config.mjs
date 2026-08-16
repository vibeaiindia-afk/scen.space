import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this package; an unrelated lockfile in a parent
  // directory otherwise makes Next infer the wrong workspace root.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Provider SDKs are server-only; never bundle them into client output.
  serverExternalPackages: ['postgres', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
};

export default nextConfig;
