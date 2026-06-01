# Security Architecture

## 1. Data Encryption at Rest
This system implements Application-Level Encryption for sensitive data (PII and Performance data) using `AES-GCM-256`.
The encryption is managed by JPA `AttributeConverter`s (`CryptoConverter` and `BigDecimalCryptoConverter`).

### Encrypted Fields
- `User`: `fullName`, `englishName`
- `PerformanceReview`: `managerComment`, `kpiScore`, `reviewScore`, `finalRating`

### Key Management
The encryption key is loaded from the environment variable `PMS_CRYPTO_SECRET` via `application.properties`.
The key must be a 256-bit (32-byte) string.

## 2. Multi-Factor Authentication (MFA)
We have adopted a modern SSO (Single Sign-On) strategy to handle MFA.
The application delegates the authentication process and MFA enforcement to **Google Workspace (Google Auth)**.

### Policy
- Users must log in via the Google OAuth2 endpoint (`/api/v1/auth/google`).
- MFA (2-Step Verification) MUST be enforced at the Google Workspace Admin Console for the organization.
- By relying on Google's Identity Provider, we ensure enterprise-grade security without maintaining custom TOTP secrets in our database.
