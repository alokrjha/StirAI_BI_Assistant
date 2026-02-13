
# Voice BI Reporting System - Troubleshooting Guide

If Apache Superset is not coming up or you see `Permission denied` errors:

## 1. Reset Permissions (Critical)
If you see `mkdir: cannot create directory ... Permission denied`, your local `superset_data` folder might have conflicting permission metadata from a previous failed run. Run this on your host machine:

```bash
# Delete the existing corrupted data folder
# WARNING: This resets your Superset metadata (users/dashboards)
rm -rf superset_data
mkdir superset_data
chmod -R 777 superset_data
```

Then restart the containers:
```bash
docker-compose down
docker-compose up -d
```

## 2. Monitor Installation
The first run installs the DuckDB engine and runs migrations. This takes ~2 minutes.
```bash
docker logs -f superset_app
```

## 3. Verify Health Status
Check if the container is "healthy":
```bash
docker ps
```

## 4. Manual Initialization (If Auto-Init Fails)
If the UI is up but you can't log in, run these commands:
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
