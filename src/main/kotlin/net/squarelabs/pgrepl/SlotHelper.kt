package net.squarelabs.pgrepl

import java.sql.Connection
import java.sql.DriverManager
import java.sql.SQLException
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

class SlotHelper(conString: String) : AutoCloseable {
    private val con: Connection = DriverManager.getConnection(conString);

    val SQL_LIST = "select * from pg_replication_slots;";
    val SQL_CREATE = "SELECT * FROM pg_create_logical_replication_slot(?, ?)";
    val SQL_ACTIVE = "select active from pg_replication_slots where slot_name = ?";
    val SQL_DROP = "select pg_drop_replication_slot(slot_name) from pg_replication_slots where slot_name = ?";
    val SQL_TERMINATE = "select pg_terminate_backend(active_pid) from pg_replication_slots where active = true and slot_name = ?";

    fun list(): List<String> {
        con.prepareStatement(SQL_LIST).use {
            it.executeQuery().use {
                val dbNames = mutableListOf<String>();
                while (it.next()) {
                    dbNames.add(it.getString(1));
                }
                return dbNames;
            }
        }
    }

    @Throws(SQLException::class, InterruptedException::class, TimeoutException::class)
    fun drop(slotName: String) {
        con.prepareStatement(SQL_TERMINATE).use {
            it.setString(1, slotName)
            it.execute()
        }

        waitStopReplicationSlot(slotName)

        con.prepareStatement(SQL_DROP).use {
            it.setString(1, slotName)
            it.execute()
        }
    }

    @Throws(InterruptedException::class, SQLException::class, TimeoutException::class)
    fun create(slotName: String, outputPlugin: String) {
        drop(slotName)

        con.prepareStatement(SQL_CREATE).use({
            it.setString(1, slotName)
            it.setString(2, outputPlugin)
            it.executeQuery().use({
                while (it.next()) {
                    // TODO: no print
                    println("Slot Name: " + it.getString(1))
                    println("Xlog Position: " + it.getString(2))
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
        con.prepareStatement(SQL_ACTIVE).use {
            it.setString(1, slotName)
            it.executeQuery().use { rs -> return rs.next() && rs.getBoolean(1) }
        }
    }
    
    override fun close() {
        con.close();
    }
}