/*eslint-env node, mocha */
var assert = require('chai').assert;
var Adapter = require('../lib/adapter');
var Datasource = require('../lib/datasource');

describe('East Couchbase', function(){
    describe('Instantiations', function(){
        it('An adapter can be instantiated without params', function(){
            var adapter = new Adapter();
            assert.instanceOf(adapter, Adapter);
        });

        it('An adapter can be instantiated with params', function(){
            var adapter = new Adapter({
                url: 'couchbase://localhost' 
            });
            assert.instanceOf(adapter, Adapter);
        });
    });

    describe('The adapter object', function(){
        before(function(){
            this.adapter = new Adapter({test:true});
        });

        it('has a datasource', function(){
            assert.instanceOf(this.adapter.datasource, Datasource);
        });

        it('can connect through the datasource', function(done){
            this.adapter.connect(function(err){
                done(err);
            });
        });

        it('once connected the client returned', function(done){
            this.adapter.connect(function(err, client){
                assert.isNull(err);
                assert.isObject(client);
                assert.property(client, 'db');
                assert.property(client, 'executionByQueries');
                assert.isFunction(client.executionByQueries);
                done();
            });
        });
    });

    describe('The client object', function(){
        before(function(done){
            var self = this;
            var adapter = new Adapter({test:true});
            adapter.connect(function(err, client){
                if(err){
                    return done(err);
                }
                self.client = client;
                done();
            });
        });

        it('exports the bucket object', function(){
            assert.isFunction(this.client.db.getBucket);
            assert.isObject(this.client.db.getBucket(), Function);
        });

        // Cannot be mocked for the moment
        it.skip('can execute a series of queries', function(done){
            var queries = [
                'SELECT * FROM $1'
            ];
            this.client.executionByQueries(queries, function(err){
                done(err);
            });
        });
    });
});
