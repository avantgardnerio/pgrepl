package net.squarelabs.pgrepl.model

data class SchemaRow(
        val tableName: String,
        val columnName: String,
        val ordinalPosition: Int,
        val columnDefault: String,
        val nullable: Boolean,
        val dataType: String,
        val pkOrdinal: Int
)