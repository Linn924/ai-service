FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /build

COPY backend-ruoyi ./backend-ruoyi
WORKDIR /build/backend-ruoyi
RUN mvn -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=builder /build/backend-ruoyi/ruoyi-admin/target/ruoyi-admin.jar /app/ruoyi-admin.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/ruoyi-admin.jar"]
