package com.bioshield.app.ui

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.bioshield.app.BmpGenerator
import com.bioshield.app.FingerprintHelper
import com.bioshield.app.databinding.ActivityMainBinding
import com.bioshield.app.network.RetrofitClient
import com.bioshield.app.viewmodel.BioShieldViewModel
import com.google.android.material.snackbar.Snackbar

class MainActivity : AppCompatActivity() {

    companion object {
        // Default credentials for demo
        private const val DEFAULT_API_URL = "https://3.6.92.87:8000/"  // Production API server
        private const val DEFAULT_EMAIL = "test@example.com"
        private const val DEFAULT_PASSWORD = "password123"
        private const val PREFS_NAME = "BioShieldPrefs"
        private const val API_URL_KEY = "api_url"
    }

    private lateinit var binding: ActivityMainBinding
    private val viewModel: BioShieldViewModel by viewModels()
    private lateinit var sharedPreferences: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize SharedPreferences
        sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        
        // Load saved API URL or use default
        val savedApiUrl = sharedPreferences.getString(API_URL_KEY, DEFAULT_API_URL) ?: DEFAULT_API_URL
        binding.etApiUrl.setText(savedApiUrl)
        
        // Initialize API URL with saved or default
        RetrofitClient.updateBaseUrl(savedApiUrl)
        
        // Handle save URL button
        binding.btnSaveUrl.setOnClickListener {
            saveApiUrl()
        }
        
        // Handle test connection button
        binding.btnTestConnection.setOnClickListener {
            testConnection()
        }
        
        // Auto-login with default credentials
        viewModel.login(DEFAULT_EMAIL, DEFAULT_PASSWORD)
        
        // Test connection on startup
        testConnection()
        // Handle login response
        viewModel.loginResult.observe(this) { result ->
            result.onSuccess { loginBody ->
                // Token is automatically set by viewModel.login()
                // Update UI with the correct user ID from login response
                binding.tvUserId.text = "User: ${viewModel.userId}"
                updateStatus()
                Snackbar.make(binding.root, "Logged in successfully", Snackbar.LENGTH_SHORT).show()
            }
            result.onFailure { error ->
                Snackbar.make(binding.root, "Login failed: ${error.message}", Snackbar.LENGTH_LONG).show()
            }
        }
        binding.cardEnroll.setOnClickListener {
            showBiometricPrompt("Enroll Fingerprint") { performEnroll() }
        }

        binding.cardVerify.setOnClickListener {
            showBiometricPrompt("Verify Fingerprint") { performVerify() }
        }

        binding.cardCancel.setOnClickListener {
            showBiometricPrompt("Cancel Template") { performCancel() }
        }

        viewModel.enrollResult.observe(this) { result ->
            showLoading(false)
            result.onSuccess { response ->
                viewModel.isEnrolled = response.status == "success"
                updateStatus()
                navigateToResult(response.status == "success", response.message, null)
            }
            result.onFailure { error ->
                navigateToResult(false, error.message ?: "Enroll failed", null)
            }
        }

        viewModel.verifyResult.observe(this) { result ->
            showLoading(false)
            result.onSuccess { response ->
                val color = if (response.isMatch) android.R.color.holo_green_light else android.R.color.holo_red_light
                binding.ledIndicator.setCardBackgroundColor(ContextCompat.getColor(this, color))

                navigateToResult(response.isMatch, response.message, response.matchScore)
            }
            result.onFailure { error ->
                binding.ledIndicator.setCardBackgroundColor(ContextCompat.getColor(this, android.R.color.holo_red_light))
                navigateToResult(false, error.message ?: "Verify failed", null)
            }
        }

        viewModel.cancelResult.observe(this) { result ->
            showLoading(false)
            result.onSuccess { response ->
                if (response.status == "success") viewModel.isEnrolled = false
                updateStatus()
                navigateToResult(response.status == "success", response.message, null)
            }
            result.onFailure { error ->
                navigateToResult(false, error.message ?: "Cancel failed", null)
            }
        }
    }
    
    private fun saveApiUrl() {
        val url = binding.etApiUrl.text.toString().trim()
        
        if (url.isEmpty()) {
            Snackbar.make(binding.root, "URL cannot be empty", Snackbar.LENGTH_SHORT).show()
            return
        }
        
        // Basic URL validation
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            Snackbar.make(binding.root, "URL must start with http:// or https://", Snackbar.LENGTH_SHORT).show()
            return
        }
        
        // Ensure URL ends with /
        val finalUrl = if (url.endsWith("/")) url else "$url/"
        binding.etApiUrl.setText(finalUrl)
        
        // Save to SharedPreferences
        sharedPreferences.edit().putString(API_URL_KEY, finalUrl).apply()
        
        // Update RetrofitClient
        RetrofitClient.updateBaseUrl(finalUrl)
        
        // Re-login with the new URL
        viewModel.login(DEFAULT_EMAIL, DEFAULT_PASSWORD)
        
        Snackbar.make(binding.root, "API URL saved: $finalUrl", Snackbar.LENGTH_SHORT).show()
    }
    
    private fun testConnection() {
        val url = binding.etApiUrl.text.toString().trim()
        
        if (url.isEmpty()) {
            updateConnectionStatus(false, "URL not set")
            return
        }
        
        // Show testing status
        binding.tvConnectionStatus.text = "TESTING..."
        binding.tvConnectionStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_orange_light))
        
        // Launch a coroutine to test the connection
        Thread {
            try {
                val testUrl = if (url.endsWith("/")) url else "$url/"
                RetrofitClient.updateBaseUrl(testUrl)
                
                // Test with health endpoint using synchronous call
                val api = RetrofitClient.getApiService()
                val response = api.healthSync().execute()
                
                if (response.isSuccessful) {
                    runOnUiThread {
                        updateConnectionStatus(true, "CONNECTED")
                    }
                } else {
                    runOnUiThread {
                        updateConnectionStatus(false, "CONNECTION FAILED")
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    updateConnectionStatus(false, "ERROR: ${e.message?.take(20)}")
                }
            }
        }.start()
    }
    
    private fun updateConnectionStatus(isConnected: Boolean, statusText: String) {
        if (isConnected) {
            binding.tvConnectionStatus.text = statusText
            binding.tvConnectionStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_light))
            binding.connectionStatusDot.setBackgroundColor(ContextCompat.getColor(this, android.R.color.holo_green_light))
            Snackbar.make(binding.root, "✓ $statusText", Snackbar.LENGTH_SHORT).show()
        } else {
            binding.tvConnectionStatus.text = statusText
            binding.tvConnectionStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_light))
            binding.connectionStatusDot.setBackgroundColor(ContextCompat.getColor(this, android.R.color.holo_red_light))
            Snackbar.make(binding.root, "✗ $statusText", Snackbar.LENGTH_SHORT).show()
        }
    }

    private fun showBiometricPrompt(subtitle: String, onSuccess: () -> Unit) {
        val executor = ContextCompat.getMainExecutor(this)
        val biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(
                    result: BiometricPrompt.AuthenticationResult
                ) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess()
                }
                override fun onAuthenticationError(
                    errorCode: Int, errString: CharSequence
                ) {
                    super.onAuthenticationError(errorCode, errString)
                    Snackbar.make(binding.root, "Auth error: $errString",
                        Snackbar.LENGTH_SHORT).show()
                }
                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Snackbar.make(binding.root, "Authentication failed",
                        Snackbar.LENGTH_SHORT).show()
                }
            })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("BioShield IoT")
            .setSubtitle(subtitle)
            .setNegativeButtonText("Cancel")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    private fun performEnroll() {
        showLoading(true)
        try {
            val featureVector = FingerprintHelper.extractMinutiae(
                context = this,
                filename = "101_1.bmp"
            )
            viewModel.enroll(featureVector)
        } catch (e: Exception) {
            showLoading(false)
            Snackbar.make(binding.root, "Error: ${e.message}",
                Snackbar.LENGTH_LONG).show()
        }
    }

    private fun performVerify() {
        showLoading(true)
        try {
            val featureVector = FingerprintHelper.extractMinutiae(
                context = this,
                filename = "101_2.bmp"
            )
            viewModel.verify(featureVector)
        } catch (e: Exception) {
            showLoading(false)
            Snackbar.make(binding.root, "Error: ${e.message}",
                Snackbar.LENGTH_LONG).show()
        }
    }

    private fun performCancel() {
        showLoading(true)
        viewModel.cancel()
    }

    private fun updateStatus() {
        if (viewModel.isEnrolled) {
            binding.tvStatus.text = "● Enrolled"
            binding.tvStatus.setTextColor(
                ContextCompat.getColor(this, android.R.color.holo_green_light)
            )
        } else {
            binding.tvStatus.text = "● Not Enrolled"
            binding.tvStatus.setTextColor(
                ContextCompat.getColor(this, android.R.color.holo_red_light)
            )
        }
    }

    private fun navigateToResult(success: Boolean, message: String, matchScore: Float?) {
        val intent = Intent(this, ResultActivity::class.java).apply {
            putExtra("success", success)
            putExtra("message", message)
            putExtra("matchScore", matchScore ?: -1f)
        }
        startActivity(intent)
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
    }
}