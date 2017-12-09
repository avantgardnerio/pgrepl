package net.squarelabs.pgrepl.model

data class Table(
        val name: String,
        val columns: ArrayList<Column>,
        val rows: ArrayList<Row>
)