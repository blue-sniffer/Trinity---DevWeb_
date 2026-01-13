# Web Dev Trinity - Grocery Store Management System

A full-stack web application for managing grocery store operations: products, customers, invoices, and KPI reports.

## Stack
- **Backend**: Django REST Framework + JWT auth (djangorestframework-simplejwt)
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL 15
- **Container**: Docker Compose

## Quick Start

```bash
cd /home/hadeed/Documents/a/Web_Dev_Trinity
docker-compose up -d --build
```

After first run:
```bash
# Create migrations for api models
docker exec web_dev_trinity-backend-1 python manage.py makemigrations api
docker exec web_dev_trinity-backend-1 python manage.py migrate

# Create superuser
docker exec -it web_dev_trinity-backend-1 python manage.py createsuperuser
```

**Access**:
- Backend API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
- Frontend: http://localhost:3000/

**Test credentials** (if you used the setup above):
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Auth
- `POST /api/token/` - Get JWT access/refresh tokens
- `POST /api/token/refresh/` - Refresh access token

### Resources (JWT required)
- `GET/POST /api/products/`
- `GET/PUT/DELETE /api/products/{id}/`
- `GET/POST /api/customers/`
- `GET/PUT/DELETE /api/customers/{id}/`
- `GET/POST /api/invoices/`
- `GET/PUT/DELETE /api/invoices/{id}/`

## Features
- JWT-based authentication
- RESTful API for products, customers, invoices
- PostgreSQL with persistent volumes
- React frontend (dev server with hot reload)
- Admin panel for data management

## Development

Backend logs:
```bash
docker logs web_dev_trinity-backend-1 -f
```

Run tests:
```bash
docker exec web_dev_trinity-backend-1 python manage.py test
```

## Next Steps
- Add Open Food Facts integration for product enrichment
- Implement KPI reports endpoint
- Add unit tests (target 20%+ coverage)
- Set up CI/CD pipeline
- Write technical documentation and UML diagrams
