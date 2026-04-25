# Multi-stage build for Spring Boot application
# Stage 1: Build stage with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml
COPY pom.xml .

# Copy source code
COPY src ./src

# Build the application (skipping tests)
RUN mvn clean package -DskipTests -Dmaven.javadoc.skip=true

# Stage 2: Runtime stage with JRE only
FROM eclipse-temurin:21-jre-alpine

# Create non-root user for security
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder --chown=app:app /app/target/*.jar app.jar

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
