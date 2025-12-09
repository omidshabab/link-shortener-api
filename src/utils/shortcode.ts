import { randomInt } from 'crypto';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const alphabetLength = alphabet.length;

export const generateShortCode = async (): Promise<string> => {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += alphabet[randomInt(alphabetLength)];
  }
  return code;
};