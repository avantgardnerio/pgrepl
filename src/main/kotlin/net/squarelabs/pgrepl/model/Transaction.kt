package net.squarelabs.pgrepl.model

data class Transaction(
        val xid: Long,
        val nextlsn: String?,
        val timestamp: String?,
        val clientTxnId: String?,
        val lsn: Long, 
        val change: ArrayList<Change>
)