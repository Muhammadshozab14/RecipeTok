# Food Video Service - Backend API

A FastAPI-based backend service for sharing food videos with recipes, user authentication, and social features like following users.

## Features

- 🔐 User authentication with JWT tokens
- 📹 Video upload and streaming via Azure Blob Storage
- 👥 User profiles and following system
- 📝 Recipe management for food videos
- 🔍 Public/private video visibility
- 📱 Personalized feed from followed users

## Prerequisites

- Python 3.10 or higher
- Azure Storage Account (for video storage)
- Azure Cosmos DB account (for database)
- pip (Python package manager)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd fastapi-azure
```

### 2. Create a virtual environment

```bash
# Using venv
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

## Configuration

### 1. Create `.env` file

Create a `.env` file in the root directory with the following variables:

```env
# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
BLOB_CONTAINER=videos
SAS_EXPIRY_MINUTES=60

# Azure Cosmos DB Configuration
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your_cosmos_db_key
COSMOS_DATABASE=videosdb
COSMOS_CONTAINER=videos

# JWT Authentication
SECRET_KEY=your-secret-key-change-in-production-use-a-strong-random-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 2. Get Azure credentials

#### Azure Storage Account:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account
3. Go to "Access keys" to get connection string and account key
4. Create a container named "videos" (or update `BLOB_CONTAINER` in `.env`)

#### Azure Cosmos DB:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Cosmos DB account
3. Go to "Keys" to get endpoint and primary key
4. The database and containers will be created automatically on first run

#### Secret Key:
Generate a strong secret key for JWT tokens:
```bash
# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or using OpenSSL
openssl rand -hex 32
```

## Running the Application

### Development Mode (with auto-reload)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive API Docs (Swagger)**: http://localhost:8000/docs
- **Alternative API Docs (ReDoc)**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get access token
- `GET /auth/me` - Get current user information

### Videos
- `POST /videos` - Upload a video (requires authentication)
- `GET /videos` - List all public videos (requires authentication)
- `GET /videos/{video_id}` - Get video details (requires authentication)
- `GET /videos/{video_id}/stream` - Get streaming URL (requires authentication)

### Users
- `GET /users/{user_id}` - Get user profile
- `GET /users/{user_id}/videos` - Get user's videos
- `POST /users/{user_id}/follow` - Follow a user
- `DELETE /users/{user_id}/follow` - Unfollow a user
- `GET /users/{user_id}/followers` - Get user's followers
- `GET /users/{user_id}/following` - Get users that user is following

### Feed
- `GET /feed` - Get personalized feed from followed users

## Project Structure

```
fastapi-azure/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── auth.py              # Authentication utilities (JWT, password hashing)
│   ├── db.py                # Cosmos DB operations
│   ├── storage.py           # Azure Blob Storage operations
│   ├── schemas.py           # Pydantic models for request/response validation
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentication routes
│       ├── videos.py         # Video routes
│       ├── users.py          # User and follow routes
│       └── feed.py           # Feed routes
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker configuration
├── .env                     # Environment variables (create this)
└── README.md               # This file
```

## Usage Examples

### Register a User

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -F "username=john_doe" \
  -F "email=john@example.com" \
  -F "password=securepassword123"
```

### Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -d "username=john_doe&password=securepassword123"
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user-id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Upload a Video

```bash
curl -X POST "http://localhost:8000/videos" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "title=Delicious Pasta Recipe" \
  -F "file=@video.mp4" \
  -F "recipe=1. Boil pasta 2. Add sauce 3. Enjoy!" \
  -F "visibility=public"
```

### Get Videos

```bash
curl -X GET "http://localhost:8000/videos" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Docker

### Build Docker Image

```bash
docker build -t food-video-service .
```

### Run Docker Container

```bash
docker run -p 8000:8000 --env-file .env food-video-service
```

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Make sure you've activated your virtual environment and installed all dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. **Azure Connection Errors**: Verify your `.env` file has correct Azure credentials and the services are accessible.

3. **Port Already in Use**: Change the port:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

4. **Authentication Errors**: Make sure you're including the Bearer token in the Authorization header:
   ```bash
   -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Cosmos DB Container Creation Errors**: For serverless Cosmos DB accounts, the code automatically handles this. For provisioned accounts, ensure you have sufficient throughput allocated.

## Development

### Code Structure

- **Routers**: Handle HTTP requests and responses
- **Schemas**: Pydantic models for data validation
- **Database**: Cosmos DB operations
- **Storage**: Azure Blob Storage operations
- **Auth**: JWT token generation and validation

### Adding New Endpoints

1. Create/update Pydantic schemas in `app/schemas.py`
2. Add database functions in `app/db.py` if needed
3. Create route handlers in appropriate router file
4. Register router in `app/main.py`

## License

[Your License Here]

## Support

For issues and questions, please open an issue in the repository.

