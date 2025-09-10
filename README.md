# Fokus Todos · Jet Age Cloud

**Deploy (Vercel):**
1. Repo auf GitHub pushen.
2. In Vercel importieren.
3. Storage → Postgres anlegen und Env-Variablen setzen (`POSTGRES_*`).
4. GitHub OAuth-App erstellen, `GITHUB_ID`/`GITHUB_SECRET` + `NEXTAUTH_SECRET` in Vercel setzen.
5. Öffne `/` → Weiterleitung auf `/app.html`.