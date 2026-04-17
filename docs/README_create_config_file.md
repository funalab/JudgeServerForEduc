# 2. Create Required Configuration Files

Some configuration files are **excluded from Git tracking for security reasons**.
Each developer must create them manually using the templates in [`docs/`](./docs).

Required files:

- `.env`
- `backend/app/secret.py`
- `frontend/src/constants/B4.ts`

Reference templates:

- [`docs/.env`](./docs/.env)

```
POSTGRES_USER: Database username (e.g., user)
POSTGRES_PASSWORD: Database password (e.g., password)
POSTGRES_DB: Database name (e.g., judge_db)
SECRET_KEY:Used to sign JWTs and prevent tampering (e.g., secret-key)
CELERY_BROKER_URL: Connection URL for Celery and Redis, which handle asynchronous processing (e.g., redis://redis:6379/0)
DATABASE_URL: URL for SQLAlchemy to connect to the database (e.g., postgresql+psycopg2://\${POSTGRES\_USER}:\${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB})
SLACK_WEBHOOK_URL: Webhook URL for sending Slack notifications
TZ: Timezone (e.g., Asia/Tokyo)
FRONTEND_URL: Frontend URLs permitted for access via CORS settings. Include your local IP address and localhost (e.g., <http://192.168.x.x:3000>, <http://localhost:3000>)
EXEMPT_STUDENT_IDS: Users listed here will not receive overdue notifications via slack (e.g., B4)
```

- [`docs/secret.py`](./docs/secret.py)

```python
B4_to_mail = {
    "Name 1": "mail_prefix1",
    "Name 2": "mail_prefix2",
}
B3_to_mail = {
    "Student ID 1": "mail_prefixA",
    "Student ID 2": "mail_prefixB",
}
B4_to_password = {
    "Name 1": "Generated 16-digit app password (spaces allowed)",
    "Name 2": "Generated 16-digit app password",
}
postfix = "@example.com"  # Domain part of the email
```

- [`docs/B4.ts`](./docs/B4.ts)

```
export const B4 = [
  "Name 1",
  "Name 2",
];
```

These files contain credentials and environment-specific settings required to run the system.

In addition to the secure configuration files above, the frontend uses environment-specific files to determine where to send API requests based on the current build mode.

- `.env.development`
Used during local development. The `VITE_API_URL` and `VITE_FALLBACK_API_URL` are both routed to your local backend server .

- `.env.production`
Used when building the application for the production environment. The `VITE_API_URL` points to the public production server  , while`VITE_FALLBACK_API_URL` provides an internal network IP fallback .
