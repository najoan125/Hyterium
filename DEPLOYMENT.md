# Notion Clone - 배포 가이드

이 문서는 Notion Clone 애플리케이션을 Docker와 Apache를 사용하여 프로덕션 환경에 배포하는 방법을 설명합니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [Docker로 배포하기](#docker로-배포하기)
4. [Apache 설정](#apache-설정)
5. [Discord OAuth 설정](#discord-oauth-설정)
6. [배포 확인](#배포-확인)
7. [문제 해결](#문제-해결)

## 사전 요구사항

서버에 다음 항목들이 설치되어 있어야 합니다:

- Docker (20.10+)
- Docker Compose (2.0+)
- Apache (2.4+)
- SSL 인증서 (Let's Encrypt 권장)

### 필수 Apache 모듈

다음 모듈들이 활성화되어 있어야 합니다:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
sudo systemctl restart apache2
```

## 환경 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 실제 값을 입력합니다:

```bash
# Database Configuration
DATABASE_PASSWORD=강력한_비밀번호_입력

# JWT Configuration (최소 256비트 이상의 랜덤 문자열)
JWT_SECRET=생성한_강력한_JWT_시크릿_키
JWT_EXPIRATION=86400000

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=Discord_애플리케이션_클라이언트_ID
DISCORD_CLIENT_SECRET=Discord_애플리케이션_클라이언트_시크릿

# Production Domain
BASE_URL=https://hyfata.kr
CORS_ALLOWED_ORIGINS=https://hyfata.kr
WEBSOCKET_ALLOWED_ORIGINS=https://hyfata.kr
```

### 2. JWT 시크릿 생성

안전한 JWT 시크릿을 생성합니다:

```bash
openssl rand -base64 64
```

생성된 값을 `.env` 파일의 `JWT_SECRET`에 입력합니다.

## Docker로 배포하기

### 1. 이미지 빌드 및 컨테이너 시작

```bash
# Docker Compose로 모든 서비스 시작
docker-compose up -d --build
```

이 명령은 다음 서비스들을 시작합니다:
- PostgreSQL 데이터베이스 (내부 포트: 5432)
- Spring Boot 백엔드 (포트: 8080)
- Next.js 프론트엔드 (포트: 3000)

### 2. 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 3. 데이터베이스 초기화

처음 배포 시 데이터베이스가 자동으로 생성됩니다. Hibernate의 `ddl-auto=validate` 설정으로 인해 스키마가 자동으로 생성되지 않으므로, 필요 시 수동으로 마이그레이션을 실행해야 합니다.

개발 모드에서 `ddl-auto=update`로 스키마를 생성한 후, 프로덕션 배포를 권장합니다.

## Apache 설정

### 1. Apache 설정 파일 복사

```bash
sudo cp apache-config/notion-clone.conf /etc/apache2/sites-available/
```

### 2. SSL 인증서 경로 수정

`/etc/apache2/sites-available/notion-clone.conf` 파일을 편집하여 SSL 인증서 경로를 실제 경로로 수정합니다:

```apache
SSLCertificateFile /etc/letsencrypt/live/hyfata.kr/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/hyfata.kr/privkey.pem
```

Let's Encrypt를 사용하는 경우:

```bash
sudo certbot --apache -d hyfata.kr
```

### 3. 사이트 활성화 및 Apache 재시작

```bash
# 기본 사이트 비활성화 (선택사항)
sudo a2dissite 000-default.conf

# Notion Clone 사이트 활성화
sudo a2ensite notion-clone.conf

# Apache 설정 테스트
sudo apache2ctl configtest

# Apache 재시작
sudo systemctl restart apache2
```

## Discord OAuth 설정

### 1. Discord 개발자 포털 설정

1. [Discord Developer Portal](https://discord.com/developers/applications)에 접속
2. 애플리케이션 선택 또는 새로 생성
3. OAuth2 섹션으로 이동
4. **Redirects** 섹션에 다음 URL 추가:
   ```
   https://hyfata.kr/hyterium/api/login/oauth2/code/discord
   ```

### 2. Client ID와 Secret 복사

OAuth2 섹션에서 Client ID와 Client Secret을 복사하여 `.env` 파일에 입력합니다.

## URL 구조

배포 후 다음 URL로 접근할 수 있습니다:

- **프론트엔드**: `https://hyfata.kr/hyterium/`
- **백엔드 API**: `https://hyfata.kr/hyterium/api/`
- **WebSocket**: `wss://hyfata.kr/hyterium/api/ws`
- **Health Check**: `https://hyfata.kr/hyterium/api/actuator/health`

## 배포 확인

### 1. Health Check 확인

```bash
# 백엔드 health check
curl https://hyfata.kr/hyterium/api/actuator/health

# 응답 예시:
# {"status":"UP"}
```

### 2. 프론트엔드 접속

브라우저에서 `https://hyfata.kr/hyterium/`에 접속하여 정상 작동을 확인합니다.

### 3. Discord 로그인 테스트

Discord 로그인 버튼을 클릭하여 OAuth 플로우가 정상 작동하는지 확인합니다.

## 문제 해결

### 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker-compose logs backend
docker-compose logs frontend

# 컨테이너 재시작
docker-compose restart backend
docker-compose restart frontend
```

### 데이터베이스 연결 오류

```bash
# 데이터베이스 컨테이너 상태 확인
docker-compose logs db

# 데이터베이스 컨테이너 재시작
docker-compose restart db

# 백엔드가 데이터베이스를 찾을 수 있는지 확인
docker-compose exec backend ping db
```

### CORS 오류가 발생하는 경우

1. `.env` 파일의 `CORS_ALLOWED_ORIGINS`가 올바른지 확인
2. 백엔드 컨테이너 재시작: `docker-compose restart backend`
3. Apache 설정에서 `Access-Control-Allow-Origin` 헤더 확인

### WebSocket 연결 오류

1. Apache 모듈 확인:
   ```bash
   sudo apache2ctl -M | grep proxy_wstunnel
   ```
2. WebSocket 프록시 설정이 올바른지 확인
3. 브라우저 개발자 도구에서 WebSocket 연결 상태 확인

### SSL 인증서 오류

```bash
# Let's Encrypt 인증서 갱신
sudo certbot renew

# Apache 재시작
sudo systemctl restart apache2
```

## 유지보수

### 애플리케이션 업데이트

```bash
# Git에서 최신 코드 가져오기
git pull origin main

# 컨테이너 재빌드 및 재시작
docker-compose up -d --build

# 오래된 이미지 정리
docker image prune -f
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 백엔드 로그
docker-compose logs -f backend

# 프론트엔드 로그
docker-compose logs -f frontend

# Apache 로그
sudo tail -f /var/log/apache2/notion-clone-error.log
sudo tail -f /var/log/apache2/notion-clone-access.log
```

### 데이터베이스 백업

```bash
# PostgreSQL 백업
docker-compose exec db pg_dump -U postgres notion_clone > backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 복원
docker-compose exec -T db psql -U postgres notion_clone < backup_file.sql
```

### 컨테이너 중지 및 제거

```bash
# 컨테이너 중지
docker-compose stop

# 컨테이너 중지 및 제거
docker-compose down

# 컨테이너와 볼륨 모두 제거 (주의: 데이터베이스 데이터도 삭제됨)
docker-compose down -v
```

## 보안 권장사항

1. **환경 변수 보안**: `.env` 파일을 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
2. **강력한 비밀번호**: 데이터베이스와 JWT 시크릿에 강력한 비밀번호 사용
3. **정기적인 업데이트**: Docker 이미지와 시스템 패키지를 정기적으로 업데이트
4. **방화벽 설정**: 필요한 포트(80, 443)만 외부에 개방
5. **SSL/TLS**: HTTPS를 항상 사용하고 인증서를 최신 상태로 유지
6. **데이터베이스 백업**: 정기적으로 데이터베이스 백업 수행

## 성능 최적화

1. **PostgreSQL 튜닝**: 서버 사양에 맞게 PostgreSQL 설정 조정
2. **메모리 설정**: JVM 힙 메모리 설정 (Dockerfile ENTRYPOINT에 `-Xmx` 옵션 추가)
3. **컨테이너 리소스 제한**: `docker-compose.yml`에 CPU/메모리 제한 추가
4. **Apache 성능 튜닝**: `KeepAlive`, `MaxClients` 등 Apache 설정 최적화

## 지원

문제가 발생하거나 질문이 있는 경우:
1. GitHub Issues를 확인하세요
2. 로그를 확인하여 오류 메시지를 찾으세요
3. Discord OAuth 설정을 다시 확인하세요
