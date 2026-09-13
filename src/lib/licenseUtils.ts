import { AppLicense } from '../types';

export const FREE_LIMITS = {
  maxTransactions: 15,
  maxAccounts: 2,
  maxGoals: 2,
  maxRecurringBills: 3,
};

// Official PIX Payment Configuration for Full License
export const PIX_CONFIG = {
  pixKey: 'b801a0d5-b949-4c8e-ad5d-b544afa5ab8b',
  keyType: 'Chave Aleatória (EVP)',
  receiverName: 'SIGMAR WERMUTH',
  city: 'BRASIL',
  price: 39.90,
  originalPrice: 39.90,
  discountPercentage: 0,
  txDescription: 'FINANCIAS PRO FULL VITALICIO',
  supportEmail: 'sigmarwermuth@gmail.com',
  supportWhatsApp: '5549998043552',
  supportWhatsAppFormatted: '(49) 99804-3552',
};

/**
 * Calculates standard CCITT CRC16 for Pix BR Code
 */
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  const hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generates an EMV compliant Pix Copia e Cola payload
 */
export function generatePixCopiaECola(
  price: number = PIX_CONFIG.price, 
  txId: string = 'FINPROFULL'
): string {
  const merchantAccount = 
    formatEmvField('00', 'br.gov.bcb.pix') +
    formatEmvField('01', PIX_CONFIG.pixKey) +
    formatEmvField('02', PIX_CONFIG.txDescription);

  const rawPayload = 
    formatEmvField('00', '01') +
    formatEmvField('26', merchantAccount) +
    formatEmvField('52', '0000') +
    formatEmvField('53', '986') +
    formatEmvField('54', price.toFixed(2)) +
    formatEmvField('58', 'BR') +
    formatEmvField('59', PIX_CONFIG.receiverName) +
    formatEmvField('60', PIX_CONFIG.city) +
    formatEmvField('62', formatEmvField('05', txId)) +
    '6304';

  const checksum = crc16(rawPayload);
  return `${rawPayload}${checksum}`;
}

/**
 * Gets or creates a persistent unique Machine/Device ID for this browser/device instance.
 */
export function getOrCreateDeviceId(): string {
  const DEVICE_KEY = 'financas_pro_device_id';
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    deviceId = `FP-${randomHex}-${randomHex2}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Default initial free license state
 */
export function getInitialLicense(): AppLicense {
  const deviceId = getOrCreateDeviceId();
  return {
    isRegistered: false,
    plan: 'free',
    licenseKey: '',
    registeredTo: '',
    registeredAt: null,
    deviceId,
    type: 'lifetime',
    expiresAt: null,
  };
}

/**
 * Helper hashing function to generate non-reversible hash blocks.
 */
function hashString(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 0x5bd1e995);
    h ^= h >>> 13;
  }
  return (h >>> 0);
}

/**
 * Generates the unique, deterministic license key tied exclusively to a given Device ID.
 * Formula: FINPRO-[BLOCK1]-[BLOCK2]-[BLOCK3]
 */
export function generateKeyForDeviceId(deviceId: string): string {
  const cleanId = (deviceId || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleanId) return '';

  const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 chars (omits 0, O, 1, I, L)
  const SALT = 'FINPRO_DEVICE_LICENSE_SALT_2026_V1';

  const h1 = hashString(`${cleanId}:${SALT}:B1`, 0x12345678);
  const h2 = hashString(`${cleanId}:${SALT}:B2`, 0x87654321);
  const h3 = hashString(`${cleanId}:${SALT}:B3`, 0xDEADBEEF);

  const genBlock = (hashVal: number) => {
    let block = '';
    let curr = hashVal;
    for (let i = 0; i < 4; i++) {
      const idx = (curr >>> (i * 5)) % ALPHABET.length;
      block += ALPHABET[idx];
      curr = Math.imul(curr ^ (i + 1), 0x45d9f3b) >>> 0;
    }
    return block;
  };

  return `FINPRO-${genBlock(h1)}-${genBlock(h2)}-${genBlock(h3)}`;
}

/**
 * Validates a license key strictly against the user's Device ID.
 * Generic formatted keys or master keys are NOT accepted unless derived from this exact device.
 */
export function validateLicenseKey(
  rawKey: string,
  deviceId: string
): { isValid: boolean; message: string; type?: 'lifetime' | 'annual' } {
  const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');

  if (!cleanKey) {
    return { isValid: false, message: 'Digite o código de ativação.' };
  }

  if (!deviceId) {
    return { isValid: false, message: 'ID do dispositivo não identificado.' };
  }

  const expectedKey = generateKeyForDeviceId(deviceId);

  if (cleanKey === expectedKey) {
    return {
      isValid: true,
      message: 'Licença vinculada a este dispositivo validada com sucesso!',
      type: 'lifetime',
    };
  }

  return {
    isValid: false,
    message: `Chave inválida para este aparelho (${deviceId}). Chaves de outros dispositivos ou códigos genéricos não são aceitos.`,
  };
}

/**
 * Masks a license key for safe display (e.g. FINPRO-••••-••••-8899)
 */
export function maskLicenseKey(key: string): string {
  if (!key || key.length < 8) return '••••••••••••';
  const parts = key.split('-');
  if (parts.length > 2) {
    return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
  }
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
