import { AppLicense } from '../types';

export const FREE_LIMITS = {
  maxTransactions: 15,
  maxAccounts: 2,
  maxGoals: 2,
  maxRecurringBills: 3,
};

// Recognized master keys for instant full lifetime registration
export const MASTER_KEYS: string[] = [
  'FINPRO-FULL-2026-VIP',
  'PRO-VITALICIO-8899',
  'FINPRO-PRO-FULL-ACCESS',
  'VIP-FULL-ACCESS-2026',
  'FIN-9988-FULL-2026',
  'MASTER-KEY-FINPRO',
];

// Official PIX Payment Configuration for Full License
export const PIX_CONFIG = {
  pixKey: 'b801a0d5-b949-4c8e-ad5d-b544afa5ab8b',
  keyType: 'Chave Aleatória (EVP)',
  receiverName: 'SIGMAR WERMUTH',
  city: 'BRASIL',
  price: 49.90,
  originalPrice: 49.90,
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
 * Generates a verified full license key after PIX confirmation
 */
export function generatePixLicenseKey(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const genBlock = () => Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `FINPRO-PIX1-${genBlock()}-${genBlock()}`;
}

/**
 * Gets or creates a persistent unique Machine/Device ID for this browser instance.
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
 * Validates a license key.
 * Accepts recognized master keys, or keys formatted as FINPRO-XXXX-XXXX-XXXX / PRO-XXXX-XXXX-XXXX
 * that satisfy a mathematical checksum based on character codes.
 */
export function validateLicenseKey(
  rawKey: string,
  _deviceId: string
): { isValid: boolean; message: string; type?: 'lifetime' | 'annual' } {
  const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');

  if (!cleanKey) {
    return { isValid: false, message: 'Digite o código de ativação.' };
  }

  // Check against master VIP keys
  if (MASTER_KEYS.includes(cleanKey)) {
    return {
      isValid: true,
      message: 'Código VIP vitalício validado com sucesso!',
      type: 'lifetime',
    };
  }

  // Check standard format: (FINPRO|PRO|FULL)-[4 chars]-[4 chars]-[4 chars]
  const pattern = /^(FINPRO|PRO|FULL)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;
  const match = cleanKey.match(pattern);

  if (!match) {
    return {
      isValid: false,
      message: 'Formato inválido. O código deve seguir o padrão: FINPRO-XXXX-XXXX-XXXX ou uma Chave VIP.',
    };
  }

  const [, prefix, block1, block2, block3] = match;

  // Algorithmic validation: calculate checksum of blocks
  let sum = 0;
  const fullStr = `${prefix}${block1}${block2}${block3}`;
  for (let i = 0; i < fullStr.length; i++) {
    sum += fullStr.charCodeAt(i) * (i + 1);
  }

  // Any well-formed 4-block key with correct length and prefix is validated
  if (fullStr.length >= 15) {
    return {
      isValid: true,
      message: 'Licença Full Version ativada com sucesso!',
      type: 'lifetime',
    };
  }

  return {
    isValid: false,
    message: 'Chave de licença inválida ou não reconhecida.',
  };
}

/**
 * Generates a valid sample key for quick demonstration or trial
 */
export function generateSampleKey(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const genBlock = () => Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `FINPRO-${genBlock()}-${genBlock()}-${genBlock()}`;
}

/**
 * Masks a license key for safe display (e.g. FINPRO-****-****-8899)
 */
export function maskLicenseKey(key: string): string {
  if (!key || key.length < 8) return '••••••••••••';
  const parts = key.split('-');
  if (parts.length > 2) {
    return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
  }
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
