package com.bioshield.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.bioshield.app.databinding.ActivityLoginBinding
import com.bioshield.app.viewmodel.BioShieldViewModel
import com.google.android.material.snackbar.Snackbar
class LoginActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_ACCESS_TOKEN = "access_token"
        const val EXTRA_USER_ID = "user_id"
    }

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: BioShieldViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            var ipAddress = binding.etIpAddress.text.toString().trim()
            if (ipAddress.isEmpty()) {
                // Default for production
                ipAddress = "https://3.6.92.87:8000/"
                Snackbar.make(binding.root, "Using default production API address.", Snackbar.LENGTH_LONG).show()
            } else if (!ipAddress.startsWith("http://") && !ipAddress.startsWith("https://")) {
                // Help user format the URL correctly
                ipAddress = "http://$ipAddress"
                if (!ipAddress.endsWith(":8000/")) {
                    ipAddress = "$ipAddress:8000/"
                }
                Snackbar.make(binding.root, "Formatted URL to: $ipAddress", Snackbar.LENGTH_SHORT).show()
            }
            com.bioshield.app.network.RetrofitClient.updateBaseUrl(ipAddress)
            
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Snackbar.make(binding.root, "Please fill in all fields", Snackbar.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            showLoading(true)
            viewModel.login(email, password)
        }

        viewModel.loginResult.observe(this) { result ->
            showLoading(false)
            result.onSuccess { loginBody ->
                val intent = Intent(this, MainActivity::class.java).apply {
                    putExtra(EXTRA_ACCESS_TOKEN, loginBody.token)
                    putExtra(EXTRA_USER_ID, loginBody.userId.orEmpty())
                }
                startActivity(intent)
                finish()
            }
            result.onFailure { error ->
                Snackbar.make(binding.root, error.message ?: "Login failed", Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !show
    }
}