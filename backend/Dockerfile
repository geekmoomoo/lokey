FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 설정
EXPOSE 3001

# 서버 시작
CMD [ "npm", "start" ]