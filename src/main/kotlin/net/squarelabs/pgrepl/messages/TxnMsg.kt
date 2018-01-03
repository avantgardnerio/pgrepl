package net.squarelabs.pgrepl.messages

import net.squarelabs.pgrepl.model.ClientTxn

data class TxnMsg(
        val payload: ClientTxn
) {
    val type = "TXN"
}