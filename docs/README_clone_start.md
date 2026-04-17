# 1. Clone the Repository and Start the Server

Clone the repository:

```bash
git clone https://github.com/sasa0309sho-blip/JudgeServerForEduc.git
cd JudgeServerForEduc
```

Start the server (local development):

```bash
docker-compose up --build -d
```

Initialize the database:

```bash
docker-compose exec backend python -m app.init_db
```

Access:

| Service | URL |
|--------|-----|
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:8081> |

The backend automatically reloads when source code changes.

## Production Environment

Run:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Then initialize the database:

```bash
docker-compose exec backend python -m app.init_db
```

## Stop the Server

Stop and remove containers:

```bash
docker-compose down
```

Database are saved in ./database.
