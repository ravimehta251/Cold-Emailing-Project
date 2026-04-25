# Smart Cold Mailer

A full-stack email marketing platform for cold emailing campaigns with SMTP configuration, contact management, and email template support.

## Tech Stack

### Backend
- **Java 21 LTS**
- **Spring Boot** - REST API framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database ORM
- **MySQL** - Database
- **JWT** - Token-based authentication
- **Maven** - Build tool

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Project Structure

```
.
├── backend/                           # Spring Boot REST API
│   ├── pom.xml                       # Maven configuration
│   ├── src/main/java/
│   │   └── com/smartcoldmailer/
│   │       ├── SmartColdMailerApplication.java
│   │       ├── config/               # Spring configuration
│   │       ├── controller/           # REST endpoints
│   │       ├── dto/                  # Data transfer objects
│   │       ├── model/                # JPA entities
│   │       ├── repository/           # Database repositories
│   │       ├── security/             # JWT & security config
│   │       ├── service/              # Business logic
│   │       └── util/                 # Utilities
│   └── src/main/resources/
│       ├── application.yml           # Main config
│       └── application-dev.yml       # Dev config
└── frontend/                         # React + Vite SPA
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── components/               # Reusable components
        ├── context/                  # React context (auth)
        ├── pages/                    # Page components
        └── services/                 # API services
```

## Features

- **User Management** - Sign up, login, authentication
- **SMTP Configuration** - Set up custom SMTP servers
- **Contact Management** - Import and manage email contacts
- **Email Templates** - Create and manage reusable templates
- **Bulk Email Campaigns** - Send emails to multiple contacts
- **Email Tracking** - Log and track email sends
- **Dashboard** - View statistics and campaign metrics

## Prerequisites

- Java 21 LTS
- Node.js 16+ and npm
- MySQL 8.0+
- Git

## Setup & Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Configure the database in `src/main/resources/application-dev.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/coldmailer
    username: root
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
```

3. Build and run:
```bash
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend API will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/{id}` - Update contact
- `DELETE /api/contacts/{id}` - Delete contact

### Email Templates
- `GET /api/email-templates` - Get all templates
- `POST /api/email-templates` - Create template
- `PUT /api/email-templates/{id}` - Update template
- `DELETE /api/email-templates/{id}` - Delete template

### SMTP Configuration
- `GET /api/smtp-config` - Get SMTP configuration
- `POST /api/smtp-config` - Set SMTP configuration
- `PUT /api/smtp-config/{id}` - Update configuration

### Email Campaigns
- `POST /api/emails/send` - Send email to contacts
- `GET /api/emails/logs` - Get email logs
- `GET /api/bulk-sessions` - Get bulk email sessions

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. User logs in with credentials via `/api/auth/login`
2. Backend returns a JWT token
3. Frontend stores token in localStorage
4. Token is sent in `Authorization: Bearer <token>` header for authenticated requests
5. Backend validates token using `JwtAuthenticationFilter`

## Building for Production

### Backend
```bash
cd backend
mvn clean package
java -jar target/smartcoldmailer-*.jar --spring.profiles.active=prod
```

### Frontend
```bash
cd frontend
npm run build
# dist/ folder contains production-ready files
```

## Environment Variables

Create `.env` file in backend and frontend as needed:

**Backend** (`backend/.env`):
```
DB_URL=jdbc:mysql://localhost:3306/coldmailer
DB_USERNAME=root
DB_PASSWORD=password
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400000
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8080/api
```

## Development Tips

- Use `application-dev.yml` for development configuration
- Enable detailed logging by setting `logging.level.root=DEBUG`
- Use browser DevTools to inspect API calls
- Check browser console for frontend errors
- Backend logs are in `logs/` directory

## Troubleshooting

**Backend won't start:**
- Ensure MySQL is running
- Check database credentials in `application-dev.yml`
- Verify Java 21 is installed: `java -version`

**Frontend shows blank page:**
- Clear browser cache and reload
- Check console for API endpoint errors
- Verify backend is running on correct port

**API calls failing:**
- Ensure CORS is properly configured in backend
- Check that both services are running
- Verify API endpoint in frontend config

## Future Enhancements

- Email scheduling
- Advanced analytics and reporting
- A/B testing for campaigns
- Email template builder UI
- Rate limiting and throttling
- Multi-user team support

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.
