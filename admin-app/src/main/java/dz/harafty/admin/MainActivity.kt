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
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
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

class MainActivity : ComponentActivity() { override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { AdminApp() } } }

@Composable
fun AdminApp(vm: AdminViewModel = viewModel()) {
    val state by vm.state.collectAsState()
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme { if (state.isAuthenticated) AdminDashboard(state, vm) else AdminLogin(state, vm::updateEmail, vm::updatePassword, vm::signIn) }
    }
}

@Composable
private fun AdminLogin(state: AdminUiState, onEmail: (String) -> Unit, onPassword: (String) -> Unit, onLogin: () -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("HaraftyDz Admin") }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Text("دخول الإدارة", style = MaterialTheme.typography.headlineMedium)
            Text("للحسابات التي تحمل دور admin أو moderator فقط")
            OutlinedTextField(state.email, onEmail, label = { Text("البريد الإداري") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 24.dp))
            OutlinedTextField(state.password, onPassword, label = { Text("كلمة المرور") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 12.dp))
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
            Button(onClick = onLogin, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) { if (state.isLoading) CircularProgressIndicator(strokeWidth = 2.dp) else Text("دخول آمن") }
        }
    }
}

@Composable
private fun AdminDashboard(state: AdminUiState, vm: AdminViewModel) {
    Scaffold(topBar = { TopAppBar(title = { Text("لوحة الإدارة") }, actions = { TextButton(onClick = vm::signOut) { Text("خروج") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            TabRow(selectedTabIndex = state.tab) { Tab(selected = state.tab == 0, onClick = { vm.selectTab(0) }, text = { Text("الخدمات (${state.services.size})") }); Tab(selected = state.tab == 1, onClick = { vm.selectTab(1) }, text = { Text("الطلبات (${state.requests.size})") }) }
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp)) }
            if (state.isLoading && state.services.isEmpty() && state.requests.isEmpty()) CircularProgressIndicator(modifier = Modifier.padding(24.dp))
            if (state.tab == 0) ServicesTab(state.services, vm::setServiceActive) else RequestsTab(state.requests, vm::updateRequestStatus)
        }
    }
}

@Composable
private fun ServicesTab(services: List<AdminServiceRow>, onActive: (String, Boolean) -> Unit) {
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("إدارة الخدمات", style = MaterialTheme.typography.headlineSmall); Text("يمكن للمدير أو المشرف تفعيل الخدمات وإيقافها") }
        if (services.isEmpty()) item { Text("لا توجد خدمات في قاعدة البيانات") }
        items(services, key = { it.id }) { service ->
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) { Text(service.title, style = MaterialTheme.typography.titleMedium); Text("الحرفي: ${service.artisan_id.take(8)}…"); Text(if (service.is_active) "الحالة: نشطة" else "الحالة: متوقفة")
                Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Button(onClick = { onActive(service.id, !service.is_active) }, modifier = Modifier.weight(1f)) { Text(if (service.is_active) "إيقاف" else "تفعيل") }; OutlinedButton(onClick = {}, modifier = Modifier.weight(1f)) { Text("التفاصيل") } }
            } }
        }
    }
}

@Composable
private fun RequestsTab(requests: List<AdminRequestRow>, onStatus: (String, String) -> Unit) {
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("إدارة طلبات الخدمة", style = MaterialTheme.typography.headlineSmall); Text("مراجعة الحالات وتحديثها من الخادم") }
        if (requests.isEmpty()) item { Text("لا توجد طلبات في قاعدة البيانات") }
        items(requests, key = { it.id }) { request ->
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) { Text(request.description, style = MaterialTheme.typography.titleMedium); Text("الحالة الحالية: ${request.status}"); Text("الزبون: ${request.customer_id.take(8)}…")
                Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Button(onClick = { onStatus(request.id, "in_progress") }, modifier = Modifier.weight(1f)) { Text("قيد التنفيذ") }; Button(onClick = { onStatus(request.id, "completed") }, modifier = Modifier.weight(1f)) { Text("مكتمل") }; OutlinedButton(onClick = { onStatus(request.id, "cancelled") }, modifier = Modifier.weight(1f)) { Text("إلغاء") } }
            } }
        }
    }
}
