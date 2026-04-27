package com.bioshield.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import java.io.ByteArrayOutputStream

object BmpGenerator {

    fun generateSampleBmp(context: Context, filename: String): ByteArray {
        // Create a 300x300 bitmap with fingerprint-like ridges
        val width = 300
        val height = 300
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint()

        // White background
        canvas.drawColor(Color.WHITE)

        // Draw ridge-like lines
        paint.color = Color.BLACK
        paint.strokeWidth = 2f
        paint.isAntiAlias = true

        // Use filename as seed for different patterns
        val seed = filename.hashCode()
        val offset = Math.abs(seed % 10)

        for (i in 0..30) {
            val y = i * 10f + offset
            paint.strokeWidth = if (i % 2 == 0) 2f else 1f
            canvas.drawLine(0f, y, width.toFloat(), y + 20f, paint)
        }

        // Convert to PNG bytes (SourceAFIS supports PNG)
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        return stream.toByteArray()
    }
}