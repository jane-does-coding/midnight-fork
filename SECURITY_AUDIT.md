# Security Audit Report - Midnight Application

**Date:** October 21, 2025  
**Auditor:** AI Security Analysis  
**Scope:** Full application stack (Gateway, User Service, Mail Service, Frontend)

---

## Executive Summary

**Overall Risk Level: MEDIUM-HIGH**

The application has several security vulnerabilities that need immediate attention, particularly around PII exposure, authentication, and logging practices.

---

## Critical Security Issues

### 🔴 CRITICAL: Mail Service Endpoints Publicly Exposed

**File:** `owl-api/mail-service/src/app.controller.ts`

**Issue:**
- The mail service has NO authentication on its endpoints:
  - `POST /send-rsvp-email` - Allows anyone to send emails to any address
  - `POST /process-scheduled-emails` - Allows anyone to trigger email processing

**Current Code (Lines 9-20):**
```typescript
@Post('/send-rsvp-email')
@HttpCode(200)
async sendRsvpEmail(@Body() body: SendEmailDto) {
  return await this.appService.sendRsvpEmail(body.email, body.rsvpNumber, body.stickerToken);
}

@Post('/process-scheduled-emails')
@HttpCode(200)
async processScheduledEmails() {
  await this.appService.processScheduledEmails();
  return { success: true, message: 'Scheduled emails processed' };
}
```

**Risk:**
- Email bombing attacks
- Spam through your SMTP
- Unauthorized email sending
- Resource exhaustion

**Mitigation:**
The mail service should:
1. Only be accessible from internal services (not via gateway)
2. Require an API key or service-to-service authentication
3. Rate limit all endpoints

---

### 🔴 CRITICAL: OTP Codes Logged to Console

**File:** `owl-api/user-service/src/admin.service.ts:76`

**Issue:**
```typescript
console.log(`OTP for ${email}: ${otpCode}`);
```

**Risk:**
- OTP codes are exposed in production logs
- Anyone with access to logs can gain admin access
- Violates security best practices

**Mitigation:**
- Remove this log statement entirely in production
- Use proper email delivery instead of console logging

---

### 🟠 HIGH: PII Exposure in Admin Dashboard

**File:** `owl-api/user-service/src/dashboard.controller.ts:24-60`

**Issue:**
The admin dashboard endpoint returns full email addresses of all users without any redaction:

```typescript
@Get('email-jobs')
async getEmailJobs(...) {
  const [jobs, total] = await Promise.all([
    this.mailServicePrisma.emailJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    ...
  ]);
  return { jobs, ... };  // Contains recipientEmail field
}
```

**PII Exposed:**
- Full email addresses (recipientEmail)
- Email subjects (may contain sensitive info)
- Error messages (may contain sensitive info)

**Risk:**
- GDPR/privacy compliance issues
- Data breach if admin account is compromised
- Unnecessary PII exposure

**Mitigation:**
- Redact email addresses (e.g., `u***@domain.com`)
- Add audit logging for who accesses PII
- Consider masking sensitive data

---

### 🟠 HIGH: Sensitive Data in Logs

**Files:** Multiple

**Issues:**
1. `owl-api/user-service/src/app.service.ts:107` - Logs email addresses
2. `owl-api/user-service/src/app.service.ts:196` - Logs email addresses
3. `owl-api/user-service/src/app.service.ts:231` - Logs email addresses
4. `owl-api/mail-service/src/app.service.ts:222,244,300,381` - Logs recipient emails

**Risk:**
- PII in application logs
- Compliance violations (GDPR, CCPA)
- Audit trail issues

**Mitigation:**
- Remove email addresses from logs
- Use user IDs or hashed identifiers instead
- Implement PII redaction in logging framework

---

### 🟠 HIGH: CORS Configuration Too Permissive

**File:** `owl-api/mail-service/src/main.ts:14-18`

**Issue:**
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || '*',  // ⚠️ Defaults to wildcard!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
});
```

**Risk:**
- If `CORS_ORIGIN` is not set, ANY origin can access the API
- Combined with credentials: true, this is extremely dangerous
- CSRF vulnerabilities

**Mitigation:**
- Never use wildcard with credentials: true
- Make CORS_ORIGIN required, not optional
- Fail startup if not configured

---

### 🟡 MEDIUM: Missing Rate Limiting

**Files:** Most endpoints

**Issue:**
Only admin login endpoints have rate limiting:
- `POST /rsvp/initial` - No rate limiting
- `POST /rsvp/complete` - No rate limiting
- `POST /sticker-token/verify` - No rate limiting
- Mail service endpoints - No rate limiting

**Risk:**
- Brute force attacks
- Resource exhaustion
- Database overload
- RSVP spam

**Mitigation:**
- Add global rate limiting
- Per-IP limits on public endpoints
- Per-email limits on RSVP endpoints

---

### 🟡 MEDIUM: Gateway Logs Request Bodies

**File:** `gateway/src/main.ts:30-36`

**Issue:**
```typescript
if (req.body && Object.keys(req.body).length > 0) {
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader('Content-Type', 'application/json');
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
  console.log(`[${serviceName.toUpperCase()}] Body:`, req.body);
}
```

**Risk:**
- PII logged (email, name, birthday)
- Passwords if any auth is added
- Production log pollution

**Mitigation:**
- Remove body logging in production
- Implement request sanitization
- Use structured logging with PII redaction

---

### 🟡 MEDIUM: Airtable API Key Exposure Risk

**File:** `owl-api/user-service/src/app.service.ts:7-10`

**Issue:**
Hardcoded Airtable base IDs and table IDs in source code:
```typescript
private readonly BASE_ID = 'appumOs6hlFGhbv7c';
private readonly TABLE_NAME = 'tbldJ8CL1xt7qcnrM';
private readonly EMAIL_TABLE_ID = 'tblFDNhax22eAjSB3';
```

While the API key is in environment variables, exposing these IDs makes it easier to attack if the key leaks.

**Risk:**
- Information disclosure
- Attack surface expansion

**Mitigation:**
- Move to environment variables
- Add API key rotation process
- Monitor Airtable API usage for anomalies

---

### 🟡 MEDIUM: No Input Sanitization for Birthday

**File:** `owl-api/user-service/src/app.service.ts:151-160`

**Issue:**
Birthday is accepted as a string and parsed without proper validation:
```typescript
private calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  // No validation that birthDate is valid
  ...
}
```

**Risk:**
- Invalid date handling
- Potential injection via edge cases
- Data quality issues

**Mitigation:**
- Use strict date validation
- Add date format validation (YYYY-MM-DD)
- Reject malformed dates explicitly

---

### 🟡 MEDIUM: Session Tokens Not Rotated

**File:** `owl-api/user-service/src/admin.service.ts:140-147`

**Issue:**
Session tokens are generated once and never rotated:
```typescript
const sessionToken = this.generateSessionToken();
await this.redis.set(
  `session:${sessionToken}`,
  JSON.stringify({ email, sessionId: session.id }),
  this.SESSION_EXPIRY_HOURS * 60 * 60,
);
```

**Risk:**
- Session fixation attacks
- Long-lived tokens increase risk

**Mitigation:**
- Rotate tokens periodically
- Implement token refresh mechanism
- Add session invalidation on suspicious activity

---

## PII Data Inventory

### PII Stored in Database:

**user-service database:**
1. Email addresses (in EmailJob, AdminUser, StickerToken tables)
2. Admin email addresses
3. OTP codes (temporarily)

**Airtable (external):**
1. Email addresses
2. First names
3. Last names
4. Birthdays (date of birth)
5. Client IP addresses
6. Referral codes

**PII in Logs:**
1. Email addresses (multiple locations)
2. OTP codes
3. Client IP addresses
4. RSVP data

---

## Infrastructure Security

### ✅ GOOD: Mail Service Not Exposed in Gateway
The gateway only proxies `/api/user/*` to the user service. Mail service is not exposed publicly.

### ✅ GOOD: Cookie Security
Admin cookies use httpOnly, secure (in production), sameSite: strict

### ✅ GOOD: Input Validation
DTOs use class-validator for input validation

### ⚠️ CONCERN: Docker Configuration
Mail service is on the same network as other services and could be accessed if any service is compromised

---

## Recommendations (Priority Order)

### Immediate (Do Today):
1. **Remove OTP logging** - Delete line 76 in admin.service.ts
2. **Add mail service authentication** - Require API key for all endpoints
3. **Fix CORS wildcard** - Make CORS_ORIGIN required
4. **Remove PII from logs** - Redact email addresses in all log statements

### Short Term (This Week):
1. **Add rate limiting** - Implement on all public endpoints
2. **Redact PII in admin dashboard** - Mask email addresses
3. **Move Airtable IDs to env vars** - Don't hardcode in source
4. **Add request body sanitization** - Remove sensitive data from gateway logs

### Medium Term (This Month):
1. **Implement audit logging** - Track admin access to PII
2. **Add session rotation** - Rotate admin session tokens
3. **Strict date validation** - Improve birthday input handling
4. **Security headers** - Add helmet.js or equivalent
5. **Add CSRF protection** - For state-changing operations

### Long Term (This Quarter):
1. **PII encryption at rest** - Encrypt sensitive fields in database
2. **Implement field-level encryption** - For emails and birthdates
3. **Add security scanning** - Automated vulnerability scanning
4. **Penetration testing** - External security audit
5. **Compliance review** - GDPR/CCPA compliance audit

---

## Compliance Considerations

### GDPR Requirements:
- ❌ Data minimization - Storing more data than necessary
- ❌ Right to erasure - No deletion mechanism visible
- ❌ Data breach notification - No breach detection
- ⚠️ Data protection by design - Partial implementation

### Recommendations:
1. Implement data retention policies
2. Add user data export functionality
3. Add user data deletion functionality
4. Implement breach detection and alerting

---

## Testing Recommendations

1. **Penetration Testing:**
   - Test mail service authentication bypass
   - Test admin OTP brute forcing
   - Test rate limiting effectiveness

2. **Security Testing:**
   - OWASP ZAP scan
   - SQL injection testing (if any raw queries)
   - XSS testing on email templates

3. **Compliance Testing:**
   - GDPR compliance audit
   - PII data flow analysis
   - Access control testing

---

## Conclusion

The application has a solid foundation with NestJS validation and proper cookie security, but requires immediate attention to:
1. Mail service authentication
2. PII exposure in logs and admin interfaces
3. Rate limiting implementation
4. CORS configuration

These issues should be addressed before production deployment to ensure user privacy and system security.

