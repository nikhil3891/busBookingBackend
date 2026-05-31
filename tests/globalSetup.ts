import { MongoBinary } from 'mongodb-memory-server';

/**
 * Downloads the MongoDB binary once before all test suites run.
 * This prevents race conditions when multiple suites try to download simultaneously.
 */
export default async function globalSetup(): Promise<void> {
  console.log('[globalSetup] Pre-warming MongoDB binary...');
  await MongoBinary.getPath({ version: '7.0.14', downloadDir: undefined });
  console.log('[globalSetup] MongoDB binary ready');
}
