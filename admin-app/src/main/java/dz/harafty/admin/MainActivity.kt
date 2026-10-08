package dz.harafty.admin
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.Composable

class MainActivity : ComponentActivity() { override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { AdminApp() } } }
@Composable fun AdminApp() { MaterialTheme { Scaffold(topBar = { TopAppBar(title = { Text("HaraftyDz Admin") }) }) { p -> Text("الدخول الإداري المصرّح به فقط", Modifier.padding(p)) } } }
