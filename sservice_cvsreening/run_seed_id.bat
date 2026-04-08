@echo off
set PGPASSWORD=12345
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 172.20.108.85 -p 5433 -U postgres -d cv_screening -f "seed_questions_id.sql" > seed_out.txt 2> seed_err.txt
echo Exit code: %ERRORLEVEL%
type seed_out.txt
type seed_err.txt
