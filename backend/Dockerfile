FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 모든 파일 복사
COPY . .

# 의존성 설치
RUN npm install

# 포트 설정
EXPOSE 3001

# 서버 시작
CMD [ "node", "server.js" ]