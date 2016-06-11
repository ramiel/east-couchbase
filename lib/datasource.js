'use strict';
const couchbase = require('couchbase');

class Datasource {
    
    /**
     * Contructor for a Datasource
     *
     * @param      {object}  configuration  The configuration for this
     *                                      datasource
     * @param      {string} configuration.url Couchbase db url
     * @param      {object} configuration.bucket Configuration object for the bucket
     * @param      {string} configuration.bucket.name Name of the bucket
     * @param      {string} configuration.bucket.password Password for the bucket
     */
    constructor(configuration) {
        this._config = configuration;
        this._connectionString = configuration.url;
        this._models = {};
        this._couchbase = couchbase;
        if(this._config.test === true){
            this._couchbase = this._couchbase.Mock
        }
        this._bucket = null;
    }
    connect(callback) {
        const cluster = new this._couchbase.Cluster(this.getConnectionString());
        this._bucket = cluster.openBucket(this._config.bucket.name, this._config.bucket.password, callback);
    }
    disconnect(callback) {
        this._bucket.disconnect();
        callback();
    }
    getEngine() {
        return this._couchbase;
    }
    getBucket() {
        return this._bucket;
    }
    getConnectionString() {
        return this._connectionString;
    }
}

module.exports = Datasource;
