package net.squarelabs.pgrepl.db

import net.squarelabs.pgrepl.services.ConnectionService
import org.postgresql.PGNotification
import org.postgresql.copy.CopyManager
import org.postgresql.core.*
import org.postgresql.fastpath.Fastpath
import org.postgresql.jdbc.AutoSave
import org.postgresql.jdbc.FieldMetadata
import org.postgresql.jdbc.PreferQueryMode
import org.postgresql.jdbc.TimestampUtils
import org.postgresql.largeobject.LargeObjectManager
import org.postgresql.replication.PGReplicationConnection
import org.postgresql.util.LruCache
import org.postgresql.util.PGobject
import java.sql.*
import java.util.*
import java.util.concurrent.Executor
import java.util.logging.Logger

class PoolConnection(private val svc: ConnectionService, private val con: BaseConnection) : BaseConnection {
    override fun getLargeObjectAPI(): LargeObjectManager {
        return con.largeObjectAPI
    }

    override fun prepareStatement(p0: String?): PreparedStatement {
        return con.prepareStatement(p0)
    }

    override fun prepareStatement(p0: String?, p1: Int, p2: Int): PreparedStatement {
        return con.prepareStatement(p0, p1, p2)
    }

    override fun prepareStatement(p0: String?, p1: Int, p2: Int, p3: Int): PreparedStatement {
        return con.prepareStatement(p0, p1, p2, p3)
    }

    override fun prepareStatement(p0: String?, p1: Int): PreparedStatement {
        return con.prepareStatement(p0, p1)
    }

    override fun prepareStatement(p0: String?, p1: IntArray?): PreparedStatement {
        return con.prepareStatement(p0, p1)
    }

    override fun prepareStatement(p0: String?, p1: Array<out String>?): PreparedStatement {
        return con.prepareStatement(p0, p1)
    }

    override fun escapeLiteral(literal: String?): String {
        return con.escapeLiteral(literal)
    }

    override fun getEncoding(): Encoding {
        return con.encoding
    }

    override fun getReplicationProtocol(): ReplicationProtocol {
        return con.replicationProtocol
    }

    override fun rollback() {
        return con.rollback()
    }

    override fun rollback(p0: Savepoint?) {
        return con.rollback(p0)
    }

    override fun getHoldability(): Int {
        return con.holdability
    }

    override fun getLogger(): Logger {
        return con.logger
    }

    override fun getObject(type: String?, value: String?, byteValue: ByteArray?): Any {
        return con.getObject(type, value, byteValue)
    }

    override fun commit() {
        return con.commit()
    }

    override fun binaryTransferSend(oid: Int): Boolean {
        return con.binaryTransferSend(oid)
    }

    override fun isColumnSanitiserDisabled(): Boolean {
        return con.isColumnSanitiserDisabled
    }

    override fun prepareCall(p0: String?): CallableStatement {
        return con.prepareCall(p0)
    }

    override fun prepareCall(p0: String?, p1: Int, p2: Int): CallableStatement {
        return con.prepareCall(p0, p1, p2)
    }

    override fun prepareCall(p0: String?, p1: Int, p2: Int, p3: Int): CallableStatement {
        return con.prepareCall(p0, p1, p2, p3)
    }

    override fun getClientInfo(p0: String?): String {
        return con.getClientInfo(p0)
    }

    override fun getClientInfo(): Properties {
        return con.clientInfo
    }

    override fun purgeTimerTasks() {
        return con.purgeTimerTasks()
    }

    override fun getWarnings(): SQLWarning {
        return con.warnings
    }

    override fun getDefaultFetchSize(): Int {
        return con.defaultFetchSize
    }

    override fun execSQLUpdate(s: String?) {
        return con.execSQLUpdate(s)
    }

    override fun getCopyAPI(): CopyManager {
        return con.copyAPI
    }

    override fun setDefaultFetchSize(fetchSize: Int) {
        con.defaultFetchSize = fetchSize
    }

    override fun getAutosave(): AutoSave {
        return con.autosave
    }

    override fun getNotifications(): Array<PGNotification> {
        return con.notifications
    }

    override fun getNotifications(timeoutMillis: Int): Array<PGNotification> {
        return con.getNotifications(timeoutMillis)
    }

    override fun getPrepareThreshold(): Int {
        return con.prepareThreshold
    }

    override fun close() {
        con.close()
        svc.release(this)
    }

    override fun isClosed(): Boolean {
        return con.isClosed
    }

    override fun createNClob(): NClob {
        return con.createNClob()
    }

    override fun getTransactionState(): TransactionState {
        return con.transactionState
    }

    override fun createBlob(): Blob {
        return con.createBlob()
    }

    override fun getStringVarcharFlag(): Boolean {
        return con.stringVarcharFlag
    }

    override fun nativeSQL(p0: String?): String {
        return con.nativeSQL(p0)
    }

    override fun releaseSavepoint(p0: Savepoint?) {
        return con.releaseSavepoint(p0)
    }

    override fun getBackendPID(): Int {
        return con.backendPID
    }

    override fun isReadOnly(): Boolean {
        return con.isReadOnly
    }

    override fun execSQLQuery(s: String?): ResultSet {
        return con.execSQLQuery(s)
    }

    override fun execSQLQuery(s: String?, resultSetType: Int, resultSetConcurrency: Int): ResultSet {
        return con.execSQLQuery(s, resultSetType, resultSetConcurrency)
    }

    override fun getPreferQueryMode(): PreferQueryMode {
        return con.preferQueryMode
    }

    override fun setSchema(p0: String?) {
        con.schema = p0
    }

    override fun getTimestampUtils(): TimestampUtils {
        return con.timestampUtils
    }

    override fun setTypeMap(p0: MutableMap<String, Class<*>>?) {
        con.typeMap = p0
    }

    override fun addTimerTask(timerTask: TimerTask?, milliSeconds: Long) {
        return con.addTimerTask(timerTask, milliSeconds)
    }

    override fun setAutosave(autoSave: AutoSave?) {
        con.autosave = autosave
    }

    override fun getFieldMetadataCache(): LruCache<FieldMetadata.Key, FieldMetadata> {
        return con.fieldMetadataCache
    }

    override fun setPrepareThreshold(threshold: Int) {
        con.prepareThreshold = threshold
    }

    override fun setNetworkTimeout(p0: Executor?, p1: Int) {
        return con.setNetworkTimeout(p0, p1)
    }

    override fun <T : Any?> unwrap(p0: Class<T>?): T {
        return con.unwrap(p0)
    }

    override fun setTransactionIsolation(p0: Int) {
        con.transactionIsolation = p0
    }

    override fun setAutoCommit(p0: Boolean) {
        con.autoCommit = p0
    }

    override fun abort(p0: Executor?) {
        con.abort(p0)
    }

    override fun getFastpathAPI(): Fastpath {
        return con.fastpathAPI
    }

    override fun escapeString(str: String?): String {
        return con.escapeString(str)
    }

    override fun getAutoCommit(): Boolean {
        return con.autoCommit
    }

    override fun setCatalog(p0: String?) {
        con.catalog = p0
    }

    override fun getReplicationAPI(): PGReplicationConnection {
        return con.replicationAPI
    }

    override fun getCatalog(): String {
        return con.catalog
    }

    override fun setHoldability(p0: Int) {
        con.holdability = p0
    }

    override fun getSchema(): String {
        return con.schema
    }

    override fun isValid(p0: Int): Boolean {
        return con.isValid(p0)
    }

    override fun addDataType(type: String?, className: String?) {
        return con.addDataType(type, className)
    }

    override fun addDataType(type: String?, klass: Class<out PGobject>?) {
        con.addDataType(type, klass)
    }

    override fun createArrayOf(p0: String?, p1: Array<out Any>?): java.sql.Array {
        return con.createArrayOf(p0, p1)
    }

    override fun cancelQuery() {
        con.cancelQuery()
    }

    override fun setReadOnly(p0: Boolean) {
        con.isReadOnly = p0
    }

    override fun isWrapperFor(p0: Class<*>?): Boolean {
        return con.isWrapperFor(p0)
    }

    override fun encodeString(str: String?): ByteArray {
        return con.encodeString(str)
    }

    override fun getTypeInfo(): TypeInfo {
        return con.typeInfo
    }

    override fun createStruct(p0: String?, p1: Array<out Any>?): Struct {
        return con.createStruct(p0, p1)
    }

    override fun setClientInfo(p0: String?, p1: String?) {
        return con.setClientInfo(p0, p1)
    }

    override fun setClientInfo(p0: Properties?) {
        con.clientInfo = p0
    }

    override fun createClob(): Clob {
        return con.createClob()
    }

    override fun createStatement(): Statement {
        return con.createStatement()
    }

    override fun createStatement(p0: Int, p1: Int): Statement {
        return con.createStatement(p0, p1)
    }

    override fun createStatement(p0: Int, p1: Int, p2: Int): Statement {
        return con.createStatement(p0, p1, p2)
    }

    override fun getStandardConformingStrings(): Boolean {
        return con.standardConformingStrings
    }

    override fun setSavepoint(): Savepoint {
        return con.setSavepoint()
    }

    override fun setSavepoint(p0: String?): Savepoint {
        return con.setSavepoint(p0)
    }

    override fun getTypeMap(): MutableMap<String, Class<*>> {
        return con.typeMap
    }

    override fun clearWarnings() {
        con.clearWarnings()
    }

    override fun getQueryExecutor(): QueryExecutor {
        return con.queryExecutor
    }

    override fun getMetaData(): DatabaseMetaData {
        return con.metaData
    }

    override fun getTransactionIsolation(): Int {
        return con.transactionIsolation
    }

    override fun escapeIdentifier(identifier: String?): String {
        return con.escapeIdentifier(identifier)
    }

    override fun haveMinimumServerVersion(ver: Int): Boolean {
        return con.haveMinimumServerVersion(ver)
    }

    override fun haveMinimumServerVersion(ver: Version?): Boolean {
        return con.haveMinimumServerVersion(ver)
    }

    override fun createQuery(sql: String?, escapeProcessing: Boolean, isParameterized: Boolean, vararg columnNames: String?): CachedQuery {
        return con.createQuery(sql, escapeProcessing, isParameterized, *columnNames)
    }

    override fun setFlushCacheOnDeallocate(flushCacheOnDeallocate: Boolean) {
        return con.setFlushCacheOnDeallocate(flushCacheOnDeallocate)
    }

    override fun getNetworkTimeout(): Int {
        return con.networkTimeout
    }

    override fun createSQLXML(): SQLXML {
        return con.createSQLXML()
    }
}