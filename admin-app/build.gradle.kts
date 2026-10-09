import java.util.Properties

plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.compose"); id("org.jetbrains.kotlin.plugin.serialization") }

val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) localPropertiesFile.inputStream().use { localProperties.load(it) }
fun configValue(name: String): String = localProperties.getProperty(name) ?: System.getenv(name) ?: ""
fun quoteForBuildConfig(value: String): String = "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""
val supabaseUrl = configValue("SUPABASE_URL")
val supabasePublishableKey = configValue("SUPABASE_PUBLISHABLE_KEY")

android {
    namespace = "dz.harafty.admin"
    compileSdk = 35
    defaultConfig {
        applicationId = "dz.harafty.admin"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "SUPABASE_URL", quoteForBuildConfig(supabaseUrl))
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", quoteForBuildConfig(supabasePublishableKey))
    }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true; buildConfig = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("io.github.jan-tennert.supabase:auth-kt:3.2.5")
    implementation("io.github.jan-tennert.supabase:postgrest-kt:3.2.5")
    implementation("io.github.jan-tennert.supabase:storage-kt:3.2.5")
    implementation("io.github.jan-tennert.supabase:realtime-kt:3.2.5")
    implementation("io.ktor:ktor-client-android:3.0.3")
    testImplementation("junit:junit:4.13.2")
}
