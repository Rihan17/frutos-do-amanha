FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY backend/.mvn/ backend/.mvn/
COPY backend/mvnw backend/mvnw
COPY backend/pom.xml backend/pom.xml
COPY backend/src/ backend/src/
COPY frontend/ backend/src/main/resources/static/

RUN chmod +x backend/mvnw \
    && cd backend \
    && ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /workspace/backend/target/ong-api-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 10000
ENTRYPOINT ["sh", "-c", "exec java -Dserver.port=${PORT:-10000} -jar /app/app.jar"]
