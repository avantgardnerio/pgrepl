package net.squarelabs.pgrepl

import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener
import org.apache.kafka.clients.consumer.KafkaConsumer
import org.apache.kafka.clients.producer.*
import org.apache.kafka.common.TopicPartition
import org.junit.Ignore
import org.junit.Test
import java.util.*
import java.util.concurrent.TimeUnit

class KafkaTest {
    @Test
    @Ignore
    fun `should be able to write to kafka`() {
        val props = Properties()
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "127.0.0.1:9092")
        props.put(ProducerConfig.ACKS_CONFIG, "all")
        props.put(ProducerConfig.RETRIES_CONFIG, 0)
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer")
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer")

        KafkaProducer<String, String>(props).use { producer ->
            val callback = TestCallback()
            val res = (0..5).map { producer.send(ProducerRecord("test", "key-$it", "message-$it")) }
            while(!res.fold(true, {acc, cur -> acc && cur.isDone})) {
                TimeUnit.SECONDS.sleep(1)
                val num = res.filter { !it.isDone }.size
                println("waiting for $num results...")
            }
        }
        println("done!")
    }

    @Test
    @Ignore
    fun `should be able to read from kafka`() {
        val consumerConfig = Properties()
        consumerConfig.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092")
        consumerConfig.put(ConsumerConfig.GROUP_ID_CONFIG, "my-group")
        consumerConfig.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest")
        consumerConfig.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer")
        consumerConfig.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer")
        val consumer = KafkaConsumer<ByteArray, ByteArray>(consumerConfig)
        val rebalanceListener = TestConsumerRebalanceListener()
        consumer.subscribe(listOf("test"), rebalanceListener)

        while (true) {
            val records = consumer.poll(1000)
            for (record in records) {
                System.out.printf("Received Message topic =%s, partition =%s, offset = %d, key = %s, value = %s\n", record.topic(), record.partition(), record.offset(), record.key(), record.value())
            }

            consumer.commitSync()
        }
    }

    private class TestCallback : Callback {
        override fun onCompletion(recordMetadata: RecordMetadata?, e: Exception?) {
            if (e != null) {
                println("Error while producing message to topic :" + recordMetadata)
                e.printStackTrace()
            } else {
                val message = String.format("sent message to topic:%s partition:%s  offset:%s",
                        recordMetadata!!.topic(), recordMetadata!!.partition(), recordMetadata!!.offset()
                )
                println(message)
            }
        }
    }

    private class TestConsumerRebalanceListener : ConsumerRebalanceListener {
        override fun onPartitionsAssigned(partitions: MutableCollection<TopicPartition>?) {
            println("Called onPartitionsAssigned with partitions:" + partitions)
        }

        override fun onPartitionsRevoked(partitions: MutableCollection<TopicPartition>?) {
            println("Called onPartitionsRevoked with partitions:" + partitions)
        }
    }

}