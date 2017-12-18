package net.squarelabs.pgrepl.db

import com.google.gson.Gson
import com.google.inject.Guice
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.model.Snapshot
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
import net.squarelabs.pgrepl.services.SnapshotService
import org.flywaydb.core.Flyway
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test
import java.util.*
import java.util.concurrent.TimeUnit

class ReplicatorTest {

    companion object {
        private val injector = Guice.createInjector(DefaultInjector())!!
        val cfgSvc = injector.getInstance(ConfigService::class.java)!!
        val conSvc = injector.getInstance(ConnectionService::class.java)!!
        val snapSvc = injector.getInstance(SnapshotService::class.java)!!

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            val dbName = cfgSvc.getAppDbName()
            val url = cfgSvc.getJdbcDatabaseUrl()
            DbService(url, conSvc).use {
                if (it.list().contains(dbName)) it.drop(dbName)
                it.create(dbName)
                val flyway = Flyway()
                flyway.setDataSource(cfgSvc.getAppDbUrl(), null, null)
                flyway.migrate()
            }
        }
    }

    @Test
    fun shouldReceiveNotifications() {
        val expected = this.javaClass.getResource("/fixtures/txn.json").readText()
        val dbName = cfgSvc.getAppDbName()
        val clientId = UUID.randomUUID()
        val conString = cfgSvc.getAppDbUrl()
        var snap: Snapshot? = null
        conSvc.getConnection(conString).use {
            snap = snapSvc.takeSnapshot(it)
        }
        val actual = mutableListOf<String>()
        val spy = { lsn: Long, json: String ->
            actual.add(json)
            Unit
        }
        Replicator(dbName, clientId, snap!!.lsn, cfgSvc, conSvc).use {
            it.addListener(spy)
            conSvc.getConnection(conString).use { conA ->
                conSvc.getConnection(conString).use { conB ->
                    conA.autoCommit = false
                    conB.autoCommit = false
                    conA.prepareStatement("INSERT INTO person (id, name, curTxnId) VALUES (1, 'Brent', 'd55cad5c-03da-405f-af3a-13788092b33c');").use {
                        it.executeUpdate()
                    }
                    conB.prepareStatement("INSERT INTO person (id, name, curTxnId) VALUES (2, 'Rachel', '794d1570-ce12-4371-9304-0d50cce518ca');").use {
                        it.executeUpdate()
                    }
                    conA.prepareStatement("INSERT INTO person (id, name, curTxnId) VALUES (3, 'Emma', 'ee52c2be-8690-4bbb-9cac-a4aa5e7ca81e');").use {
                        it.executeUpdate()
                    }
                    conB.prepareStatement("INSERT INTO person (id, name, curTxnId) VALUES (4, 'Annie', '36bc5f56-2c7d-4147-af72-f03bd1443e9e');").use {
                        it.executeUpdate()
                    }
                    conA.commit()
                    TimeUnit.MILLISECONDS.sleep(100) // TODO: No hard-coded waits
                    conB.commit()
                    TimeUnit.MILLISECONDS.sleep(100) // TODO: No hard-coded waits
                }
            }
            TimeUnit.MILLISECONDS.sleep(1000) // TODO: No hard-coded waits
        }

        val actualObj: Transaction = Gson().fromJson(actual.get(0), Transaction::class.java)
                .copy(clientTxnId = "d55cad5c-03da-405f-af3a-13788092b33c")
        val expectedObj: Transaction = Gson().fromJson(expected, Transaction::class.java)
                .copy(xid = actualObj.xid, clientTxnId = "d55cad5c-03da-405f-af3a-13788092b33c")
        Assert.assertEquals("Replicator should send notifications", expectedObj, actualObj)
        conSvc.audit()
    }

}