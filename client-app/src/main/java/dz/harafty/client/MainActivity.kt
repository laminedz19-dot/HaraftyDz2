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

class MainActivity : ComponentActivity() { override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { ClientApp() } } }

@Composable
fun ClientApp(vm: ClientViewModel = viewModel()) {
    val state by vm.state.collectAsState()
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme {
            if (!state.isAuthenticated && !state.isGuest) AuthScreen(state, vm::updateEmail, vm::updatePassword, vm::updateDisplayName, vm::updatePhone, { if (state.isRegisterMode) vm.signUp() else vm.signIn() }, { vm.setRegisterMode(!state.isRegisterMode) }, vm::browseAsGuest)
            else ClientServicesScreen(state, vm::loadServices, vm::signOut, vm::updateDisplayName, vm::updatePhone, vm::saveProfile)
        }
    }
}

@Composable
private fun AuthScreen(state: ClientUiState, onEmail: (String) -> Unit, onPassword: (String) -> Unit, onName: (String) -> Unit, onPhone: (String) -> Unit, onSubmit: () -> Unit, onToggle: () -> Unit, onGuest: () -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("حرفتي DZ") }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Text(if (state.isRegisterMode) "إنشاء حساب جديد" else "مرحبًا بك", style = MaterialTheme.typography.headlineMedium)
            if (state.isRegisterMode) {
                OutlinedTextField(state.displayName, onName, label = { Text("الاسم الكامل") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 20.dp))
                OutlinedTextField(state.phone, onPhone, label = { Text("رقم الهاتف (اختياري)") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
            }
            OutlinedTextField(state.email, onEmail, label = { Text("البريد الإلكتروني") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
            OutlinedTextField(state.password, onPassword, label = { Text("كلمة المرور") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
            state.error?.let { Text(it, color = if (it.startsWith("تم")) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
            Button(onClick = onSubmit, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) { if (state.isLoading) CircularProgressIndicator(strokeWidth = 2.dp) else Text(if (state.isRegisterMode) "إنشاء الحساب" else "تسجيل الدخول") }
            TextButton(onClick = onToggle) { Text(if (state.isRegisterMode) "لديك حساب؟ سجّل الدخول" else "ليس لديك حساب؟ أنشئ حسابًا") }
            OutlinedButton(onClick = onGuest, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) { Text("التصفح بدون تسجيل") }
        }
    }
}

@Composable
private fun ClientServicesScreen(state: ClientUiState, onRefresh: () -> Unit, onLogout: () -> Unit, onName: (String) -> Unit, onPhone: (String) -> Unit, onSave: () -> Unit) {
    var profileOpen by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
    if (profileOpen) {
        ProfileScreen(state, onName, onPhone, onSave, { profileOpen = false }, onLogout)
        return
    }
    Scaffold(topBar = { TopAppBar(title = { Text("الخدمات المتاحة") }, actions = { if (state.isGuest) TextButton(onClick = onLogout) { Text("دخول") } else { TextButton(onClick = { profileOpen = true }) { Text("ملفي") }; TextButton(onClick = onLogout) { Text("خروج") } } }) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { if (state.isGuest) Text("أنت تتصفح كزائر — سجّل الدخول لطلب الخدمة", color = MaterialTheme.colorScheme.primary); Text("الخدمات المنشورة", style = MaterialTheme.typography.titleLarge); OutlinedButton(onClick = onRefresh, enabled = !state.isLoading, modifier = Modifier.padding(top = 8.dp)) { Text("تحديث الخدمات") } }
            state.error?.let { item { Text(it, color = MaterialTheme.colorScheme.error) } }
            if (state.isLoading && state.services.isEmpty()) item { CircularProgressIndicator(modifier = Modifier.padding(24.dp)) }
            if (!state.isLoading && state.services.isEmpty()) item { Text("لا توجد خدمات منشورة حاليًا") }
            items(state.services, key = { it.id }) { service -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) { Text(service.title, style = MaterialTheme.typography.titleMedium); service.description?.let { Text(it) }; Text("الحرفي: ${service.artisan_id.take(8)}…"); Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) { Text(formatPrice(service.price_min, service.price_max)); Button(onClick = {}, enabled = !state.isGuest) { Text(if (state.isGuest) "سجّل الدخول للطلب" else "طلب الخدمة") } } } } }
        }
    }
}

@Composable
private fun ProfileScreen(state: ClientUiState, onName: (String) -> Unit, onPhone: (String) -> Unit, onSave: () -> Unit, onBack: () -> Unit, onLogout: () -> Unit) {
    Scaffold(topBar = { TopAppBar(title = { Text("ملفي الشخصي") }, navigationIcon = { TextButton(onClick = onBack) { Text("رجوع") } }, actions = { TextButton(onClick = onLogout) { Text("خروج") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(24.dp)) {
            Text("بيانات الحساب", style = MaterialTheme.typography.headlineSmall)
            OutlinedTextField(state.displayName, onName, label = { Text("الاسم الكامل") }, modifier = Modifier.fillMaxWidth().padding(top = 20.dp), singleLine = true)
            OutlinedTextField(state.phone, onPhone, label = { Text("رقم الهاتف") }, modifier = Modifier.fillMaxWidth().padding(top = 12.dp), singleLine = true)
            Text(state.email, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 12.dp))
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 12.dp)) }
            Button(onClick = onSave, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) { Text("حفظ التغييرات") }
        }
    }
}

private fun formatPrice(min: Double?, max: Double?): String = when { min != null && max != null -> "${min.toInt()} – ${max.toInt()} دج"; min != null -> "ابتداءً من ${min.toInt()} دج"; else -> "السعر عند الطلب" }
