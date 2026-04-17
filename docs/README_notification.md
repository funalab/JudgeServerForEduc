# 3. Configure Notification Services and Password Security

## <img src="./images/slack.png" width="24"> Slack Notifications

Slack integration enables automatic notifications for:

- Accepted submissions (AC)
- Daily reminders at 00:00 for pending submissions

Setup steps:

1. Add **Incoming Webhooks** to your Slack workspace
2. Generate a webhook URL
3. Set the value in `.env`

```
SLACK_WEBHOOK_URL=YOUR_WEBHOOK_URL
```

Reference:

<https://qiita.com/M4e/items/c26d938e73830b0ba6b9>

## <img src="./images/gmail.png" width="24"> Gmail Notifications

The system can send notification emails to students using Gmail.

Setup steps:

1. Log in to the sender Gmail account
2. Enable **2-Step Verification**
3. Generate a **16-digit App Password**
4. Configure:

```
backend/app/secret.py
```

Use the template:

```
docs/secret.py
```

Reference:

<https://note.com/noa813/n/nde0116fcb03f>

Used by:

```
backend/app/notification/gmail.py
```

## Hash Initial User Passwords

Initial passwords must not be stored in plaintext.

Prepare:

```
static_data/users/users.json
```

Run:

```bash
cd backend/others
python hash_password.py
```

Plaintext passwords will be replaced automatically with **bcrypt-hashed values**.
