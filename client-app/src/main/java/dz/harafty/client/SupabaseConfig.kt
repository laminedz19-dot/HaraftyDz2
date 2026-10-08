package dz.harafty.client

import dz.harafty.client.BuildConfig

object SupabaseConfig {
    val url: String = BuildConfig.SUPABASE_URL
    val publishableKey: String = BuildConfig.SUPABASE_PUBLISHABLE_KEY

    fun validate() {
        require(url.startsWith("https://")) { "SUPABASE_URL must use HTTPS" }
        require(publishableKey.isNotBlank()) { "SUPABASE_PUBLISHABLE_KEY is missing" }
        check(!publishableKey.contains("service_role")) { "A service_role key must never be used in an APK" }
    }
}
