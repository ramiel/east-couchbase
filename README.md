[![Build Status](https://travis-ci.org/ramiel/east-couchbase.svg?branch=master)](https://travis-ci.org/ramiel/east-couchbase)

# East Couchbase Adapter

couchbase adapter for [east](https://github.com/okv/east)

## Installation

`npm install east east-couchbase -g`

alternatively you could install it locally

## Usage

Go to project dir and run

```sh
east init
```

create `.eastrc` file at current directory

```js
{
    "adapter": "east-couchbase",
    "url": "couchbase://localhost",
    "dbauth": {
        "username": "admin",
        "password": "password"
    }
}
```

where `url` is url of database which you want to migrate (in 
[couchbase url connection format](http://developer.couchbase.com/documentation/server/current/developer-guide/connecting.html))

The information about the migrations will be stored in a document under the key `migration|<migration_name>` (this behavior is configurable)

## Options

This adapter takes some advanced options like in this example

```js
{
    keyPrefix: 'migrations',
    keySeparator: '|',
    url: 'couchbase://localhost',
    bucket: {
        name: 'default',
        passwor: null
    },
    dbauth: {
        username: "admin",
        password: "password"
    }
}
```

**keyPrefix**: The prefix for the key used for the document on couchbase. Default: `migrations`    
**keySeparator** : the separator used in the key. Default `|`    
**bucket.name**: The name of the bucket. Default `default`    
**bucket.password**: The password for the bucket. Default `null`    

## Exposed client

The adapter expose the following properties in the client paramter of your migrations:

- **db** Which is a reference to the [datasource](#datasource)
- **executionByQueries** A functions to execute N1ql queries easily as explained [here](#migration-template)

## Migration template

The default migration template show you plenty of examples to use the adapter at its best.
If you need just to execute a series of N1ql queries for your migrations you can do as in the example below

```js
'use strict';

let migrationQueries = [
    'INSERT INTO $1 (KEY, VALUE) VALUES ("my_key", { "productId": "lemonade", "color":"green"})'
];

let rollbackQueries = [
    'DELETE FROM $1 WHERE productId="lemonade";'
];

exports.migrate = function(client, done) {
    client.executionByQueries(migrationQueries, done);
};

exports.rollback = function(client, done) {
    client.executionByQueries(rollbackQueries, done);
};
```

In this case `$1` will be substituted with the bucket name.
You can find others options on the default template's comments

## Datasource

The db object exposed in the client is an instance of the connector used internally. It expose the following methods

**getEngine()**: returns the [couchbase driver](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.4/) instance    
**getBucket()**: returns an instance the the [bucket object](http://docs.couchbase.com/sdk-api/couchbase-node-client-2.1.4/Bucket.html) as exposed by the driver    

## Running test

run [east](https://github.com/okv/east#running-test) tests with this adapter


## License

MIT


