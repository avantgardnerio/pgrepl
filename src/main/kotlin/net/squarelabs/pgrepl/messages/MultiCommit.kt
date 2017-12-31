package net.squarelabs.pgrepl.messages

import net.squarelabs.pgrepl.model.ClientTxn

data class MultiCommit constructor(
        val txns: List<ClientTxn>
) {
    val type = "MULTI_COMMIT"
}