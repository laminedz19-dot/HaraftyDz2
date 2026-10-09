plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.2.20" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.2.20" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "2.2.20" apply false
}

// Supabase Auth 3.2.5 resolves browser 1.9.0, which requires AGP 8.9.1
// and compileSdk 36. Keep the declared AGP 8.7.3/SDK 35 toolchain stable.
subprojects {
    configurations.configureEach {
        resolutionStrategy.force("androidx.browser:browser:1.8.0")
    }
}
