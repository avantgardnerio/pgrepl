package net.squarelabs.pgrepl.model

data class Transaction(
        val xid: String,
        val change: ArrayList<Change>
)