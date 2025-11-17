<div align="center">
  <img src="client/src/assets/react.svg" height="70" alt="ClassLink" />
  
  # ClassLink
  Unified academic portal – Spring Boot backend + React (Vite) frontend.
</div>

## ️ Overview
This repo contains:
- `server/` – Spring Boot (Java 17) REST API + JPA (MySQL or H2 dev profile) + session-based auth + CORS config.
- `client/` – React 19 + Vite + Axios + simple student management UI.

You can run instantly with the in‑memory H2 dev profile, then switch to MySQL for persistence.

## 🔧 Prerequisites
Mandatory: Java 17, Node.js (LTS), Git.
Choose one DB path:
- QUICKSTART: none (uses H2 in dev profile)
- PERSISTENT: MySQL 8.x (server + Workbench)

Helpful: Postman / Thunder Client, Docker (optional), VS Code.

## 🧪 Clone
```powershell
git clone https://github.com/GIOnyx/ClassLink.git
cd ClassLink/ClassLink
```

## 🚀 Quickstart (H2 dev profile – no MySQL needed)
In one terminal (backend):
```powershell
cd server
$env:SPRING_PROFILES_ACTIVE='dev'
./mvnw.cmd spring-boot:run -DskipTests
```
Success criteria: logs show `Started ServerApplication` and `HealthController` available at `http://localhost:8080/api/health`.

In another terminal (frontend):
```powershell
cd client
npm install
npm run dev
```
Open http://localhost:5173 – student management and registration should work (data stored in-memory).

## 🗄️ Switch to MySQL
Create DB and user (optional but recommended):
```sql
CREATE DATABASE IF NOT EXISTS classlink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'classlink_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON classlink_db.* TO 'classlink_user'@'localhost';
FLUSH PRIVILEGES;
```
Update `server/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/classlink_db
spring.datasource.username=classlink_user
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
app.cors.allowed-origin=http://localhost:5173
```
Then run without dev profile:
```powershell
cd server
./mvnw.cmd spring-boot:run -DskipTests
```

## 🔁 Profiles
- `dev` (H2): defined in `application-dev.properties` (in‑memory DB, SQL logging, H2 console at `/h2-console`).
- default (MySQL): reads `application.properties`.

Activate dev profile:
```powershell
$env:SPRING_PROFILES_ACTIVE='dev'; ./mvnw.cmd spring-boot:run -DskipTests
```

## 🌐 Frontend API base
API requests use relative `/api/...` (Vite proxy). To override target (e.g. custom port):
```powershell
echo VITE_API_BASE=http://localhost:8081 > client/.env
```
Update proxy in `client/vite.config.js` if you change backend port.

## 🤝 CORS & Sessions
Global CORS defined in `CorsConfig.java` – allows configured origins + wildcard localhost ports. Cookies (sessions) work because `allowCredentials=true` and SameSite=Lax for dev.

## 📚 Key Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/health | Simple health check |
| GET | /api/students | List students |
| PUT | /api/students/me | Update current logged-in student application/profile |
| GET | /api/students/me | Fetch logged-in student info |

Extend with: POST /api/students, DELETE /api/students/{id} (admin) if needed.

## 👩‍🎓 Student Management
Frontend page `StudentPage.jsx` provides create/edit/delete (H2 dev) via Axios wrapper in `studentApi.js`. Ensure backend running; if you see “Cannot reach server”, verify:
- Server listening on 8080
- Network tab: request to `/api/students` returns 200
- No CORS preflight failure (OPTIONS should be 200)

## 🩺 Health Check
`GET /api/health` returns `{ "status": "UP", "timestamp": "..." }` – use this for quick backend availability tests.

## 🔐 Admin Seeding (Optional)
Insert an admin row (for local testing):
```sql
INSERT INTO admin (name, email, password, role) VALUES ('Site Admin', 'admin@example.com', 'admin123', 'ADMIN');
```
Password hashing NOT yet implemented – treat this as dev‑only.

## 🧪 Testing & Build
Backend unit tests placeholder under `server/src/test/...`. To run:
```powershell
cd server
./mvnw.cmd test
```
Frontend build:
```powershell
cd client
npm run build
```

## 🧰 Troubleshooting
| Symptom | Fix |
|---------|-----|
| ECONNREFUSED from Vite proxy | Backend not running or port mismatch – start server, confirm 8080 or update proxy. |
| CORS error / blocked by policy | Origin not whitelisted – add port to `app.cors.allowed-origin` or ensure using dev profile. |
| PowerShell cannot run npm (signature) | Use `cmd.exe` or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` temporarily. |
| Tables not created | Check `spring.jpa.hibernate.ddl-auto=update` and DB credentials; enable dev profile for H2 quick test. |
| Session not persisting | Ensure requests use relative `/api` so proxy keeps cookies; avoid cross-domain mismatches. |

## 🗂️ Directory Structure (excerpt)
```
server/
  src/main/java/com/classlink/server/... (controllers, models, repositories, config)
  src/main/resources/application.properties
  src/main/resources/application-dev.properties
client/
  src/pages/* / components/* / services/*
```

## 🧭 Next Improvements (ideas)
- Password hashing & authentication hardening
- Role-based method security
- DTO + validation layer (@Valid)
- Integration tests for StudentController
- Docker compose (MySQL + app + frontend)

## ✅ Quick Copy Commands
```powershell
# Dev (H2) full stack
cd server; $env:SPRING_PROFILES_ACTIVE='dev'; ./mvnw.cmd spring-boot:run -DskipTests
# In another terminal
cd client; npm install; npm run dev
```

```powershell
# Production-ish (MySQL) after setting application.properties
cd server; ./mvnw.cmd spring-boot:run -DskipTests
cd client; npm install; npm run build; npm run preview
```

## 🙋 Support
Open an issue or ask in the project chat. Provide:
- Exact error stacktrace (if backend)
- Network request status + response headers (if frontend)
- Your OS + Java + Node versions

Happy hacking! 🚀
