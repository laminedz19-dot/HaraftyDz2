package dz.harafty.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.Image
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() { override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { AdminApp() } } }

@Composable
fun AdminApp(vm: AdminViewModel = viewModel()) {
    var showSplash by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(true) }
    LaunchedEffect(Unit) { delay(5000); showSplash = false }
    if (showSplash) { SplashScreen(); return }
    val state by vm.state.collectAsState()
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme { if (state.isAuthenticated) AdminDashboard(state, vm) else AdminLogin(state, vm::updateEmail, vm::updatePassword, vm::signIn) }
    }
}

@Composable
private fun SplashScreen() {
    androidx.compose.foundation.layout.Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(id = R.drawable.haraftydz_logo),
                contentDescription = "شعار HaraftyDz",
                modifier = Modifier.fillMaxWidth().padding(28.dp),
                contentScale = ContentScale.Fit
            )
            Text(
                "برمجة راهم محمد لمين",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
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
            TabRow(selectedTabIndex = state.tab) { Tab(selected = state.tab == 0, onClick = { vm.selectTab(0) }, text = { Text("الخدمات (${state.services.size})") }); Tab(selected = state.tab == 1, onClick = { vm.selectTab(1) }, text = { Text("الطلبات (${state.requests.size})") }); Tab(selected = state.tab == 2, onClick = { vm.selectTab(2) }, text = { Text("الإحصائيات") }) }
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp)) }
            if (state.isLoading && state.services.isEmpty() && state.requests.isEmpty()) CircularProgressIndicator(modifier = Modifier.padding(24.dp))
            if (state.tab == 0) ServicesTab(state.services, vm::setServiceActive) else if (state.tab == 1) RequestsTab(state.requests, vm::updateRequestStatus) else StatisticsTab(state)
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

@Composable
private fun StatisticsTab(state: AdminUiState) {
    val completedRequests = state.requests.count { it.status == "completed" }
    val pendingRequests = state.requests.count { it.status == "pending" }
    val activeServices = state.services.count { it.is_active }
    val completedPayments = state.transactions.filter { it.status == "completed" && it.transaction_type == "service_payment" }
    val totalRevenue = completedPayments.sumOf { it.amount }
    val refunds = state.transactions.filter { it.status == "refunded" }.sumOf { it.amount }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("الإحصائيات والتقارير المالية", style = MaterialTheme.typography.headlineSmall); Text("مؤشرات محسوبة من البيانات الموجودة في Supabase") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MetricCard("الخدمات النشطة", activeServices.toString(), Modifier.weight(1f))
                MetricCard("الطلبات المكتملة", completedRequests.toString(), Modifier.weight(1f))
                MetricCard("قيد الانتظار", pendingRequests.toString(), Modifier.weight(1f))
            }
        }
        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("التقرير المالي — الدينار الجزائري", style = MaterialTheme.typography.titleLarge)
                    Text("الإيرادات المكتملة: ${formatDzd(totalRevenue)} دج", modifier = Modifier.padding(top = 10.dp))
                    Text("المبالغ المسترجعة: ${formatDzd(refunds)} دج")
                    Text("المعاملات المكتملة: ${completedPayments.size}")
                    Text("لا يتم احتساب أي مبلغ غير مسجل في financial_transactions.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp))
                }
            }
        }
        item { Text("آخر المعاملات", style = MaterialTheme.typography.titleLarge) }
        if (state.transactions.isEmpty()) item { Text("لا توجد معاملات مالية مسجلة حتى الآن") }
        items(state.transactions.take(20), key = { it.id }) { tx ->
            Card(Modifier.fillMaxWidth()) { Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) { Column { Text(tx.transaction_type); Text("الحالة: ${tx.status}") }; Text("${formatDzd(tx.amount)} ${tx.currency}") } }
        }
    }
}

@Composable
private fun MetricCard(label: String, value: String, modifier: Modifier) { Card(modifier) { Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value, style = MaterialTheme.typography.titleLarge); Text(label) } } }
private fun formatDzd(value: Double): String = "%,.2f".format(java.util.Locale.US, value)
