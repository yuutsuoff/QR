# ITLive QR Attendance System - Flutter API Guide

This document provides all necessary information for the Flutter developer to integrate the mobile application with the backend.

## 1. Connection Details
The backend uses **localtunnel** to provide a global public URL. 
- **Start the server**: Run `start_global.bat` in the project root.
- **Base URL**: It will be something like `https://itlive-api.loca.lt` (You define the subdomain when starting).
- **Interactive Documentation**: `https://your-subdomain-api.loca.lt/docs` (Swagger UI).

## 2. Authentication Flow
The API uses JWT (Bearer) tokens for security.

### Login
- **Endpoint**: `POST /auth/login`
- **Content-Type**: `application/x-www-form-urlencoded` (Standard OAuth2)
- **Parameters**: 
  - `username`: User's email
  - `password`: User's password
- **Response**:
  ```json
  {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
  ```

*Store this token and include it in the `Authorization` header for all protected requests:*
`Authorization: Bearer <your_token>`

## 3. Main Endpoints for Mobile

### Scan QR Code (Check-in/Check-out)
This is the single endpoint to handle both entering and leaving the office.
- **Endpoint**: `POST /attendance/scan-qr`
- **Body**:
  ```json
  {
    "token": "SCANNED_QR_DATA"
  }
  ```
- **Response Success**:
  ```json
  {
    "status": "success",
    "action": "check_in", 
    "message": "Xush kelibsiz, Ali! Kirish vaqti: 08:45:00 (present)",
    "time": "08:45:00",
    "user_name": "Ali"
  }
  ```

### Get Monthly Attendance History
- **Endpoint**: `GET /attendance/month?month=5&year=2026`
- **Response**: List of attendance records.

## 4. Environment Setup for Developer
- **Secret Key**: Defined in `backend/.env`.
- **CORS**: Currently configured for specific origins. If you face CORS issues during development, set `CORS_ORIGINS=*` in `backend/.env`.

---
*Ready for Flutter development!* ✅
