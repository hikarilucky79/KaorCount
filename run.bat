@echo off
REM ─────────────────────────────────────────────────────────────────────
REM  KaorCount — script de lançamento via Docker (Windows)
REM
REM    run.bat          → sobe a stack de desenvolvimento (build se necessário)
REM    run.bat prod     → sobe a stack de PRODUÇÃO (Caddy + HTTPS + travas)
REM    run.bat build    → apenas constrói as imagens
REM    run.bat up       → sobe sem rebuild
REM    run.bat down     → derruba (mantém o banco)
REM    run.bat reset    → derruba e APAGA o banco
REM    run.bat logs     → acompanha os logs
REM    run.bat status   → mostra o estado dos containers
REM    run.bat check    → valida a configuração de produção
REM ─────────────────────────────────────────────────────────────────────
setlocal enabledelayedexpansion
cd /d "%~dp0"

docker version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Docker nao encontrado. Instale em https://docs.docker.com/get-docker/
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose version >nul 2>&1
    if errorlevel 1 (
        echo ERRO: Docker Compose nao encontrado.
        exit /b 1
    )
    set "COMPOSE=docker-compose"
) else (
    set "COMPOSE=docker compose"
)

REM Sem a cláusula else o COMANDO ficava vazio sempre que um argumento era
REM passado, e todo "run.bat prod|check|logs" caia no erro de uso lá embaixo.
if "%~1"=="" (set "COMANDO=up") else (set "COMANDO=%~1")

REM ─── Configuração de produção ────────────────────────────────────
REM O .env.prod é passado via --env-file para que o Compose NÃO leia o
REM .env de desenvolvimento nem as variáveis do shell.
set "ENV_PROD=.env.prod"
set "PROD=--env-file %ENV_PROD% -f docker-compose.yml -f docker-compose.prod.yml"

goto :main

:checar_producao
    if not exist "%ENV_PROD%" (
        echo ERRO: arquivo %ENV_PROD% nao encontrado.
        echo       Copie .env.prod.example para %ENV_PROD% e edite os valores.
        exit /b 1
    )
    set "ERROS=0"
    for %%V in (SECRET_KEY DB_PASSWORD DB_ROOT_PASSWORD CORS_ORIGINS CADDY_DOMAIN) do (
        findstr /B /R /C:"^%%V=." "%ENV_PROD%" >nul 2>&1
        if errorlevel 1 (
            echo ERRO: variavel %%V vazia ou ausente no %ENV_PROD%.
            set "ERROS=1"
        )
    )
    findstr /B /C:"SECRET_KEY=trocar-esta-chave-em-producao" /C:"SECRET_KEY=COLOQUE_AQUI" /C:"SECRET_KEY=chave-insegura" "%ENV_PROD%" >nul 2>&1
    if not errorlevel 1 (
        echo ERRO: SECRET_KEY ainda e o valor de exemplo.
        echo       Gere uma: python -c "import secrets; print(secrets.token_urlsafe(48))"
        set "ERROS=1"
    )
    findstr /B /R /C:"^EXPO_PUBLIC_.*SECRET" /C:"^EXPO_PUBLIC_.*DB_" /C:"^EXPO_PUBLIC_.*PASSWORD" /C:"^EXPO_PUBLIC_.*TOKEN" "%ENV_PROD%" >nul 2>&1
    if not errorlevel 1 (
        echo ERRO: ha um segredo com prefixo EXPO_PUBLIC_ no %ENV_PROD%.
        echo       Isso embute o valor no bundle do navegador e vira publico.
        set "ERROS=1"
    )
    if "!ERROS!"=="1" exit /b 1
    exit /b 0

:main
if /i "%COMANDO%"=="build" (
    %COMPOSE% build
    goto :fim
)
if /i "%COMANDO%"=="prod" (
    call :checar_producao
    if errorlevel 1 goto :fim
    %COMPOSE% %PROD% up -d --build
    echo.
    echo =======================================================
    echo  KaorCount em PRODUCAO no ar!
    echo =======================================================
    echo  Dominio ......... https://seudominio.com.br
    echo  Use o CADDY_DOMAIN definido no seu %ENV_PROD%
    echo =======================================================
    echo  O certificado HTTPS e emitido na primeira subida (~15s).
    goto :fim
)
if /i "%COMANDO%"=="check" (
    call :checar_producao
    if errorlevel 1 goto :fim
    %COMPOSE% %PROD% config --quiet
    if errorlevel 1 goto :fim
    echo docker-compose.prod.yml valido.
    goto :fim
)
if /i "%COMANDO%"=="up" (
    %COMPOSE% up -d --build
    echo.
    echo =======================================================
    echo  KaorCount no ar!
    echo =======================================================
    echo  App ............ http://localhost:8080
    echo  API (Swagger) .. http://localhost:8000/docs
    echo  Health check ... http://localhost:8000/health
    echo  MySQL ......... localhost:3306
    echo =======================================================
    goto :fim
)
if /i "%COMANDO%"=="down" (
    %COMPOSE% %PROD% down
    goto :fim
)
if /i "%COMANDO%"=="reset" (
    set /p CONFIRM="ATENCAO: isso apaga o banco de producao. Digite SIM para confirmar: "
    if /i "!CONFIRM!"=="SIM" (
        %COMPOSE% %PROD% down -v
        echo Containers e banco de dados removidos.
    ) else (
        echo Cancelado.
    )
    goto :fim
)
if /i "%COMANDO%"=="logs" (
    %COMPOSE% %PROD% logs -f
    goto :fim
)
if /i "%COMANDO%"=="status" (
    %COMPOSE% %PROD% ps
    goto :fim
)

echo Uso: run.bat [prod^|build^|up^|down^|reset^|logs^|status^|check]
exit /b 1

:fim
endlocal
