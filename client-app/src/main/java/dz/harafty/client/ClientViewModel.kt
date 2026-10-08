package dz.harafty.client

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.jan.supabase.auth.providers.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class ServiceRow(val id: String, val artisan_id: String, val title: String, val description: String? = null, val price_min: Double? = null, val price_max: Double? = null, val is_active: Boolean = true)

@Serializable
data class ProfileRow(val id: String, val display_name: String, val phone: String? = null, val locale: String = "ar", val is_active: Boolean = true)

data class ClientUiState(
    val email: String = "", val password: String = "", val displayName: String = "", val phone: String = "",
    val isRegisterMode: Boolean = false, val isAuthenticated: Boolean = false, val isGuest: Boolean = false, val isLoading: Boolean = false,
    val services: List<ServiceRow> = emptyList(), val error: String? = null
)

class ClientViewModel : ViewModel() {
    private val client = SupabaseClientProvider.client
    private val _state = MutableStateFlow(ClientUiState())
    val state: StateFlow<ClientUiState> = _state.asStateFlow()

    init { if (client.auth.currentSessionOrNull() != null) { _state.value = _state.value.copy(isAuthenticated = true); loadProfile(); loadServices() } }

    fun updateEmail(v: String) { _state.value = _state.value.copy(email = v, error = null) }
    fun updatePassword(v: String) { _state.value = _state.value.copy(password = v, error = null) }
    fun updateDisplayName(v: String) { _state.value = _state.value.copy(displayName = v, error = null) }
    fun updatePhone(v: String) { _state.value = _state.value.copy(phone = v, error = null) }
    fun setRegisterMode(v: Boolean) { _state.value = _state.value.copy(isRegisterMode = v, error = null) }
    fun browseAsGuest() { _state.value = _state.value.copy(isGuest = true, error = null); loadServices() }

    fun signIn() {
        val s = _state.value
        if (s.email.isBlank() || s.password.isBlank()) return showError("أدخل البريد الإلكتروني وكلمة المرور")
        viewModelScope.launch {
            busy(true)
            runCatching { client.auth.signInWith(Email) { email = s.email.trim(); password = s.password } }
                .onSuccess { _state.value = _state.value.copy(isAuthenticated = true, isGuest = false, isLoading = false); loadProfile(); loadServices() }
                .onFailure { fail(it, "تعذر تسجيل الدخول") }
        }
    }

    fun signUp() {
        val s = _state.value
        if (s.email.isBlank() || s.password.length < 6 || s.displayName.isBlank()) return showError("أدخل الاسم والبريد وكلمة مرور من 6 أحرف على الأقل")
        viewModelScope.launch {
            busy(true)
            runCatching {
                client.auth.signUpWith(Email) { email = s.email.trim(); password = s.password }
                val user = client.auth.currentUserOrNull() ?: throw IllegalStateException("تم إنشاء الحساب. تحقق من بريدك الإلكتروني ثم سجّل الدخول.")
                client.from("profiles").insert(ProfileRow(user.id, s.displayName.trim(), s.phone.ifBlank { null }))
            }.onSuccess {
                _state.value = _state.value.copy(isAuthenticated = true, isRegisterMode = false, isLoading = false, error = null)
                loadServices()
            }.onFailure { fail(it, "تعذر إنشاء الحساب") }
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            val userId = client.auth.currentUserOrNull()?.id ?: return@launch
            runCatching { client.from("profiles").select { filter { eq("id", userId) } }.decodeList<ProfileRow>().firstOrNull() }
                .onSuccess { p -> if (p != null) _state.value = _state.value.copy(displayName = p.display_name, phone = p.phone.orEmpty()) }
        }
    }

    fun saveProfile() {
        viewModelScope.launch {
            val userId = client.auth.currentUserOrNull()?.id ?: return@launch
            busy(true)
            runCatching {
                client.from("profiles").update({ set("display_name", _state.value.displayName.trim()); set("phone", _state.value.phone.ifBlank { null }) }) { filter { eq("id", userId) } }
            }.onSuccess { _state.value = _state.value.copy(isLoading = false, error = "تم حفظ الملف الشخصي") }
                .onFailure { fail(it, "تعذر حفظ الملف الشخصي") }
        }
    }

    fun loadServices() {
        viewModelScope.launch {
            busy(true)
            runCatching { client.from("artisan_services").select { filter { eq("is_active", true) } }.decodeList<ServiceRow>() }
                .onSuccess { _state.value = _state.value.copy(services = it, isLoading = false) }
                .onFailure { fail(it, "تعذر جلب الخدمات") }
        }
    }

    fun signOut() { viewModelScope.launch { runCatching { client.auth.signOut() }; _state.value = ClientUiState() } }
    private fun busy(v: Boolean) { _state.value = _state.value.copy(isLoading = v, error = null) }
    private fun showError(message: String) { _state.value = _state.value.copy(error = message) }
    private fun fail(error: Throwable, fallback: String) { _state.value = _state.value.copy(isLoading = false, error = error.message ?: fallback) }
}
