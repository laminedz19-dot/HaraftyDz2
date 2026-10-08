package dz.harafty.client
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.Composable

class MainActivity : ComponentActivity() { override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { ClientApp() } } }
@Composable fun ClientApp() { MaterialTheme { Scaffold(topBar = { TopAppBar(title = { Text("حرفتي DZ") }) }) { p -> Text("تصفح الحرفيين واطلب خدمة", Modifier.padding(p)) } } }
