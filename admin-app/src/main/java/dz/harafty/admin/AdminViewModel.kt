package dz.harafty.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable data class AdminRoleRow(val user_id: String, val role: String)
@Serializable data class AdminServiceRow(val id: String, val artisan_id: String, val title: String, val description: String? = null, val is_active: Boolean = true)
@Serializable data class AdminRequestRow(val id: String, val customer_id: String, val artisan_id: String? = null, val commune_id: String? = null, val description: String, val status: String = "pending", val created_at: String? = null)
@Serializable data class FinancialTransactionRow(val id: String, val request_id: String? = null, val amount: Double, val currency: String = "DZD", val transaction_type: String, val status: String, val created_at: String? = null)

data class AdminUiState(val email: String = "", val password: String = "", val isAuthenticated: Boolean = false, val isLoading: Boolean = false, val tab: Int = 0, val services: List<AdminServiceRow> = emptyList(), val requests: List<AdminRequestRow> = emptyList(), val transactions: List<FinancialTransactionRow> = emptyList(), val error: String? = null)

class AdminViewModel : ViewModel() {
    private val client = SupabaseClientProvider.client
    private val _state = MutableStateFlow(AdminUiState())
    val state: StateFlow<AdminUiState> = _state.asStateFlow()

    fun updateEmail(v: String) { _state.value = _state.value.copy(email = v, error = null) }
    fun updatePassword(v: String) { _state.value = _state.value.copy(password = v, error = null) }
    fun selectTab(v: Int) { _state.value = _state.value.copy(tab = v) }

    fun signIn() {
        val s = _state.value
        if (s.email.isBlank() || s.password.isBlank()) return failMessage("أدخل بيانات الدخول")
        viewModelScope.launch {
            busy(true)
            runCatching {
                client.auth.signInWith(Email) { email = s.email.trim(); password = s.password }
                val uid = client.auth.currentUserOrNull()?.id ?: error("تعذر تحديد المستخدم")
                val roles = client.from("user_roles").select { filter { eq("user_id", uid) } }.decodeList<AdminRoleRow>()
                if (roles.none { it.role == "admin" || it.role == "moderator" }) error("هذا الحساب لا يملك صلاحية الإدارة")
            }.onSuccess { _state.value = _state.value.copy(isAuthenticated = true, isLoading = false); loadDashboard() }
                .onFailure { runCatching { client.auth.signOut() }; fail(it, "فشل الدخول الإداري") }
        }
    }

    fun loadDashboard() {
        viewModelScope.launch {
            busy(true)
            runCatching {
                val services = client.from("artisan_services").select().decodeList<AdminServiceRow>()
                val requests = client.from("service_requests").select().decodeList<AdminRequestRow>()
                val transactions = client.from("financial_transactions").select().decodeList<FinancialTransactionRow>()
                Triple(services, requests, transactions)
            }.onSuccess { (services, requests, transactions) -> _state.value = _state.value.copy(services = services, requests = requests, transactions = transactions, isLoading = false) }
                .onFailure { fail(it, "تعذر تحميل لوحة الإدارة") }
        }
    }

    fun setServiceActive(id: String, active: Boolean) {
        viewModelScope.launch {
            busy(true)
            runCatching { client.from("artisan_services").update({ set("is_active", active) }) { filter { eq("id", id) } } }
                .onSuccess { loadDashboard() }.onFailure { fail(it, "تعذر تحديث الخدمة") }
        }
    }

    fun updateRequestStatus(id: String, status: String) {
        viewModelScope.launch {
            busy(true)
            runCatching { client.from("service_requests").update({ set("status", status) }) { filter { eq("id", id) } } }
                .onSuccess { loadDashboard() }.onFailure { fail(it, "تعذر تحديث الطلب") }
        }
    }

    fun signOut() { viewModelScope.launch { runCatching { client.auth.signOut() }; _state.value = AdminUiState() } }
    private fun busy(v: Boolean) { _state.value = _state.value.copy(isLoading = v, error = null) }
    private fun failMessage(message: String) { _state.value = _state.value.copy(error = message) }
    private fun fail(error: Throwable, fallback: String) { _state.value = _state.value.copy(isLoading = false, error = error.message ?: fallback) }
}
