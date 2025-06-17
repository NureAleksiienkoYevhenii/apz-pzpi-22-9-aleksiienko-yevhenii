package com.smartmonitoringapplication.app.utils

import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

object DateUtils {

    const val API_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    const val DISPLAY_DATE_FORMAT = "MMM dd, yyyy"
    const val DISPLAY_TIME_FORMAT = "HH:mm"
    const val DISPLAY_DATETIME_FORMAT = "MMM dd, yyyy HH:mm"
    const val CHART_DATE_FORMAT = "MM/dd"
    const val CHART_TIME_FORMAT = "HH:mm"

    private val apiDateFormatter = SimpleDateFormat(API_DATE_FORMAT, Locale.getDefault()).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    private val displayDateFormatter = SimpleDateFormat(DISPLAY_DATE_FORMAT, Locale.getDefault())
    private val displayTimeFormatter = SimpleDateFormat(DISPLAY_TIME_FORMAT, Locale.getDefault())
    private val displayDateTimeFormatter = SimpleDateFormat(DISPLAY_DATETIME_FORMAT, Locale.getDefault())
    private val chartDateFormatter = SimpleDateFormat(CHART_DATE_FORMAT, Locale.getDefault())
    private val chartTimeFormatter = SimpleDateFormat(CHART_TIME_FORMAT, Locale.getDefault())

    fun parseApiDate(dateString: String): Date? {
        return try {
            apiDateFormatter.parse(dateString)
        } catch (e: Exception) {
            null
        }
    }

    fun formatToApiDate(date: Date): String {
        return apiDateFormatter.format(date)
    }

    fun formatToDisplayDate(date: Date): String {
        return displayDateFormatter.format(date)
    }

    fun formatToDisplayTime(date: Date): String {
        return displayTimeFormatter.format(date)
    }

    fun formatToDisplayDateTime(date: Date): String {
        return displayDateTimeFormatter.format(date)
    }

    fun formatToChartDate(date: Date): String {
        return chartDateFormatter.format(date)
    }

    fun formatToChartTime(date: Date): String {
        return chartTimeFormatter.format(date)
    }

    fun formatApiDateToDisplay(apiDateString: String): String {
        return parseApiDate(apiDateString)?.let { date ->
            formatToDisplayDateTime(date)
        } ?: apiDateString
    }

    fun getRelativeTimeString(date: Date): String {
        val now = Date()
        val diff = now.time - date.time

        return when {
            diff < TimeUnit.MINUTES.toMillis(1) -> "Just now"
            diff < TimeUnit.HOURS.toMillis(1) -> {
                val minutes = TimeUnit.MILLISECONDS.toMinutes(diff)
                "${minutes}m ago"
            }
            diff < TimeUnit.DAYS.toMillis(1) -> {
                val hours = TimeUnit.MILLISECONDS.toHours(diff)
                "${hours}h ago"
            }
            diff < TimeUnit.DAYS.toMillis(7) -> {
                val days = TimeUnit.MILLISECONDS.toDays(diff)
                "${days}d ago"
            }
            else -> formatToDisplayDate(date)
        }
    }

    fun getRelativeTimeStringFromApi(apiDateString: String): String {
        return parseApiDate(apiDateString)?.let { date ->
            getRelativeTimeString(date)
        } ?: apiDateString
    }

    fun getStartOfDay(date: Date): Date {
        val calendar = Calendar.getInstance().apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return calendar.time
    }

    fun getEndOfDay(date: Date): Date {
        val calendar = Calendar.getInstance().apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }
        return calendar.time
    }

    fun getDaysAgo(days: Int): Date {
        val calendar = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, -days)
        }
        return calendar.time
    }

    fun getHoursAgo(hours: Int): Date {
        val calendar = Calendar.getInstance().apply {
            add(Calendar.HOUR_OF_DAY, -hours)
        }
        return calendar.time
    }

    fun isToday(date: Date): Boolean {
        val today = Calendar.getInstance()
        val dateCalendar = Calendar.getInstance().apply { time = date }

        return today.get(Calendar.YEAR) == dateCalendar.get(Calendar.YEAR) &&
                today.get(Calendar.DAY_OF_YEAR) == dateCalendar.get(Calendar.DAY_OF_YEAR)
    }

    fun isYesterday(date: Date): Boolean {
        val yesterday = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, -1)
        }
        val dateCalendar = Calendar.getInstance().apply { time = date }

        return yesterday.get(Calendar.YEAR) == dateCalendar.get(Calendar.YEAR) &&
                yesterday.get(Calendar.DAY_OF_YEAR) == dateCalendar.get(Calendar.DAY_OF_YEAR)
    }
}