package net.squarelabs.pgrepl.messages

data class SubscribeResponse constructor(
        val errorMessage: String?
) {
    val type = "SUBSCRIBE_RESPONSE"
}