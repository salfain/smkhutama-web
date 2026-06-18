#!/bin/bash
echo "=== Memulai Deployment CBT SMK Hutama ==="

# 1. Pull code terbaru
echo "1. Pulling code from Git..."
git pull origin main

# 2. Rebuild dan restart docker container
echo "2. Rebuilding and restarting Docker containers..."
docker compose down
docker compose up -d --build

# 3. Generate Prisma client di dalam container
echo "3. Generating Prisma client inside container..."
docker exec -it cbt-smkhutama npx prisma generate

# 4. Sync Database Schema
echo "4. Running database push..."
docker exec -it cbt-smkhutama npx prisma db push

# 5. Jalankan script create default users jika belum ada
echo "5. Seeding default users..."
docker exec -it cbt-smkhutama npx tsx scripts/create-admin.ts
docker exec -it cbt-smkhutama npx tsx scripts/create-piket.ts

echo "=== Deployment Selesai! ==="
