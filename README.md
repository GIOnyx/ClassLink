## 🚀 Super Quickstart

If you just want to run the project locally right now:

1. Create the file `server/src/main/resources/application.properties` (if it doesn't exist) with:
  ```properties
 spring.application.name=server

# --- Database Connection ---
# Ensure this line starts exactly with 'jdbc:'
spring.datasource.url=jdbc:mysql://classlink-gregoryivanonyx-ac5e.e.aivencloud.com:11340/defaultdb?sslMode=REQUIRED

# Credentials
spring.datasource.username=avnadmin
spring.datasource.password=AVNS_2-tkPLlZ1doOPWWPz5g

# --- JPA / Hibernate ---
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# --- App Configuration ---
app.cors.allowed-origin=http://localhost:5173
server.servlet.session.cookie.same-site=Lax
server.servlet.session.cookie.secure=false
  ```
  (Adjust username/password if your MySQL differs.)
2. Ensure MySQL is running and the database exists:
  ```sql
  CREATE DATABASE IF NOT EXISTS classlink_db;
  ```
3. From the repo root run the helper script:
  ```powershell
  .\run-all.bat
  ```
  This opens two windows: backend (port 8080) + frontend (port 5173).
4. Open http://localhost:5173 in your browser.
5. Register a student account or add an admin in `server/src/main/resources/admin-accounts.csv` then restart backend.

Done. For more detail, see the full sections below.

## Admin file-based provisioning

Admins can also be provisioned without SQL by editing `server/src/main/resources/admin-accounts.csv`.

How it works:
- At startup `AdminAccountsLoader` reads the CSV.
- Each non-comment, non-blank line is parsed as: `email,password,name`.
- If an admin with that email does not exist, it is created (plaintext password for now).
- Existing admins are left untouched (no overwrite).

Example lines (already present):
```
admin,admin,System Administrator
andreyv.reyes3@gmail.com,gwapo123,Christian Andrey Reyes
```

Add a new admin:
1. Open `server/src/main/resources/admin-accounts.csv`.
2. Append: `new.admin@example.com,changeme,New Admin`.
3. Save and restart backend (`mvnw.cmd spring-boot:run`).
4. Log in with role `admin` using the new credentials.

Guidelines & future improvements:
- Don’t commit real production passwords; switch to hashing before deployment.
- Keep formatting tight (avoid stray spaces around commas).
- Optionally extend format later: `email,password,name,role`.
- Consider password hashing + audit logging for security.

---

## Prerequisites

- Java 17 (JDK)
- Node.js LTS (includes npm)
- MySQL Server and Workbench
- Git

## Clone the repo

```powershell
# PowerShell
git clone https://github.com/GIOnyx/ClassLink.git
cd ClassLink/ClassLink
```
## Run both backend and frontend together (Windows)

To make local development easier you can start both the backend and frontend at the same time using the provided scripts at the repository root.

- `run-all.bat` — Windows batch file that opens two Command Prompt windows and runs the backend (`mvnw.cmd spring-boot:run`) and frontend (`npm run dev`).
- `run-all.ps1` — PowerShell script that opens two PowerShell windows and runs the same commands.

Prerequisites:
- Install Node.js (and run `npm install` once in `client` before first use).
- Have Java (JDK) available; the repo includes `mvnw.cmd` which will use a suitable Maven wrapper.

Usage examples:

Run the batch file (double-click or from PowerShell):

``powershell
./run-all.bat
``

Or run the PowerShell script:

``powershell
.\run-all.ps1
``

What the scripts do:
- Open two windows: one for the backend (Spring Boot) and one for the frontend (Vite).
- Backend command: `mvnw.cmd spring-boot:run` (runs from `server` folder).
- Frontend command: `npm run dev` (runs from `client` folder).

Notes:
- If you prefer a single terminal multiplexed approach, consider running the commands manually with a terminal multiplexer or using an npm package like `concurrently` in the `client` folder — tell me if you want that and I can add it.



























































































































































