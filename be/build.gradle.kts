plugins {
	java
	id("org.springframework.boot") version "3.5.5"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.moni"
version = "0.0.1-SNAPSHOT"
description = "Demo project for Spring Boot"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	compileOnly("org.projectlombok:lombok")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	annotationProcessor("org.projectlombok:lombok")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    //db 관련
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.mysql:mysql-connector-j")

	//swagger 의존성
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5")

	// Validation (요청 DTO @NotNull, @Size 등)
	implementation("org.springframework.boot:spring-boot-starter-validation")

	// JSON (DateTime 등 직렬화 호환성)
	implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

	// Actuator (상태 점검용)
	implementation("org.springframework.boot:spring-boot-starter-actuator")

	// JWT (인증 기능)
	implementation("io.jsonwebtoken:jjwt-api:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

	// AWS S3 (AI, 미디어 저장)
	implementation("software.amazon.awssdk:s3:2.25.13")

}

tasks.withType<Test> {
	useJUnitPlatform()
}
