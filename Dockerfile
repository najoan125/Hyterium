# Backend Dockerfile for Spring Boot Application

# Build stage
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy gradle files
COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle ./gradle

# Copy source code
COPY src ./src

# Build the application
RUN ./gradlew clean build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built jar from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]