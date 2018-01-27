package net.squarelabs.pgrepl.db

import com.google.gson.Gson
import com.google.inject.Guice
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.messages.TxnMsg
import net.squarelabs.pgrepl.model.Snapshot
import net.squarelabs.pgrepl.services.*
import org.flywaydb.core.Flyway
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.postgresql.core.BaseConnection
import java.util.*
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit

class ReplicatorTest {

    private val injector = Guice.createInjector(DefaultInjector())!!
    private val cfgSvc = injector.getInstance(ConfigService::class.java)!!
    private val conSvc = injector.getInstance(ConnectionService::class.java)!!
    private val snapSvc = injector.getInstance(SnapshotService::class.java)!!
    private val dbSvc = injector.getInstance(DbService::class.java)!!
    private val slotSvc = injector.getInstance(SlotService::class.java)!!
    private val crudSvc = injector.getInstance(CrudService::class.java)!!
    private val cnvSvc = injector.getInstance(ConverterService::class.java)!!

    @Before
    @Throws(Exception::class)
    fun setup() {
        val dbName = cfgSvc.getAppDbName()
        if (dbSvc.list().contains(dbName)) dbSvc.drop(dbName)
        dbSvc.create(dbName)
        val flyway = Flyway()
        flyway.setDataSource(cfgSvc.getAppDbUrl(), null, null)
        flyway.migrate()
    }

    @After
    fun tearDown() {
        conSvc.reset()
    }

    @Test
    fun `should receive atomic notifications for interleaved transactions`() {
        val mapper = Gson()
        val dbName = cfgSvc.getAppDbName()
        val txnAId = UUID.randomUUID().toString()
        val txnBId = UUID.randomUUID().toString()
        val conString = cfgSvc.getAppDbUrl()
        val brent = hashMapOf("id" to 1, "name" to "Brent", "curTxnId" to txnAId)
        val rachel = hashMapOf("id" to 2, "name" to "Brent", "curTxnId" to txnBId)
        val emma = hashMapOf("id" to 3, "name" to "Emma", "curTxnId" to txnAId)
        val annie = hashMapOf("id" to 4, "name" to "Annie", "curTxnId" to txnBId)
        var snap: Snapshot? = null
        var lsn: Long? = null
        conSvc.getConnection(conString).use { con ->
            snap = snapSvc.takeSnapshot(con.unwrap(BaseConnection::class.java))
        }
        val actual = mutableListOf<String>()
        val spy = { json: String ->
            actual.add(json)
            val future = CompletableFuture<Void>()
            future.complete(null)
            future
        }
        Replicator(dbName, snap!!.lsn, cfgSvc, slotSvc, conSvc, crudSvc, cnvSvc).use {
            // HACK: need to start Replicator with commit in log
            conSvc.getConnection(conString).use { con ->
                con.autoCommit = false
                lsn = crudSvc.getCurrentLsn(con)
                crudSvc.updateTxnMap(UUID.randomUUID().toString(), con)
                con.commit()
            }
            it.addListener(lsn!!, spy)
            conSvc.getConnection(conString).use { conA ->
                conSvc.getConnection(conString).use { conB ->
                    // test interleave
                    conA.autoCommit = false
                    conB.autoCommit = false
                    crudSvc.insertRow("person", brent, conA)
                    crudSvc.insertRow("person", rachel, conB)
                    crudSvc.insertRow("person", emma, conA)
                    crudSvc.insertRow("person", annie, conB)
                    crudSvc.updateTxnMap(txnAId, conA)
                    crudSvc.updateTxnMap(txnBId, conB)
                    conA.commit()
                    conB.commit()
                }
            }
            while (actual.size < 2) TimeUnit.MILLISECONDS.sleep(10)
        }

        // Assert
        Assert.assertEquals("Updates should be received for all transactions", 2, actual.size)
        val txnA = mapper.fromJson(actual[0], TxnMsg::class.java)
        val txnB = mapper.fromJson(actual[1], TxnMsg::class.java)
        Assert.assertEquals(txnA.payload.changes.size, 3)
        Assert.assertEquals(txnB.payload.changes.size, 3)
    }

}