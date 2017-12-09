package net.squarelabs.pgrepl.messages

import net.squarelabs.pgrepl.model.Transaction

data class TxnMsg(
        val payload: Transaction
) {
    val type = "TXN"
}