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
data class ServiceRow(
    val id: String,
    val artisan_id: String,
    val title: String,
    val description: String? = null,
    val price_min: Double? = null,
    val price_max: Double? = null,
    val is_active: Boolean = true
)

data class ClientUiState(
    val email: String = "",
    val password: String = "",
    val isAuthenticated: Boolean = false,
    val isLoading: Boolean = false,
    val services: List<ServiceRow> = emptyList(),
    val error: String? = null
)

class ClientViewModel : ViewModel() {
    private val client = SupabaseClientProvider.client
    private val _state = MutableStateFlow(ClientUiState())
    val state: StateFlow<ClientUiState> = _state.asStateFlow()

    init {
        if (client.auth.currentSessionOrNull() != null) {
            _state.value = _state.value.copy(isAuthenticated = true)
            loadServices()
        }
    }

    fun updateEmail(value: String) { _state.value = _state.value.copy(email = value, error = null) }
    fun updatePassword(value: String) { _state.value = _state.value.copy(password = value, error = null) }

    fun signIn() {
        val current = _state.value
        if (current.email.isBlank() || current.password.isBlank()) {
            _state.value = current.copy(error = "أدخل البريد الإلكتروني وكلمة المرور")
            return
        }
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            runCatching {
                client.auth.signInWith(Email) {
                    email = current.email.trim()
                    password = current.password
                }
            }.onSuccess {
                _state.value = _state.value.copy(isAuthenticated = true, isLoading = false)
                loadServices()
            }.onFailure { error ->
                _state.value = _state.value.copy(isLoading = false, error = error.message ?: "تعذر تسجيل الدخول")
            }
        }
    }

    fun loadServices() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            runCatching {
                client.from("artisan_services").select {
                    filter { eq("is_active", true) }
                }.decodeList<ServiceRow>()
            }.onSuccess { services ->
                _state.value = _state.value.copy(services = services, isLoading = false)
            }.onFailure { error ->
                _state.value = _state.value.copy(isLoading = false, error = error.message ?: "تعذر جلب الخدمات")
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { client.auth.signOut() }
            _state.value = ClientUiState()
        }
    }
}
