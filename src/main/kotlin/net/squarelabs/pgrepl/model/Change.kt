package net.squarelabs.pgrepl.model

data class Change(
        val kind: String,
        val table: String,
        val columnnames: ArrayList<String>,
        val columnvalues: ArrayList<Any>,
        val oldkeys: Keys?
)