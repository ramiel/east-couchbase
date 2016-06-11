'use strict';
var couchbase = require('couchbase');

/**
 * Contructor for a Datasource
 *
 * @class      Datasource Datasource
 * @param      {object}  configuration  The configuration for this datasource
 * @param      {string}   configuration.url              Couchbase db url
 * @param      {object}   configuration.bucket           Configuration object for
 *                                                       the bucket
 * @param      {string}   configuration.bucket.name      Name of the bucket
 * @param      {string}   configuration.bucket.password  Password for the bucket
 * @param      {boolean}  [configuration.test=false]     If true the connection is
 *                                                       only mocked
 */
var Datasource = function(configuration) {
    this._config = configuration;
    this._connectionString = configuration.url;
    this._models = {};
    this._couchbase = couchbase;
    if(this._config.test === true){
        this._couchbase = this._couchbase.Mock;
    }
    this._bucket = null;
};

Datasource.prototype.connect = function(callback) {
    var cluster = new this._couchbase.Cluster(this.getConnectionString());
    this._bucket = cluster.openBucket(this._config.bucket.name, this._config.bucket.password, callback);
};
Datasource.prototype.disconnect = function(callback) {
    this._bucket.disconnect();
    callback();
};
Datasource.prototype.getEngine = function() {
    return this._couchbase;
};
Datasource.prototype.getBucket = function() {
    return this._bucket;
};
Datasource.prototype.getConnectionString = function() {
    return this._connectionString;
};


module.exports = Datasource;
