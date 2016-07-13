'use strict';

var Datasource = require('./datasource');
var path = require('path');
var _ = require('lodash');
var KEY_NOT_FOUND_ERROR = 13;
var async = require('async');
var util = require('util');

    
/**
 * Create the adapter
 *
 * @class      Adapter Couchbase adapter
 *
 * @param      {object}  params  Params from configuration
 * @param      {string}   [params.migrationFile='migration-template.js']  Migration
 *                                                                        file
 *                                                                        template
 *                                                                        path
 * @param      {string}   [params.keyPrefix='migrations']                 Prefix
 *                                                                        for the
 *                                                                        document
 *                                                                        key used
 *                                                                        on
 *                                                                        couchbase
 * @param      {string}   [params.keySeparator='|']                       Separator
 *                                                                        for the
 *                                                                        document
 *                                                                        key used
 *                                                                        on
 *                                                                        couchbase
 * @param      {string}   [params.url='couchbase://localhost']            DB url
 * @param      {object}   [params.bucket]                                 Information
 *                                                                        about the
 *                                                                        bucket
 * @param      {string}   [params.bucket.name='default']                  Name of
 *                                                                        the
 *                                                                        bucket
 * @param      {string}   [params.bucket.password=null]                   Password
 *                                                                        for the
 *                                                                        bucket
 * @param      {boolean}  [params.test=false]                             If true
 *                                                                        no
 *                                                                        connection
 *                                                                        will be
 *                                                                        done on
 *                                                                        database.
 *                                                                        To use
 *                                                                        only for
 *                                                                        test
 *                                                                        environment
 */
var Adapter = function(params) {
    this.params = params || {};
    this.config = _.defaultsDeep(this.params, {
        migrationFile: 'migration-template.js',
        keyPrefix: 'migrations',
        keySeparator: '|',
        url: 'couchbase://localhost',
        bucket: {
            name: 'default',
            passwor: null
        },
        test: false
    });
    this.datasource = new Datasource(this.config);
};

/**
 * Connect
 *
 * Handles the connection to the database.
 * @param      {Function}  callback  The callback
 */
Adapter.prototype.connect = function(callback) {
    this.datasource.connect(function(err) {
        if (err) {
            return callback(err);
        }
        callback(null, {
            db: this.datasource,
            executionByQueries: this.executionByQueries.bind(this, this.datasource)
        });
    }.bind(this));
};

/**
 * Run a list of queries on series against the connected database
 *
 * @param      {Datasource}    db        The connected database
 * @param      {string[]}    queries   A list of queries. The placeholder "$1" is substituted with the current bucket
 * @param      {Function}  callback  Called with an error if any
 */
Adapter.prototype.executionByQueries = function(db, queries, callback) {
    var datasource = db;
    var bucket = datasource.getBucket();
    var N1qlQuery = datasource.getEngine().N1qlQuery;

    async.eachSeries(queries,
        function(item, callback) {
            // I should find a fix to this
            item = item.replace(/\$1/igm, bucket._name);
            var q = N1qlQuery.fromString(item);
            bucket.query(q, [bucket._name], callback);
        },
        callback
    );
};

/**
 * Disconnect from database
 *
 * @param      {Function}  callback  The callback
 */
Adapter.prototype.disconnect = function(callback) {
    this.datasource.disconnect(callback);
};

/**
 * Get Template Path
 *
 * Returns the path to the default template
 *
 * @return     {string}  The template path.
 */
Adapter.prototype.getTemplatePath = function(){
    return path.join(__dirname, this.config.migrationFile);
};

Adapter.prototype._getExecutedDocumentKey = function(){
    return util.format('%s%sexecuted',this.config.keyPrefix, this.config.keySeparator);
};


/**
 * Get the executed migration and manage the common couchbase errors
 *
 * @param      {Function}  callback  The callback
 * @private
 */
Adapter.prototype._getExecutedMigrations = function(callback) {
    var keyName = this._getExecutedDocumentKey();
    this.datasource.getBucket().get(keyName, function(err, result){
        if (err && err.code === KEY_NOT_FOUND_ERROR) {
            return callback(null, []);
        }
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

/**
 * Get Executed Migration Names
 *
 * Returns a list of all the migrations that have already been executed
 *
 * @param      {Function}  callback  Called with an error or the migrations
 */
Adapter.prototype.getExecutedMigrationNames = function(callback) {
    this._getExecutedMigrations(function(err, result){
        if (err) {
            return callback(err);
        }
        callback(null, result.value || []);
    });
};

/**
 * Mark Executed
 *
 * Mark that the current migration script has been successfully executed
 *
 * @param      {string}    name      The name of the migration
 * @param      {Function}  callback  The callback
 */
Adapter.prototype.markExecuted = function(name, callback) {
    var objectKey = this._getExecutedDocumentKey();
    var bucket = this.datasource.getBucket();
    this._getExecutedMigrations(function(err, result){
        if (err) {
            return callback(err);
        }
        var executedMigrations = result.value || [];
        executedMigrations.push(name);
        bucket.upsert(objectKey, executedMigrations, {cas: result.cas}, callback);
    });
};

/**
 * Unmark Executed
 *
 * Removed the current migration from the list of scripts that have been run
 *
 * @param      {string}    name      The name of the migration to remove
 * @param      {Function}  callback  The callback
 */
Adapter.prototype.unmarkExecuted = function(name, callback) {
    var objectKey = this._getExecutedDocumentKey();
    var bucket = this.datasource.getBucket();
    this._getExecutedMigrations(function(err, result){
        if (err) {
            return callback(err);
        }
        var executedMigrations = (result.value || []).filter(function(m){
            return m !== name;
        });
        bucket.upsert(objectKey, executedMigrations, {cas: result.cas}, callback);
    });
};


module.exports = Adapter;
