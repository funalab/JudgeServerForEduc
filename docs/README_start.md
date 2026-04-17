# 5.Start the Server

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
