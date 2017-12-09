package net.squarelabs.pgrepl.db

import com.google.gson.Gson
import com.google.inject.AbstractModule
import com.google.inject.Guice
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
import org.flywaydb.core.Flyway
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test
import java.sql.DriverManager
import java.util.concurrent.TimeUnit


class ReplicatorTest {

    companion object {
        val cfgSvc: ConfigService
        val conSvc: ConnectionService

        init {
            val injector = Guice.createInjector(object : AbstractModule() {
                public override fun configure() {
                }
            })
            cfgSvc = injector.getInstance(ConfigService::class.java)
            conSvc = injector.getInstance(ConnectionService::class.java)
        }

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
        var actual = ""
        val spy = { json: String -> actual = json }
        Replicator(dbName, cfgSvc, conSvc).use {
            it.addListener(spy)
            val conString = cfgSvc.getAppDbUrl()
            DriverManager.getConnection(conString).use {
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