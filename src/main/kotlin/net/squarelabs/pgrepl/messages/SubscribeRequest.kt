package net.squarelabs.pgrepl.messages

data class SubscribeRequest constructor(
        val clientId: String,
        val lsn: Long
) {
    val type = "SUBSCRIBE_REQUEST"
}