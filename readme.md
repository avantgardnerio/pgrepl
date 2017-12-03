# pgrepl

pgrepl is a project that aims to use the [Logical Replication](https://jdbc.postgresql.org/documentation/head/replication.html) feature of PostGreSQL 9.4+ to bidirectionally replicate an entire database (or subsets of a database) to clients in real-time using websockets, solving the problem of caching/invalidation within SPAs.

Though this project is not dependent upon React or Redux, adoption will come most naturally to client-side developers used to thinking in a log/present-state pattern.

## Setup

1. git clone this repo
1. ./gradlew build
1. Observe passing tests