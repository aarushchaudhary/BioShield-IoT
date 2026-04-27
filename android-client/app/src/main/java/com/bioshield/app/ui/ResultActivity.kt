package com.bioshield.app.ui

import android.R
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.bioshield.app.databinding.ActivityResultBinding

class ResultActivity : AppCompatActivity() {

    private lateinit var binding: ActivityResultBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResultBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val success = intent.getBooleanExtra("success", false)
        val message = intent.getStringExtra("message") ?: ""
        val matchScore = intent.getFloatExtra("matchScore", -1f)

        setupResultScreen(success, message, matchScore)
        startPulseAnimation()

        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun setupResultScreen(success: Boolean, message: String, matchScore: Float) {
        if (success) {
            // GREEN — Access Granted
            binding.resultCard.setCardBackgroundColor(
                ContextCompat.getColor(this, R.color.holo_green_dark)
            )
            binding.tvIcon.text = "🔓"
            binding.tvResultTitle.text = "ACCESS GRANTED"
            binding.btnBack.backgroundTintList =
                ContextCompat.getColorStateList(this, R.color.white)
        } else {
            // RED — Access Denied
            binding.resultCard.setCardBackgroundColor(
                ContextCompat.getColor(this, R.color.holo_red_dark)
            )
            binding.tvIcon.text = "🔒"
            binding.tvResultTitle.text = "ACCESS DENIED"
            binding.btnBack.backgroundTintList =
                ContextCompat.getColorStateList(this, R.color.white)
        }

        binding.tvMessage.text = message

        // Show match score only if available
        if (matchScore > 0) {
            binding.tvMatchScore.text = "Match Score: ${"%.1f".format(matchScore * 100)}%"
        } else {
            binding.tvMatchScore.text = ""
        }
    }

    private fun startPulseAnimation() {
        binding.resultCard.alpha = 0f
        binding.resultCard.scaleX = 0.8f
        binding.resultCard.scaleY = 0.8f

        // Fade + scale in
        binding.resultCard.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(400)
            .withEndAction {
                // Subtle pulse
                binding.resultCard.animate()
                    .scaleX(1.03f)
                    .scaleY(1.03f)
                    .setDuration(150)
                    .withEndAction {
                        binding.resultCard.animate()
                            .scaleX(1f)
                            .scaleY(1f)
                            .setDuration(150)
                            .start()
                    }.start()
            }.start()
    }
}