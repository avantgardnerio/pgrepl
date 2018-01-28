package net.squarelabs.pgrepl.services

import net.squarelabs.pgrepl.model.*
import javax.inject.Singleton

@Singleton
class ConverterService {
    fun walTxnToClientTxn(lsn: Long, txnId: String, walTxn: Transaction): ClientTxn {
        val changes = walTxn.change.map { walChangeToClientChange(it) }
        return ClientTxn(txnId, lsn, changes)
    }

    private fun walChangeToClientChange(change: Change): ClientChange {
        when (change.kind) {
            "delete" -> return convertDelete(change, change.oldkeys!!)
            "update" -> return convertUpdate(change, change.oldkeys!!)
            "insert" -> return convertInsert(change)
        }
        throw IllegalArgumentException("Unknown change type: ${change.kind}")
    }

    private fun convertInsert(change: Change): ClientChange {
        val record: Map<String, Any> = (0 until maxOf(change.columnnames.size, change.columnvalues.size))
                .associateBy({ change.columnnames[it] }, { change.columnvalues[it] })
        return ClientChange(change.kind.toUpperCase(), change.table, record, null)
    }

    private fun convertUpdate(change: Change, oldKeys: Keys): ClientChange {
        val record: Map<String, Any> = (0 until maxOf(change.columnnames.size, change.columnvalues.size))
                .associateBy({ change.columnnames[it] }, { change.columnvalues[it] })
        val size = maxOf(change.oldkeys!!.keynames.size, oldKeys.keyvalues.size)
        val prior: Map<String, Any> = (0 until size).associateBy({ oldKeys.keynames[it] }, { oldKeys.keyvalues[it] })
        return ClientChange(change.kind.toUpperCase(), change.table, record, prior)
    }

    private fun convertDelete(change: Change, oldkeys: Keys): ClientChange {
        val size = maxOf(change.oldkeys!!.keynames.size, oldkeys.keyvalues.size)
        val prior: Map<String, Any> = (0 until size).associateBy({ oldkeys.keynames[it] }, { oldkeys.keyvalues[it] })
        return ClientChange(change.kind.toUpperCase(), change.table, prior, null)
    }

}