# 🎥 Setting up a Demo Environment (Database Switching)

When recording a demonstration video on the production server or testing new features, you must avoid displaying or altering real student data. 

Follow these steps to temporarily switch your production database to a clean, isolated "demo database."

## 🛠 Steps to Switch to a Demo Database

### 1. Edit the Docker Compose File
Open your production docker-compose file (`docker-compose.prod.yml`) and locate the `volumes` section under the `db` service. 

Change the host directory from your actual database to a new demo directory (e.g., change `database` to `database_demo`).

```yaml
# docker-compose.prod.yml
services:
  db:
    image: postgres:15
    volumes:
      # Comment out the actual database
      # - ./database:/var/lib/postgresql/data
      
      # Add a new temporary volume for the demo
      - ./database_demo:/var/lib/postgresql/data
```

### 2. Set Up Dummy Users
Before starting the server, edit your `static_data/users.json` (or your initial user data configuration).
Remove the actual B4 students and add dummy accounts (e.g., "佐藤太郎") for the demo.

### 3. Build and Start the Containers
Run the following command to rebuild and start the containers using the production configuration.

```bash 
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Initialize the Demo Database
Since this is a brand new volume, the database is empty. You need to initialize the tables.

```bash 
docker-compose -f docker-compose.prod.yml exec backend python -m app.init_db
```

### 5. Access the Platform
Navigate to the production URL. You will now see a completely clean environment with only your dummy users. You can safely record your demo or conduct testing here!

## 🔄 Reverting to the Actual Database
Once you are done with your demo, it is incredibly easy to restore the real environment.

1. Stop the current containers: `docker-compose -f docker-compose.prod.yml down`

2. Undo the changes in `docker-compose.prod.yml` (Comment out `./database_demo` and uncomment `./database`).

3. Restore your `users.json` to its original state.

4. Restart the server: `docker-compose -f docker-compose.prod.yml up -d`