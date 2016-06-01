'use strict';

// let migrationQueries = [
//     'INSERT INTO $1 (KEY, VALUE) VALUES ("my_key", { "productId": "odwalla-juice1", "color":"green"})'
// ];

// let rollbackQueries = [
//     'DELETE FROM $1 WHERE productId="odwalla-juice1";'
// ];

exports.migrate = function(client, done) {
    /*
    * You can use the query executor to migrate with a bunch of N1ql queries.
    * Your query should contain $1 as a placeholder for the bucket name
    * Here the super-easy example
    */

    // client.executionByQueries(migrationQueries, done);

    /*
    * Or you can obtain the database and other entities
    * like in this example
    */

    // let datasource = client.db;
    // let bucket = datasource.getBucket();
    // let couchbase = datasource.getEngine();
    // let N1qlQuery = couchbase.N1qlQuery;
    // bucket.insert('my-key', {prop: 'value'}, done);

    // You can even mix both approaches.
    // You just have to call done at the end (with an error if any)
    done();
};

exports.rollback = function(client, done) {
    // ... Your code here. Call "done" at the end with or without an error
    done();
};
