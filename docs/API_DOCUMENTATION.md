# Crypto Sniper Bot API Documentation

## Authentication

### Register
- **Endpoint**: `/api/auth/register`
- **Method**: POST
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}