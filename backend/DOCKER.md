# Docker Setup Guide for Smart Cold Mailer Backend

## Overview

This Docker setup provides a containerized environment for the Smart Cold Mailer backend connecting to an **External MongoDB** database.

## Files Included

- **Dockerfile** - Multi-stage build for Spring Boot application
- **docker-compose.yml** - Runs backend container only
- **.dockerignore** - Excludes unnecessary files from Docker build context
- **.env** - Environment variables (configured for Docker)
- **.env.example** - Environment variables template

## Prerequisites

- Docker Desktop (includes Docker Engine and Docker Compose)
- External MongoDB instance (MongoDB Atlas, self-hosted, or cloud provider)
- At least 1GB free disk space

### Installation

- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/)

## Quick Start

### 1. Get MongoDB Connection URI

Contact your MongoDB provider or get the connection string from:
- **MongoDB Atlas:** Dashboard → Connect → Python driver
- **Self-hosted:** `mongodb://username:password@host:port/database`

### 2. Update Environment Variables

Edit `.env` file and update:

```bash
# Replace with your actual MongoDB connection URI
SPRING_DATA_MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/coldmailer?retryWrites=true&w=majority
```

### 3. Build and Run

```bash
cd backend
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application

- **Backend API:** `http://localhost:8080`

Check backend health:
```bash
curl http://localhost:8080/actuator/health
```

## Docker Compose Services

### Backend Service Only

- **Container Name:** coldmailer-backend
- **Port:** 8080 (configurable via `SERVER_PORT`)
- **Database:** Connects to external MongoDB
- **Volume:** ./logs (application logs)
- **Health Check:** Every 30 seconds

## Environment Variables

All configuration is managed through `.env` file:

### Database Configuration (REQUIRED)
```env
# External MongoDB URI
SPRING_DATA_MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/coldmailer?retryWrites=true&w=majority
SPRING_DATA_MONGODB_DATABASE=coldmailer
SPRING_DATA_MONGODB_AUTO_INDEX_CREATION=true
```

### Application Configuration
```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
```

### Security Configuration
```env
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRATION=86400000
ENCRYPTION_KEY=MTIzNDU2Nzg5MDEyMzQ1Ng==
```

### Email Configuration
```env
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_FROM=your-email@gmail.com
```

### Feature Configuration
```env
BULK_EMAIL_BATCH_SIZE=10
EMAIL_DELAY_SECONDS=5
MAX_EMAILS_PER_DAY=100
```

## Common Commands

### View Running Containers

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose stop
```

### Stop and Remove Containers

```bash
docker-compose down
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build backend
```

### Access Backend Container Shell

```bash
docker-compose exec backend sh
```

## MongoDB Connection Examples

### MongoDB Atlas (Cloud)
```env
SPRING_DATA_MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/coldmailer?retryWrites=true&w=majority
```

### Self-Hosted MongoDB
```env
SPRING_DATA_MONGODB_URI=mongodb://username:password@192.168.1.100:27017/coldmailer?authSource=admin
```

### MongoDB Local Network
```env
SPRING_DATA_MONGODB_URI=mongodb://username:password@mongo-server.local:27017/coldmailer
```

### MongoDB with SSL/TLS
```env
SPRING_DATA_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coldmailer?retryWrites=true&w=majority&ssl=true
```

## Development Mode

Edit `.env`:
```env
SPRING_PROFILES_ACTIVE=dev
LOGGING_LEVEL_COM_SMARTCOLDMAILER=DEBUG
LOGGING_LEVEL_SPRING_DATA_MONGODB=DEBUG
```

## Production Mode

Edit `.env`:
```env
SPRING_PROFILES_ACTIVE=prod
LOGGING_LEVEL_ROOT=WARN
JWT_SECRET=<strong-random-secret>
MAIL_FROM=production-email@company.com
```

## Building Docker Image Manually

### Build

```bash
docker build -t smartcoldmailer:latest .
```

### Run

```bash
docker run -d \
  --name coldmailer \
  -p 8080:8080 \
  -e SPRING_DATA_MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/coldmailer \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e JWT_SECRET=your-secret-key \
  smartcoldmailer:latest
```

## Troubleshooting

### Backend Container Exits Immediately

Check logs:
```bash
docker-compose logs backend
```

Common issues:
- **MongoDB connection failed** → Verify connection URI is correct
  - Check username/password
  - Verify IP whitelist in MongoDB Atlas
  - Ensure network connectivity to MongoDB server
- **Port already in use** → Change `SERVER_PORT` in .env
- **Out of memory** → Increase Docker memory allocation

### Cannot Connect to MongoDB

```bash
# Test MongoDB connection from container
docker-compose exec backend mongosh "${SPRING_DATA_MONGODB_URI}"

# Check MongoDB URI format
# Should be: mongodb+srv://user:pass@host/db or mongodb://user:pass@host:port/db
```

### MongoDB Atlas IP Whitelist Error

If using MongoDB Atlas:
1. Go to Security → Network Access
2. Add your IP address or allow 0.0.0.0/0 (less secure)
3. Or ensure container has internet access to reach MongoDB Atlas

### Permission Denied Issues

Linux users may need sudo:
```bash
sudo docker-compose up --build
```

Or add docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Monitoring

### View Resource Usage

```bash
docker stats
```

### View Container Logs with Timestamps

```bash
docker-compose logs --timestamps backend
```

### Check Container Health

```bash
docker inspect --format='{{.State.Health.Status}}' coldmailer-backend
```

### Test MongoDB Connection

```bash
docker-compose exec backend sh -c 'echo "db.version()" | mongosh "$SPRING_DATA_MONGODB_URI"'
```

## Networking

The backend container connects to external MongoDB:
- Backend runs in Docker on `localhost:8080` (from host)
- MongoDB connection uses URI from `SPRING_DATA_MONGODB_URI`
- No internal Docker network needed for MongoDB

To access from host:
- Backend: `http://localhost:8080`
- MongoDB: Use your external MongoDB provider's tools

## Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Spring Boot Docker Guide](https://spring.io/guides/gs/spring-boot-docker/)
- [MongoDB Connection String](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb)
