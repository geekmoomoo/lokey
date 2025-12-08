FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 먼저 복사 (캐시 효율화)
COPY package*.json ./

# 의존성 설치
RUN npm install --production

# 소스 코드 복사
COPY . .

# Cloud Run용 포트 설정 (환경 변수에서 받음)
EXPOSE 8080

# 서버 시작
CMD [ "node", "server.js" ]