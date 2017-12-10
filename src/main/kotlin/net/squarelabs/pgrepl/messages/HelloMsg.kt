package net.squarelabs.pgrepl.messages

data class HelloMsg constructor(
        val payload: String
) {
    val type = "HELLO"
}