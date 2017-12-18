package net.squarelabs.pgrepl.model

data class Change(
        val kind: String,
        val schema: String,
        val table: String,
        val columnnames: ArrayList<String>,
        val columntypes: ArrayList<String>,
        val columnvalues: ArrayList<Any>,
        val oldkeys: Keys?
)