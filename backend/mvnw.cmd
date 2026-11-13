@echo off
set BASE_DIR=%~dp0
if not exist "%BASE_DIR%\.mvn\wrapper\maven-wrapper.jar" (echo Maven Wrapper jar is missing.& exit /b 1)
java -classpath "%BASE_DIR%\.mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
