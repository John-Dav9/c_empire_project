@echo off
REM Script pour initialiser la base de données PostgreSQL

echo Initialization de la base de donnees C'EMPIRE...

REM Essayer de se connecter à PostgreSQL en tant que postgres
psql -U postgres -h localhost -p 5432 -f "init-db.sql" 2>&1

if errorlevel 1 (
    echo.
    echo Erreur: Impossible de se connecter a PostgreSQL.
    echo Assurez-vous que:
    echo 1. PostgreSQL est installe et en cours d'execution
    echo 2. L'utilisateur postgres existe
    echo 3. La base de donnees peut etre creee
    pause
    exit /b 1
)

echo.
echo Base de donnees initialisee avec succes!
echo Utilisateur: c_empire_user
echo Mot de passe: empire123
echo Base de donnees: c_empire
pause
