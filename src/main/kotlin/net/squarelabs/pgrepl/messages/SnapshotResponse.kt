package net.squarelabs.pgrepl.messages

import net.squarelabs.pgrepl.model.Snapshot

data class SnapshotResponse(
        val payload: Snapshot
) {
    val type = "SNAPSHOT_RESPONSE"
}