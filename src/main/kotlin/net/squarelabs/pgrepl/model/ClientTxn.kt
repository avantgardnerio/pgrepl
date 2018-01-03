package net.squarelabs.pgrepl.model

data class ClientTxn(
        val id: String,
        val lsn: Long,
        val changes: List<ClientChange>
)