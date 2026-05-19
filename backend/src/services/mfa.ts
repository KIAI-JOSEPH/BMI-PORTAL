import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { authenticator } = require("otplib");
import QRCode from "qrcode";
import { logger } from "../utils/logger.js";
import { CONFIG } from "../config/index.js";

/**
 * MFA Service
 * Handles TOTP generation, verification and QR code generation
 */
export const MfaService = {
  /**
   * Generate a new TOTP secret
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  },

  /**
   * Generate an OTPAuth URL for QR code
   */
  generateOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, "BMI University", secret);
  },

  /**
   * Generate a QR code DataURL for the secret
   */
  async generateQrCode(otpAuthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpAuthUrl);
    } catch (error) {
      logger.error("Failed to generate MFA QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  },

  /**
   * Verify a TOTP token against a secret
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      logger.error("MFA verification error:", error);
      return false;
    }
  },

  /**
   * Generate recovery codes
   */
  generateRecoveryCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 10-character random alphanumeric code
      codes.push(Math.random().toString(36).substring(2, 12).toUpperCase());
    }
    return codes;
  },
};
