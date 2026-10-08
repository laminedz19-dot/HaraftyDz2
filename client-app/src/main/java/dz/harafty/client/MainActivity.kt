package dz.harafty.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SupabaseClientProvider.client
        setContent { ClientApp() }
    }
}

private data class ServiceCard(
    val title: String,
    val artisan: String,
    val location: String,
    val price: String,
    val rating: String
)

@Composable
fun ClientApp() {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        var loggedIn by remember { mutableStateOf(false) }
        MaterialTheme {
            if (loggedIn) {
                ClientServicesScreen(onLogout = { loggedIn = false })
            } else {
                ClientLoginScreen(onLogin = { loggedIn = true })
            }
        }
    }
}

@Composable
private fun ClientLoginScreen(onLogin: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Scaffold(topBar = { TopAppBar(title = { Text("حرفتي DZ") }) }) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("مرحبًا بك", style = MaterialTheme.typography.headlineMedium)
            Text("سجّل الدخول للعثور على الحرفي المناسب", fontSize = 15.sp)
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(email, { email = it; error = null }, label = { Text("البريد الإلكتروني") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(password, { password = it; error = null }, label = { Text("كلمة المرور") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(16.dp))
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) error = "أدخل البريد الإلكتروني وكلمة المرور"
                    else { loading = true; error = null }
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth()
            ) { if (loading) CircularProgressIndicator(strokeWidth = 2.dp) else Text("تسجيل الدخول") }
            LaunchedEffect(loading) { if (loading) { kotlinx.coroutines.delay(400); loading = false; onLogin() } }
            TextButton(onClick = {}) { Text("نسيت كلمة المرور؟") }
            OutlinedButton(onClick = {}) { Text("إنشاء حساب جديد") }
        }
    }
}

@Composable
private fun ClientServicesScreen(onLogout: () -> Unit) {
    val services = remember {
        listOf(
            ServiceCard("إصلاح السباكة المنزلية", "محمد — حرفي موثق", "الجزائر العاصمة", "ابتداءً من 2,000 دج", "4.9"),
            ServiceCard("تركيب وصيانة الكهرباء", "ياسين — حرفي موثق", "البليدة", "ابتداءً من 1,500 دج", "4.8"),
            ServiceCard("دهان وتجديد المنازل", "أمين", "بومرداس", "ابتداءً من 3,500 دج", "4.7")
        )
    }
    Scaffold(topBar = {
        TopAppBar(title = { Text("الخدمات المتاحة") }, actions = { TextButton(onClick = onLogout) { Text("خروج") } })
    }) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { Text("ابحث عن خدمة بالقرب منك", style = MaterialTheme.typography.titleLarge) }
            item { OutlinedTextField("", {}, label = { Text("بحث حسب المهنة أو الولاية") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
            items(services) { service ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text(service.title, style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(6.dp))
                        Text(service.artisan)
                        Text(service.location, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text(service.price)
                            Text("★ ${service.rating}")
                        }
                        Spacer(Modifier.height(10.dp))
                        Button(onClick = {}, modifier = Modifier.fillMaxWidth()) { Text("عرض التفاصيل وطلب الخدمة") }
                    }
                }
            }
        }
    }
}
