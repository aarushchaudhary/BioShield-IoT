package com.bioshield.app

import android.content.Context
import android.util.Base64
import com.machinezoo.sourceafis.FingerprintImage
import com.machinezoo.sourceafis.FingerprintImageOptions
import com.machinezoo.sourceafis.FingerprintTemplate

object FingerprintHelper {

    fun extractMinutiae(context: Context, filename: String): List<Float> {
        val imageBytes = try {
            context.assets.open("fvc2002/$filename").readBytes()
        } catch (e: Exception) {
            BmpGenerator.generateSampleBmp(context, filename)
        }

        val image = FingerprintImage(imageBytes,
            FingerprintImageOptions().dpi(500.0))
        val template = FingerprintTemplate(image)
        
        return template.toByteArray().map { it.toFloat() }
    }
}