# Required Backend contract for strict password-reset OTP UX

Frontend now expects:

`POST /api/auth/forgot-password/verify`

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Behavior:
- valid, non-expired password-reset OTP -> 200
- invalid/expired OTP -> 400 or 422
- validation only; do not change password
- keep OTP usable for the next `/api/auth/reset-password` request, or return a reset token and coordinate the frontend payload

The final password change remains:

`POST /api/auth/reset-password`

The current frontend sends:

```json
{
  "otp": "123456",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

Reason: the frontend cannot securely know whether an emailed OTP is correct. If the product requires wrong OTP to be rejected before the Reset Password screen is shown, Backend validation is required at that step.
