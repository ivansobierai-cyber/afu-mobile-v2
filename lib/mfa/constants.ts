/**
 * WP-08 — MFA (TOTP) constants.
 * E-mail OTP is out of scope for this package (planned later).
 */

export const MFA_ISSUER = "AFU Agro";
export const MFA_TOTP_DIGITS = 6;
export const MFA_TOTP_PERIOD_SECONDS = 30;
export const MFA_TOTP_WINDOW = 1;
/** Challenge JWT after password OK, before TOTP — short-lived. */
export const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;
export const MFA_RECOVERY_CODE_COUNT = 10;
export const MFA_RECOVERY_CODE_LENGTH = 10;
/** Roles / tipos that must enroll MFA before elevated admin APIs. */
export const MFA_REQUIRED_TIPOS = ["administrador", "tecnico"] as const;

export const MFA_SETUP_REQUIRED_CODE = "MFA_SETUP_REQUIRED";
export const MFA_CHALLENGE_REQUIRED_CODE = "MFA_REQUIRED";
