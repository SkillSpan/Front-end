# SkillSpan Company Password Reset OTP Fix — Strict Two-Step Flow

## Final behavior

The password recovery flow remains split into two separate interfaces:

1. **Verify Your Identity** — OTP only.
2. **Reset Your Password** — new password + confirmation only.

The user can no longer move from the OTP screen to the Reset Password screen based only on "6 digits entered".

## Strict OTP flow

`Forgot Password`
→ `OTP screen`
→ `POST /api/auth/forgot-password/verify`
→ only if Backend returns success: `Reset Password screen`
→ `POST /api/auth/reset-password`
→ only if Backend returns success: `Success`

### Wrong / expired OTP

- Stay on the OTP screen.
- Show the Backend validation error.
- Do not open the Reset Password screen.

### Correct OTP

- Move to the separate Reset Password screen.
- The final `/api/auth/reset-password` call still validates the OTP before changing the password.

## Backend requirement

For this UX to be secure, Laravel must expose a password-reset OTP validation endpoint:

`POST /api/auth/forgot-password/verify`

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Expected:
- valid OTP -> HTTP 200
- invalid / expired OTP -> HTTP 400 or 422
- this validation step must not change the password
- keep the OTP valid for the subsequent `/api/auth/reset-password` request, or return a reset token and coordinate that contract

Do not reuse the account/email `/api/auth/verify` endpoint unless Backend explicitly confirms it is also the password-reset OTP contract.

## Tests

1. Correct OTP -> Reset Password screen.
2. Wrong OTP -> remains on OTP screen with error.
3. Expired OTP -> remains on OTP screen with error.
4. Network/API failure -> remains on OTP screen.
5. Correct OTP + valid passwords -> Success.
6. Final reset rejection -> no Success screen.
7. OTP and Reset Password interfaces remain visually separate.
