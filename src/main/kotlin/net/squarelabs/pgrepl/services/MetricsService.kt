package net.squarelabs.pgrepl.services

import com.codahale.metrics.MetricRegistry
import com.codahale.metrics.jmx.JmxReporter
import javax.inject.Singleton


@Singleton
class MetricsService {
    private val metrics = MetricRegistry()
    private val reporter = JmxReporter.forRegistry(metrics).build()

    init {
        reporter.start()
    }

    fun getMetrics(): MetricRegistry {
        return metrics
    }
}