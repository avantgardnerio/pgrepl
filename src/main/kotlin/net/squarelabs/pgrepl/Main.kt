package net.squarelabs.pgrepl

import com.google.inject.AbstractModule
import com.google.inject.Guice

fun main(args: Array<String>) {
    val injector = Guice.createInjector(object : AbstractModule() {
        public override fun configure() {
            //bind(ConfigService::class.java).to(ConfigService::class.java)
        }
    })
    val app: App = injector.getInstance(App::class.java)
    app.start()
    app.join()
}