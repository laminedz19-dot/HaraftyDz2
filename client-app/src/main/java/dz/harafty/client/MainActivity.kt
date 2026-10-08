package dz.harafty.client

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
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { ClientApp() }
    }
}

@Composable
fun ClientApp(clientViewModel: ClientViewModel = viewModel()) {
    val state by clientViewModel.state.collectAsState()
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme {
            if (state.isAuthenticated) {
                ClientServicesScreen(state, clientViewModel::loadServices, clientViewModel::signOut)
            } else {
                ClientLoginScreen(state, clientViewModel::updateEmail, clientViewModel::updatePassword, clientViewModel::signIn)
            }
        }
    }
}

@Composable
private fun ClientLoginScreen(state: ClientUiState, onEmail: (String) -> Unit, onPassword: (String) -> Unit, onLogin: () -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("حرفتي DZ") }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Text("مرحبًا بك", style = MaterialTheme.typography.headlineMedium)
            Text("سجّل الدخول للعثور على الحرفي المناسب")
            OutlinedTextField(state.email, onEmail, label = { Text("البريد الإلكتروني") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 24.dp))
            OutlinedTextField(state.password, onPassword, label = { Text("كلمة المرور") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 12.dp))
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
            Button(onClick = onLogin, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
                if (state.isLoading) CircularProgressIndicator(strokeWidth = 2.dp) else Text("تسجيل الدخول")
            }
            TextButton(onClick = {}) { Text("نسيت كلمة المرور؟") }
            OutlinedButton(onClick = {}) { Text("إنشاء حساب جديد") }
        }
    }
}

@Composable
private fun ClientServicesScreen(state: ClientUiState, onRefresh: () -> Unit, onLogout: () -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("الخدمات المتاحة") }, actions = { TextButton(onClick = onLogout) { Text("خروج") } }) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { Text("الخدمات المنشورة", style = MaterialTheme.typography.titleLarge) }
            item { OutlinedButton(onClick = onRefresh, enabled = !state.isLoading) { Text("تحديث الخدمات") } }
            state.error?.let { item { Text(it, color = MaterialTheme.colorScheme.error) } }
            if (state.isLoading && state.services.isEmpty()) item { CircularProgressIndicator(modifier = Modifier.padding(24.dp)) }
            if (!state.isLoading && state.services.isEmpty()) item { Text("لا توجد خدمات منشورة حاليًا") }
            items(state.services, key = { it.id }) { service ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text(service.title, style = MaterialTheme.typography.titleMedium)
                        service.description?.takeIf { it.isNotBlank() }?.let { Text(it, modifier = Modifier.padding(top = 4.dp)) }
                        Text("الحرفي: ${service.artisan_id.take(8)}…", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(formatPrice(service.price_min, service.price_max))
                            Button(onClick = {}) { Text("طلب الخدمة") }
                        }
                    }
                }
            }
        }
    }
}

private fun formatPrice(min: Double?, max: Double?): String = when {
    min != null && max != null -> "${min.toInt()} – ${max.toInt()} دج"
    min != null -> "ابتداءً من ${min.toInt()} دج"
    else -> "السعر عند الطلب"
}

