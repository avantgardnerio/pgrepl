package net.squarelabs.pgrepl.db

import com.google.gson.Gson
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.DbService
import org.flywaydb.core.Flyway
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test
import java.sql.DriverManager
import java.util.concurrent.TimeUnit


class ReplicatorTest {

    companion object {
        val cfgService = ConfigService()

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            val dbName = cfgService.getAppDbName()
            val url = cfgService.getJdbcDatabaseUrl()
            val db = DbService(url)
            if (db.list().contains(dbName)) db.drop(dbName)
            db.create(dbName)
            val flyway = Flyway()
            flyway.setDataSource(cfgService.getAppDbUrl(), null, null)
            flyway.migrate()
        }
    }

    @Test
    fun shouldReceiveNotifications() {
        val expected = javaClass.getResource("/fixtures/txn.json").readText()
        val dbName = cfgService.getAppDbName()
        var actual = ""
        val spy = { json: String -> actual = json }
        Replicator(dbName, cfgService).use {
            it.addListener(spy)
            val conString = cfgService.getAppDbUrl()
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
    }

}