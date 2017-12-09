package net.squarelabs.pgrepl.model

data class Snapshot(
        val lsn: Long,
        val tables: List<Table>
)