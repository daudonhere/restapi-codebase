<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2b8dfc,100:2b8dfc&height=200&section=header&animation=fadeIn" />
</p>

<h2 align="center">Modular Backend Rest API Using ExpressJS</h2>

<p align="center" style="width: 60%; max-width: 400px; margin: 0 auto;">
  A basic code structure that provides the foundation for building backend applications that implement Representational State Transfer architectural principles.
</p>

---

## 🚀 Installation and Running the Project

Here are the steps to install and run this project:

1.  **Install Requirements**

    After clone the Repository, install all the necessary dependencies listed in the `package.json` file:
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**

    Rename a `.env.example` to `.env` file in the root directory of your project.
    ```env
    DATABASE_URL=your_database_url_here
    JWT_SECRET=jsonwebtokensecretkey
    JWT_EXPIRES_IN=15m
    REFRESH_TOKEN_SECRET=refreshtokensecretkey
    REFRESH_TOKEN_EXPIRES_IN=7d
    PORT=4000
    GOOGLE_CLIENT_ID=google-client-id-here
    GOOGLE_CLIENT_SECRET=google-client-secret-here
    GOOGLE_REDIRECT_URI=google-redirect-uri-here
    GITHUB_CLIENT_ID=github-client-id-here
    GITHUB_CLIENT_SECRET=github-client-secret-here
    GITHUB_CALLBACK_URL=github-callback-url-here
    SMTP_HOST="your-smtp-host"
    SMTP_PORT=587
    SMTP_USER="your-ethereal-user@ethereal.email"
    SMTP_PASS="your-ethereal-password"
    ```

3.  **Migrate Database**

    Run the migration commands to create the database schema:
    ```bash
    npm run migrate up
    ```

4.  **Run Express App**

    After all the above steps are completed, run the Express development server:
    ```bash
    npm run dev
    ```
    The application will run by default at `http://localhost:4000` or `http://127.0.0.1:4000`. Open this address in your browser to see the application.

5.  **Notes**

    Visit `http://localhost:4000/docs` for API documentation or `http://localhost:4000/docs.json` for import to Postman

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2b8dfc,100:2b8dfc&height=160&section=footer"/>
</p>
