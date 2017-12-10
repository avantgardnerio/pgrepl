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
        var actual = ""
        val spy = { json: String -> actual = json }
        Replicator(dbName, clientId, snap!!.lsn, cfgSvc, conSvc).use {
            it.addListener(spy)
            conSvc.getConnection(conString).use {
                it.prepareStatement("INSERT INTO person (id, name) VALUES (1, 'Brent');").use {
                    it.executeUpdate()
                }
            }
            TimeUnit.MILLISECONDS.sleep(100)
        }

        val actualObj: Transaction = Gson().fromJson(actual, Transaction::class.java)
        val expectedObj: Transaction = Gson().fromJson(expected, Transaction::class.java)
                .copy(xid = actualObj.xid)
        Assert.assertEquals("Replicator should send notifications", expectedObj, actualObj)
        conSvc.audit()
    }

}