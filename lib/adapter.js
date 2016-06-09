'use strict';

const Datasource = require('./datasource');
const path = require('path');
const _ = require('lodash');
const KEY_NOT_FOUND_ERROR = 13;
const async = require('async');

class Adapter{
    
    /**
     * Create the adapter
     *
     * @class      Adapter Couchbase adapter
     * @param      {object}  params  Params from configuration
     * @param      {string}  migrationFile                         Migratil file
     *                                                             template
     * @param      {string}  [keyPrefix=migrations]                Prefix for the
     *                                                             document key used on
     *                                                             couchbase
     * @param      {string}  [keySeparator='|']                    Separator for the
     *                                                             document key used on
     *                                                             couchbase
     * @param      {string}  [params.url='couchbase://localhost']  DB url
     * @param      {object}  [params.bucket]                       Information about
     *                                                             the bucket
     * @param      {string}  [params.bucket.name='default']        Name of the bucket
     * @param      {string}  [params.bucket.password=null]         Password for the
     *                                                             bucket
     */
    constructor(params) {
        this.params = params || {};
        this.config = _.defaultsDeep(this.params, {
            migrationFile: 'migration-template.js',
            keyPrefix: 'migrations',
            keySeparator: '|',
            url: 'couchbase://localhost',
            bucket: {
                name: 'default',
                passwor: null
            }
        });
        this.datasource = new Datasource(this.config);
    }

    /**
     * Connect
     *
     * Handles the connection to the database.
     * @param      {Function}  callback  The callback
     */
    connect(callback) {
        this.datasource.connect(err => {
            if (err) {
                return callback(err);
            }
            callback(null, {
                db: this.datasource,
                executionByQueries: this.executionByQueries.bind(this, this.datasource)
            });
        });
    }

    /**
     * Run a list of queries on series against the connected database
     *
     * @param      {Datasource}    db        The connected database
     * @param      {string[]}    queries   A list of queries. The placeholder "$1" is substituted with the current bucket
     * @param      {Function}  callback  Called with an error if any
     */
    executionByQueries(db, queries, callback) {
        let datasource = db;
        let bucket = datasource.getBucket();
        let N1qlQuery = datasource.getEngine().N1qlQuery;

        async.each(queries,
            function(item, callback) {
                // I should find a fix to this
                item = item.replace('$1', bucket._name);
                let q = (N1qlQuery.fromString(item)).adhoc(false);
                bucket.query(q, [bucket._name], callback);
            },
            callback
        );
    }

    /**
     * Disconnect from database
     *
     * @param      {Function}  callback  The callback
     */
    disconnect(callback) {
        this.datasource.disconnect(callback);
    }

    /**
     * Get Template Path
     *
     * Returns the path to the default template
     *
     * @return     {string}  The template path.
     */
    getTemplatePath(){
        return path.join(__dirname, this.config.migrationFile);
    }

    
    /**
     * Get the executed migration and manage the common couchbase errors
     *
     * @param      {Function}  callback  The callback
     * @private
     */
    _getExecutedMigrations(callback) {
        let keyName = `${this.config.keyPrefix}${this.config.keySeparator}executed`;
        this.datasource.getBucket().get(keyName, (err, result) => {
            if (err && err.code === KEY_NOT_FOUND_ERROR) {
                return callback(null, []);
            }
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    }

    /**
     * Get Executed Migration Names
     *
     * Returns a list of all the migrations that have already been executed
     *
     * @param      {Function}  callback  Called with an error or the migrations
     */
    getExecutedMigrationNames(callback) {
        this._getExecutedMigrations((err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.value || []);
        });
    }

    /**
     * Mark Executed
     *
     * Mark that the current migration script has been successfully executed
     *
     * @param      {string}    name      The name of the migration
     * @param      {Function}  callback  The callback
     */
    markExecuted(name, callback) {
        let objectKey = `${this.config.keyPrefix}${this.config.keySeparator}executed`;
        let bucket = this.datasource.getBucket();
        this._getExecutedMigrations((err, result) => {
            if (err) {
                return callback(err);
            }
            let executedMigrations = result.value || [];
            executedMigrations.push(name);
            bucket.upsert(objectKey, executedMigrations, {cas: result.cas}, callback);
        });
    }

    /**
     * Unmark Executed
     *
     * Removed the current migration from the list of scripts that have been run
     *
     * @param      {string}    name      The name of the migration to remove
     * @param      {Function}  callback  The callback
     */
    unmarkExecuted(name, callback) {
        let objectKey = `${this.config.keyPrefix}${this.config.keySeparator}executed`;
        let bucket = this.datasource.getBucket();
        this._getExecutedMigrations((err, result) => {
            if (err) {
                return callback(err);
            }
            let executedMigrations = (result.value || []).filter(m => m !== name);
            bucket.upsert(objectKey, executedMigrations, {cas: result.cas}, callback);
        });
    }
}

module.exports = Adapter;
