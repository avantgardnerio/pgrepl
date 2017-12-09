package net.squarelabs.pgrepl.messages

import net.squarelabs.pgrepl.model.Snapshot

data class SnapMsg(
        val payload: Snapshot
) {
    val type = "SNAP"
}