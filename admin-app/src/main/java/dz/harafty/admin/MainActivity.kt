package dz.harafty.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SupabaseClientProvider.client
        setContent { AdminApp() }
    }
}

private data class AdminService(val title: String, val artisan: String, val category: String, val status: String, val requests: Int)

@Composable
fun AdminApp() {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        var loggedIn by remember { mutableStateOf(false) }
        MaterialTheme { if (loggedIn) AdminServicesScreen(onLogout = { loggedIn = false }) else AdminLoginScreen(onLogin = { loggedIn = true }) }
    }
}

@Composable
private fun AdminLoginScreen(onLogin: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    Scaffold(topBar = { TopAppBar(title = { Text("HaraftyDz Admin") }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Text("دخول الإدارة", style = MaterialTheme.typography.headlineMedium)
            Text("للحسابات الإدارية المصرّح بها فقط")
            OutlinedTextField(email, { email = it; error = null }, label = { Text("البريد الإداري") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 24.dp))
            OutlinedTextField(password, { password = it; error = null }, label = { Text("كلمة المرور") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 12.dp))
            error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
            Button(onClick = { if (email.isBlank() || password.isBlank()) error = "أدخل بيانات الدخول" else loading = true }, enabled = !loading, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
                if (loading) CircularProgressIndicator(strokeWidth = 2.dp) else Text("دخول آمن")
            }
            LaunchedEffect(loading) { if (loading) { kotlinx.coroutines.delay(400); loading = false; onLogin() } }
        }
    }
}

@Composable
private fun AdminServicesScreen(onLogout: () -> Unit) {
    val services = remember { listOf(
        AdminService("إصلاح السباكة المنزلية", "محمد بن علي", "سباكة", "نشطة", 18),
        AdminService("تركيب وصيانة الكهرباء", "ياسين قادري", "كهرباء", "نشطة", 11),
        AdminService("دهان وتجديد المنازل", "أمين مرابط", "دهان", "مراجعة", 4)
    ) }
    Scaffold(topBar = { TopAppBar(title = { Text("إدارة الخدمات") }, actions = { TextButton(onClick = onLogout) { Text("خروج") } }) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Text("لوحة التحكم", style = MaterialTheme.typography.headlineSmall)
                Text("مراجعة الخدمات والطلبات اليومية", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCard("الخدمات", "124", Modifier.weight(1f)); StatCard("قيد المراجعة", "7", Modifier.weight(1f)); StatCard("الطلبات", "86", Modifier.weight(1f))
                }
            }
            item { Text("الخدمات المنشورة", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 8.dp)) }
            items(services) { service ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text(service.title, style = MaterialTheme.typography.titleMedium)
                        Text("الحرفي: ${service.artisan}")
                        Text("الفئة: ${service.category}")
                        Text("الحالة: ${service.status} — الطلبات: ${service.requests}")
                        Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = {}, modifier = Modifier.weight(1f)) { Text("مراجعة") }
                            OutlinedButton(onClick = {}, modifier = Modifier.weight(1f)) { Text("إيقاف") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier) {
    Card(modifier) { Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value, style = MaterialTheme.typography.titleLarge); Text(label) } }
}
