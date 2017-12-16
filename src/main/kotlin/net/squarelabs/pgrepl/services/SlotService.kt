package net.squarelabs.pgrepl.services

import org.postgresql.replication.LogSequenceNumber
import java.sql.Connection
import java.sql.SQLException
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

// TODO: Make real service
class SlotService(
        conString: String,
        conSvc: ConnectionService
) : AutoCloseable {
    private val con: Connection = conSvc.getConnection(conString)

    private val sqlList = "SELECT * FROM pg_replication_slots;"
    private val sqlCreate = "SELECT * FROM pg_create_logical_replication_slot(?, ?)"
    private val sqlActive = "SELECT active FROM pg_replication_slots WHERE slot_name = ?"
    private val sqlDrop = "SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name = ?"
    private val sqlTerminate = "SELECT pg_terminate_backend(active_pid) FROM pg_replication_slots WHERE active = TRUE AND slot_name = ?"

    fun list(): List<String> {
        con.prepareStatement(sqlList).use {
            it.executeQuery().use {
                val dbNames = mutableListOf<String>()
                while (it.next()) {
                    dbNames.add(it.getString(1))
                }
                return dbNames
            }
        }
    }

    @Throws(SQLException::class, InterruptedException::class, TimeoutException::class)
    fun drop(slotName: String) {
        con.prepareStatement(sqlTerminate).use {
            it.setString(1, slotName)
            it.execute()
        }

        waitStopReplicationSlot(slotName)

        con.prepareStatement(sqlDrop).use {
            it.setString(1, slotName)
            it.execute()
        }
    }

    @Throws(InterruptedException::class, SQLException::class, TimeoutException::class)
    fun create(slotName: String, outputPlugin: String) {
        drop(slotName)

        con.prepareStatement(sqlCreate).use({
            it.setString(1, slotName)
            it.setString(2, outputPlugin)
            it.executeQuery().use({
                while (it.next()) {
                    // TODO: no print
                    println("Slot Name: " + it.getString(1))
                    println("Xlog Position: " + it.getString(2))
                    println("Xlog Long: " + LogSequenceNumber.valueOf(it.getString(2)).asLong())
                }
            })
        })
    }

    // ---------------------------------------- private ---------------------------------------------------------------
    @Throws(InterruptedException::class, TimeoutException::class, SQLException::class)
    private fun waitStopReplicationSlot(slotName: String) {
        val startWaitTime = System.currentTimeMillis()
        var stillActive: Boolean
        var timeInWait: Long = 0

        do {
            stillActive = isReplicationSlotActive(slotName)
            if (stillActive) {
                TimeUnit.MILLISECONDS.sleep(100L)
                timeInWait = System.currentTimeMillis() - startWaitTime
            }
        } while (stillActive && timeInWait <= 30000)

        if (stillActive) throw TimeoutException("Wait stop replication slot $timeInWait timeout occurs")
    }

    @Throws(SQLException::class)
    private fun isReplicationSlotActive(slotName: String): Boolean {
        con.prepareStatement(sqlActive).use {
            it.setString(1, slotName)
            it.executeQuery().use { rs -> return rs.next() && rs.getBoolean(1) }
        }
    }

    override fun close() {
        con.close()
    }
}