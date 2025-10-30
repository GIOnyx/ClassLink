## Prerequisites

- Java 17 (JDK)
- Node.js LTS (includes npm)
- MySQL Server and Workbench
- Git

Optional but helpful:
- Postman/Thunder Client to poke APIs
- A code editor (you’re in VS Code already)

## 1) Clone the repo

```powershell
# PowerShell
git clone https://github.com/GIOnyx/ClassLink.git
cd ClassLink/ClassLink
```

## 2) Configure the database

You can reuse the defaults or change them. Defaults in `server/src/main/resources/application.properties`:

- DB: `classlink_db`
- User: `root`
- Pass: `gwapo123`

If you prefer a dedicated MySQL user:

```sql
-- Run these in MySQL Workbench
CREATE DATABASE IF NOT EXISTS classlink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a non-root user (recommended)
CREATE USER 'classlink_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON classlink_db.* TO 'classlink_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update `server/src/main/resources/application.properties`:

```
spring.datasource.url=jdbc:mysql://localhost:3306/classlink_db
spring.datasource.username=classlink_user
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

Notes:
- `ddl-auto=update` will create/alter tables automatically on first run.
- CORS is already configured for localhost dev with credentials.

## 3) Run the backend (Spring Boot)

```powershell
# From ClassLink/ClassLink/server
cd server
.\mvnw.cmd -DskipTests package
.\mvnw.cmd spring-boot:run
```

Success criteria:
- Logs show Tomcat started on port 8080
- Hikari connects to MySQL without errors

If you use a different port, you can override quickly:
```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8081"
```

## 4) Run the frontend (Vite + React)

```powershell
# In a new terminal
cd ..\client
npm install
# Optional: if your API port isn’t 8080, create .env and set:
# echo VITE_API_BASE_URL=http://localhost:8081/api > .env
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Axios is already set to:
- Base URL: `VITE_API_BASE_URL` or `http://localhost:8080/api` by default
- `withCredentials: true` for session cookies

CORS is configured to allow localhost with credentials and wildcard dev ports.

## 5) Try it: register and login

- Click “Register” in the UI and create a new Student account.
- On success, you’ll be auto-logged in (session cookie is stored).
- If you see “Email already in use,” pick another email.

If you still see a generic “Registration failed,” check the browser DevTools Network tab for the POST /api/auth/register and tell me the HTTP status—it will help pinpoint (409 duplicate, 400 invalid, or a CORS/network error).

## 6) Admin access (optional)

The system includes Admin entities for admin login. To create an admin on a fresh DB, insert one row (names can vary with naming strategy; start with this simple form which works for many setups):

```sql
INSERT INTO admin (name, email, password, role) VALUES ('Site Admin', 'admin@example.com', 'admin123', 'ADMIN');
```

Then log in using role “admin” at the login form. If your DB naming strategy snake-cases fields, the table/columns might be `admin`, columns like `admin_id`, `name`, `email`, `password`, `role`—use your Workbench table browser to confirm actual names if the insert fails.

Tip: For production, switch to hashed passwords; right now it’s plaintext for simplicity.

## 7) Common pitfalls and fixes

- Registration still fails:
  - Make sure backend is running on 8080 (or set `VITE_API_BASE_URL` in `client/.env`).
  - Hard refresh the browser after backend restarts.
  - Check Network tab: if CORS/preflight fails, ensure you’re on `http://localhost:<port>` (not file://) and that the server logs show startup.
- MySQL auth errors:
  - Ensure the user exists and has privileges on `classlink_db`.
  - Verify host is `localhost` and port `3306`.
- Port already in use:
  - Change backend port via `-Dserver.port=8081` and set `VITE_API_BASE_URL=http://localhost:8081/api`.

## 8) Ready-made environment override (optional)

You can run without editing files by using system properties:

```powershell
# Example: change DB creds without editing application.properties
.\mvnw.cmd spring-boot:run `
  -Dspring-boot.run.jvmArguments="-Dspring.datasource.url=jdbc:mysql://localhost:3306/classlink_db -Dspring.datasource.username=classlink_user -Dspring.datasource.password=your_password"
```

And in the client:
```powershell
# If backend isn’t 8080
echo VITE_API_BASE_URL=http://localhost:8081/api > .env
```

## 9) Seeding data (optional, helpful)

- Add some courses via the Course page (now includes Program selection).
- Use the Admin “Students” tab to create students with default password 123456.
- Enrollment page should show program-specific courses if you set programs on courses.

That’s it—following these steps, any developer can clone, configure MySQL, run the backend and frontend, and start registering users. If you want, I can bundle these into a README “Quickstart” and add sample SQL seeds for admin/courses.
