import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';

const scryptCost = 16_384;
const scryptBlockSize = 8;
const scryptParallelization = 1;
const keyLength = 32;
const maximumMemory = 64 * 1024 * 1024;

function scrypt(value: string, salt: Buffer, outputLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(
      value,
      salt,
      outputLength,
      {
        N: scryptCost,
        r: scryptBlockSize,
        p: scryptParallelization,
        maxmem: maximumMemory,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

export async function hashLocalPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(pin, salt, keyLength);
  return [
    'scrypt',
    scryptCost,
    scryptBlockSize,
    scryptParallelization,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyLocalPin(
  pin: string,
  encodedHash: string,
): Promise<boolean> {
  const [
    algorithm,
    costValue,
    blockSizeValue,
    parallelizationValue,
    saltValue,
    hashValue,
  ] = encodedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    Number(costValue) !== scryptCost ||
    Number(blockSizeValue) !== scryptBlockSize ||
    Number(parallelizationValue) !== scryptParallelization ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(hashValue, 'base64url');
    const actual = await scrypt(
      pin,
      Buffer.from(saltValue, 'base64url'),
      expected.length,
    );
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

export function createLocalSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashLocalSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
