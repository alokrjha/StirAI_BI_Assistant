
# Voice BI Reporting System - Troubleshooting Guide

If Apache Superset is not coming up at `http://localhost:8088/`, follow these steps:

## 1. Permission Errors
If you see `Permission denied` in the logs:
1. The `docker-compose.yml` is now configured to run as `root` to mitigate this.
2. If issues persist, run this on your host machine:
   ```bash
   mkdir -p superset_data data
   chmod -R 777 superset_data data
   ```

## 2. Check Container Logs
Monitor the installation and initialization process:
```bash
docker logs -f superset_app
```
*Note: The first startup takes ~2 minutes to install DuckDB and run migrations.*

## 3. Verify Health Status
Check if the container is "healthy":
```bash
docker ps
```
The status column should say `(healthy)`.

## 4. Manual Initialization (If Auto-Init Fails)
If the UI is up but you can't log in, run these commands as root:
```bash
# Create Admin User
docker exec -u root -it superset_app superset fab create-admin \
              --username admin \
              --firstname Admin \
              --lastname User \
              --email admin@example.com \
              --password admin

# Upgrade DB
docker exec -u root -it superset_app superset db upgrade

# Setup Roles
docker exec -u root -it superset_app superset init
```

## 5. Connecting DuckDB
Once logged in (admin/admin):
1. Go to **Settings** > **Database Connections**.
2. Click **+ DATABASE**.
3. Select **DuckDB** (if listed) or **Other**.
4. **SQLAlchemy URI**: `duckdb:////data/your_file.duckdb`
5. To query parquet files directly in SQL Lab:
   `SELECT * FROM read_parquet('/data/*.parquet')`
