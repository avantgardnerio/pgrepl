package net.squarelabs.pgrepl.model

data class ClientTxn(
        val id: String,
        val changes: List<ClientChange>
)