# Future Roadmap

What to add next to make this production-grade for web, mobile, and SaaS scale.

---

## Phase 1: Production Hardening (Next 2-4 weeks)

| Item | Priority | Notes |
|------|----------|-------|
| SMTP integration (Nodemailer) | High | Configure real email provider |
| SMS provider (MSG91/Twilio) | High | Replace dev logger |
| Razorpay/Stripe payment integration | High | Replace manual payment simulation |
| S3 upload for invoice PDFs | High | Replace local disk storage |
| Helmet CSP configuration | Medium | Fine-tune CSP headers |
| Input sanitization (XSS) | Medium | Add DOMPurify or express-mongo-sanitize |
| CORS origin whitelist | Medium | Replace `*` with domain list |
| Sentry error tracking | Medium | Capture unhandled errors |
| Health check endpoint improvement | Low | Add DB/Redis ping status |

---

## Phase 2: Features (1-2 months)

| Feature | Module | Notes |
|---------|--------|-------|
| Tenant management API | tenant | CRUD for tenants (super_admin only) |
| Tenant onboarding flow | tenant | Self-service signup page |
| WhatsApp notifications | notification/jobs | WhatsApp Business API |
| Push notifications | notification/jobs | Firebase FCM |
| Analytics dashboard API | analytics | Revenue, booking trends per tenant |
| Operator dashboard API | admin | Buses, revenue, seat occupancy |
| Promo codes & discounts | booking/payment | Apply discount codes at checkout |
| Booking waitlist | booking | Queue users for sold-out buses |
| Seat selection UI data | bus | Return seat layout (window/aisle/middle) |
| Booking history export | booking | CSV/PDF export |
| Refund automation | payment | Auto-trigger refund on cancellation |

---

## Phase 3: Scale & Infra (2-6 months)

| Item | Notes |
|------|-------|
| Kafka / RabbitMQ | When event volume exceeds Node EventEmitter capacity |
| Redis Cluster | When single Redis instance becomes a bottleneck |
| CDN for static assets | CloudFront for invoices/images |
| Database read replicas | Split read/write for high-traffic queries |
| Rate limit by tenant | Per-tenant rate limits based on plan |
| Circuit breaker | Hystrix-style fallback for payment gateway outages |
| OpenTelemetry tracing | Distributed tracing for all modules |
| k8s deployment | Helm chart + HPA for autoscaling |
| Multi-region MongoDB | Atlas global clusters for low latency |

---

## Phase 4: Mobile / Web App Integration

| Integration | Notes |
|-------------|-------|
| REST API versioning (`/api/v2/`) | Non-breaking API evolution |
| GraphQL layer | Optional: Apollo Server over existing services |
| WebSocket reconnection logic | Client-side Socket.IO reconnect with backoff |
| Deep linking | Mobile deep link for booking confirmation |
| App store receipt validation | For in-app purchases (iOS/Android) |
| Offline mode | Cache bus search results locally with TTL |
| Biometric auth | Use device biometrics after initial OTP |

---

## Phase 5: Compliance & Security

| Item | Notes |
|------|-------|
| Data encryption at rest | MongoDB Atlas Encryption / field-level encryption |
| PII masking in logs | Don't log phone, email, Aadhar in Winston |
| GDPR data export | User can request all their data |
| GDPR data deletion | Soft delete + anonymize user data |
| API key authentication | For B2B integrations / partner APIs |
| Audit log | Track all admin/operator actions |
| Two-factor auth for admins | TOTP (Google Authenticator) for admin accounts |
| Penetration testing | Before launch: test for OWASP Top 10 |
