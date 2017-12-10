package net.squarelabs.pgrepl.messages

import net.squarelabs.pgrepl.model.ClientTxn

data class CommitMsg constructor(
        val txn: ClientTxn
) {
    val type = "HELLO"
}