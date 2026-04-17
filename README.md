# JudgeServerForEduc

<img src="https://github.com/user-attachments/assets/0e17d5f5-9418-4f77-853a-38dd646e47e0" align="right" height="200">

### All-in-One C Programming Auto-Judge & Assignment Tracker

**JudgeServerForEduc** is a platform designed to streamline C programming education.
It takes the hassle out of manual grading and provides a safe, interactive environment for both students and teachers.

<br clear="all">

| 📚 for Students | ✒️ for Teachers |
| :---: | :---: |
| ![forStudent](https://github.com/user-attachments/assets/ee1f22f0-605c-42d3-a1bb-873777130a51) | ![forTeacher](https://github.com/user-attachments/assets/b3f97cc9-39ec-4d80-9af4-8051c9d1ead2) |
| <div align="left">✅ **Submit** assignments<br>✅ **Overview** progress<br>✅ View teacher's **feedback**</div> | <div align="left">✅ **Track** all students' progress<br>✅ **Send feedback** on submitted code</div> |

<br>

## 🔑 Key Features

<details><summary><b> For Students</b></summary>
<br>

- Code Submission
  - Submit source code through the web interface.
  - View personal submission history and detailed results for each task.
- Visual Feedback
  - Compare your output with expected results using a built-in diff viewer.

</details>

<details><summary><b> For Teachers (Management)</b></summary>
<br>

- Progress Tracking
  - Monitor the progress of all students across all tasks at a glance.
  - Review submitted code directly on the website.
- Feedback & Communication
  - Send detailed reviews and feedback to students via Gmail with one click.

</details>

<details><summary><b> Automation & Notifications</b></summary>
<br>

- Automated & Asynchronous Judging
  - Automatically and asynchronously compiles and runs the code against multiple test cases.
- <img src="docs/images/slack.png" width="24"> Slack Integration
  - Get instant notifications when a student passes all test cases.
  - Receive automated alerts for students who miss submission deadlines.
- <img src="docs/images/gmail.png" width="24"> Gmail Integration
  - Get notified via email whenever a teacher leaves a comment on your submission.

</details>

<details><summary><b> Security & Execution Control </b></summary>
<br>

- Secure Access Control
  - Manage user accounts and keep data safe by JWT.
- Docker-based Sandboxing
  - All submitted code is executed inside isolated Docker containers.
  - Ensures the host system remains safe, even if malicious code is submitted.
- Resource Limits
  - Strict Time Limits and Memory Limits are enforced for each execution.
  - Prevents infinite loops or memory leaks from affecting system stability.

</details>

<br>

## 🚀 Getting Started

This guide explains how to configure and launch **JudgeServerForEduc** for both local development and production environments.

### Local Development Setup

1. **[Clone the Repository](./docs/README_clone.md)**
   Get the source code onto your local machine.
2. **[Create Configuration Files](./docs/README_create_config_file.md)**
   Set up your `.env` and other necessary config files.
3. **[Setup Notifications (Optional but recommended)](./docs/README_notification.md)**
   Configure the Gmail API and Slack Webhooks for automated alerts.
4. **[Docker Setup](./docs/README_docker.md)**
   Install and configure Docker & Docker Compose.
5. **[Start the Application](./docs/README_start.md)**
   Build the containers, run the server, and launch the platform!

### Production

- **[Deployment Guide](./docs/README_deploy.md)**
  Instructions and best practices for deploying the system to a production environment.

<br>

## 📂 Project Structure

<details><summary><b> Click to expand the directory structure </b></summary>
<br>

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py            # API entry point & app configuration
│   │   ├── notification/      # Slack and Gmail notification logic
│   │   ├── routers/           # API endpoints (Auth, Problems, Status, Submissions)
│   │   ├── init_db.py         # DB schema and initialization
│   │   ├── secret.py          # (Not in Git) Personal info & credentials
│   │   ├── config.py          # System constants and settings
│   │   └── dependencies.py    # DBsession management
│   ├── makefiles/             # Build rules for code execution & judging
│   └── requirements.txt       # Python library dependencies
├── frontend/                  # React + TypeScript source code
│   ├── src/
│   │   ├── components/        # Reusable UI parts (Chakra UI)
│   │   ├── routes/            # Page components and navigation
│   │   ├── constants/         # Frontend constants (B4.ts, StatusColors.ts, trivia.ts)
│   │   ├── utils/             # Frontend utils (DateUtils.ts)
│   │   └── assets/            # Static assets
│   ├── .env.development       # API URL configuration for local development
│   ├── .env.production        # API URL configuration for production environment
│   └── package.json           # JS dependencies and scripts
├── dockerfiles/               # Docker images for each service
├── static_data/               # static assets (problems, test cases, user information)
├── docker-compose.yml         # Container orchestration (Development)
├── docker-compose.prod.yml    # Container orchestration (Production)
├── .env                       # (Not in Git) System environment variables & credentials
└── README.md
```

</details>

<br>

## 💡 How-To Guides

- **[👤 Adding a New Student](docs/README_add_new_student.md)**
  Learn how to register new student accounts and grant them access to the platform.
- **[📃 Adding a New Problem & Test Case](docs/README_add_new_problem_and_testcases.md)**
  Step-by-step instructions for creating new C programming assignments and configuring test cases.
- **[🔥 Setting up a Demo Environment](docs/README_demo_environment.md)**
  Learn how to safely switch to a temporary database to record demos or test features without affecting real student data.

<br>

## ⛏️ Tech Stack

### Frontend

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chakra UI](https://img.shields.io/badge/Chakra--UI-319795?style=for-the-badge&logo=chakra-ui&logoColor=white)](https://chakra-ui.com/)

### Backend & Infrastructure

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-05998b?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![JSON Web Tokens](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
