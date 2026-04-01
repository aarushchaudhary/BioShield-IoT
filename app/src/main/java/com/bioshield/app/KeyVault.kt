package com.bioshield.app

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.SecureRandom

object KeyVault {

    private const val PREFS_NAME = "bioshield_vault"
    private const val KEY_PREFIX = "user_key_"

    // Get or create encrypted shared prefs
    private fun getEncryptedPrefs(context: Context) =
        EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build(),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

    // Generate a new random key for user (on enroll)
    fun generateKey(context: Context, userId: String): Long {
        val seed = SecureRandom().nextLong()
        getEncryptedPrefs(context)
            .edit()
            .putLong("$KEY_PREFIX$userId", seed)
            .apply()
        return seed
    }

    // Get existing key for user (on verify)
    fun getKey(context: Context, userId: String): Long? {
        val prefs = getEncryptedPrefs(context)
        return if (prefs.contains("$KEY_PREFIX$userId")) {
            prefs.getLong("$KEY_PREFIX$userId", 0L)
        } else null
    }

    // Cancel key (on cancel — old template becomes useless)
    fun cancelKey(context: Context, userId: String) {
        getEncryptedPrefs(context)
            .edit()
            .remove("$KEY_PREFIX$userId")
            .apply()
    }

    // Check if user has a key (is enrolled)
    fun isEnrolled(context: Context, userId: String): Boolean {
        return getEncryptedPrefs(context).contains("$KEY_PREFIX$userId")
    }
}