# 7. Deployment Guide

This document outlines the standard procedures for deploying the judge server to a production environment, as well as how to apply updates after the system is live.

## 1. Recommended Operating System

Because this system heavily relies on **Docker**, deploying to a **Linux OS** is highly recommended. 

**Why Linux?**
Docker natively utilizes Linux kernel features (such as namespaces and cgroups) to isolate containers. 
When you run Docker on Windows or macOS, it actually spins up a hidden Linux Virtual Machine (VM) in the background, which consumes extra memory and introduces performance overhead. 
Since a judge server requires maximum CPU efficiency and stability to execute and evaluate submitted code accurately, a native Linux environment is the safest and most performant choice.

> 💡 **For Funahashi Lab Members:**
> If you are deploying this system within our lab's local network, the **Ryzen server** is the optimal choice. 

## 2. Development vs. Production Environments

It is important to understand the structural differences between our local development setup and the production deployment:

* **Development Environment (Dev):** Optimized for writing code. It uses "Hot Reloading" (by mounting your local host directories directly into the containers). If you save a Python or React file on your Mac, the server immediately updates. However, this file-syncing process is too slow and insecure for actual deployment.
* **Production Environment (Prod):** Optimized for speed and security. We use a separate configuration file (`docker-compose.prod.yml`). Instead of syncing files, the source code is permanently copied (baked) into the container images during the build process. Hot reloading is disabled to ensure maximum stability.

## 3. Pre-Deployment Setup: Managing Secrets

Before starting the server, you must manually configure the environment variables. 

Files containing sensitive information (like passwords, database credentials, and API keys) are strictly excluded from version control via `.gitignore`. Therefore, simply cloning the repository is not enough to run the system.

**Action Required:**
You must manually create the `.env` file on the deployment server. Please strictly follow the instructions in [`README_create_config_file.md`](./README_create_config_file.md) to set up your configurations before proceeding.

## 4. Applying Updates Post-Deployment

Once the system is live, you may need to update the specifications, fix bugs, or add new features. 
Because the production environment uses baked images (not hot-reloaded files), you must explicitly rebuild the containers to reflect any changes.

Execute the following commands in the project root directory on your production server:

**Step 1: Rebuild the updated containers from scratch**
We use the `--no-cache` flag to ensure Docker doesn't use old, cached layers, guaranteeing that your latest code is fully integrated into the `backend` and `worker` images.
```bash
docker-compose -f docker-compose.prod.yml build --no-cache backend worker
```

**Step 2: Apply the changes and restart the containers**
This command starts the newly built containers in the background (`-d`). 
Docker will automatically and seamlessly replace the old containers with the new ones.
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Step 3: Re-initialize the Database (If required)**
If your updates included changes to the database schemas or if you need to load new initial data, execute the initialization script inside the running backend container:
```bash
docker-compose exec backend python -m app.init_db
```
Your updates are now live!

<div align="right">
  Author: Sumire Mori
</div>