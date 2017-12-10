package net.squarelabs.pgrepl.model

data class ClientChange(
        val type: String,
        val table: String,
        val record: Map<String, Any>
)