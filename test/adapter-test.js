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

        it('once connected the client is returned', function(done){
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

    describe('Once connected', function(){
        describe('the client', function(){
            before(function(done){
                this.adapter = new Adapter({test:true});
                this.adapter.connect(function(err, client){
                    if(err){
                        return done(err);
                    }
                    this.client = client;
                    done();
                }.bind(this));
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

        describe('the adapter itself', function(){
            beforeEach(function(done){
                this.adapter = null;
                this.adapter = new Adapter({test:true});
                this.adapter.connect(function(err, client){
                    if(err){
                        return done(err);
                    }
                    this.client = client;
                    done();
                }.bind(this));
            });


            it('can return executed migrations', function(done){
                assert.isFunction(this.adapter.getExecutedMigrationNames);
                this.adapter.getExecutedMigrationNames(function(err, names){
                    assert.isNull(err);
                    assert.isArray(names);
                    assert.lengthOf(names, 0);
                    done();
                });
            });

            it('return an error if there is any when getting the migration names', function(done){
                this.adapter._getExecutedMigrations = function(cb){
                    cb(new Error('mocked error'));
                };
                this.adapter.getExecutedMigrationNames(function(err){
                    assert.isOk(err);
                    done();
                }.bind(this));
            });
            
        });

        describe('migrations handling', function(){
            beforeEach(function(done){
                this.adapter = null;
                this.adapter = new Adapter({test:true});
                this.adapter.connect(function(err, client){
                    if(err){
                        return done(err);
                    }
                    this.client = client;
                    done();
                }.bind(this));
            });
            
            it('can mark a migration as executed', function(done){
                assert.isFunction(this.adapter.markExecuted);
                this.adapter.markExecuted('any', function(err){
                    assert.isNull(err);
                    done();
                });
            });

            it('can mark a migration as not executed', function(done){
                assert.isFunction(this.adapter.unmarkExecuted);
                this.adapter.unmarkExecuted('any', function(err){
                    assert.isNull(err);
                    done();
                });
            });

            it('once marked as executed the migration name is returned', function(done){
                this.adapter.markExecuted('any', function(err){
                    if(err){
                        return done(err);
                    }
                    this.adapter.getExecutedMigrationNames(function(err, names){
                        assert.isNull(err);
                        assert.isArray(names);
                        assert.lengthOf(names, 1);
                        done();
                    });
                }.bind(this));
            });

            it('migrating and rollback return the names at 0', function(done){
                this.adapter.markExecuted('any', function(err){
                    if(err){
                        return done(err);
                    }
                    this.adapter.unmarkExecuted('any', function(err){
                        if(err){
                            return done(err);
                        }
                        this.adapter.getExecutedMigrationNames(function(err, names){
                            assert.isNull(err);
                            assert.isArray(names);
                            assert.lengthOf(names, 0);
                            done();
                        });
                    }.bind(this));
                }.bind(this));
            });
        });

        describe('the key builder', function(){
            it('return the default document key when no specific options are passed ', function(){
                var adapter = new Adapter({
                    test:true
                });
                var migrationKey = adapter._getExecutedDocumentKey();
                assert.deepEqual('migrations|executed', migrationKey);
            });

            it('change the document key based on the configuration', function(){
                var adapter = new Adapter({
                    keyPrefix: 'custommigr',
                    keySeparator: ':',
                    test:true
                });
                var migrationKey = adapter._getExecutedDocumentKey();
                assert.deepEqual('custommigr:executed', migrationKey);
            });
        });

    });
});
