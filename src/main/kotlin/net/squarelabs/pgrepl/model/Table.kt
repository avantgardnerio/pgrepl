package net.squarelabs.pgrepl.model

data class Table(
        val name: String,
        val columns: List<Column>,
        val rows: List<Row>
)