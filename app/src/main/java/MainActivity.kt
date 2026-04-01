package com.bioshield.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.bioshield.app.BioHasher
import com.bioshield.app.BmpGenerator
import com.bioshield.app.FingerprintHelper
import com.bioshield.app.KeyVault
import com.bioshield.app.databinding.ActivityMainBinding
import com.bioshield.app.viewmodel.BioShieldViewModel
import com.google.android.material.snackbar.Snackbar

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: BioShieldViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.tvUserId.text = "User: ${viewModel.userId}"
        updateStatus()

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
                viewModel.isEnrolled = response.success
                updateStatus()
                navigateToResult(response.success, response.message, null)
            }
            result.onFailure { error ->
                navigateToResult(false, error.message ?: "Enroll failed", null)
            }
        }

        viewModel.verifyResult.observe(this) { result ->
            showLoading(false)
            result.onSuccess { response ->
                navigateToResult(response.success, response.message, response.matchScore)
            }
            result.onFailure { error ->
                navigateToResult(false, error.message ?: "Verify failed", null)
            }
        }

        viewModel.cancelResult.observe(this) { result ->
            showLoading(false)
            result.onSuccess { response ->
                if (response.success) viewModel.isEnrolled = false
                updateStatus()
                navigateToResult(response.success, response.message, null)
            }
            result.onFailure { error ->
                navigateToResult(false, error.message ?: "Cancel failed", null)
            }
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
            val bioHash = FingerprintHelper.extractAndHash(
                context = this,
                filename = "101_1.bmp",
                userId = viewModel.userId,
                isEnrolling = true
            )
            viewModel.enroll(bioHash)
        } catch (e: Exception) {
            showLoading(false)
            Snackbar.make(binding.root, "Error: ${e.message}",
                Snackbar.LENGTH_LONG).show()
        }
    }

    private fun performVerify() {
        showLoading(true)
        try {
            val bioHash = FingerprintHelper.extractAndHash(
                context = this,
                filename = "101_2.bmp",
                userId = viewModel.userId,
                isEnrolling = false
            )
            viewModel.verify(bioHash)
        } catch (e: Exception) {
            showLoading(false)
            Snackbar.make(binding.root, "Error: ${e.message}",
                Snackbar.LENGTH_LONG).show()
        }
    }

    private fun performCancel() {
        showLoading(true)
        KeyVault.cancelKey(this, viewModel.userId)
        viewModel.cancel()
    }

    private fun updateStatus() {
        val enrolled = KeyVault.isEnrolled(this, viewModel.userId)
        if (enrolled) {
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