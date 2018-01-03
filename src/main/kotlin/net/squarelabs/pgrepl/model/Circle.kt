package net.squarelabs.pgrepl.model

import javax.persistence.Table

@Table(name = "circles")
data class Circle(
        val id: String,
        val cx: Int,
        val cy: Int,
        val r: Int,
        val stroke: String,
        val strokeWidth: String,
        val fill: String,
        val curTxnId: String,
        val prvTxnId: String?
)