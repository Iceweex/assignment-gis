var express = require('express'); // require Express
var router = express.Router(); // setup usage of the Express router engine

/* PostgreSQL and PostGIS module and connection setup */
const { Client, Query } = require('pg')
var pgp = require('pg-promise')

// Setup connection
var username = "postgres" // sandbox username
var password = "" // read only privileges on our table
var host = "localhost:5432"
var database = "gis" // database name
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database; // Your Database Connection
// var db = pgp('postgres://postgres:@localhost:5432/postgis_24_sample');

// Set up your database query to display GeoJSON
var coffee_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry,ST_Length(geography(lg.way)) as length, row_to_json((osm_id, z_order, name)) As properties, ARRAY(SELECT p.name FROM planet_osm_point p WHERE ST_DWithin(geography(p.way), geography(lg.way), 1000) AND  p.amenity = 'restaurant') as restaurants, ARRAY(SELECT p.name FROM planet_osm_polygon p WHERE ST_Intersects(geography(p.way), geography(lg.way)) AND  p.place = 'suburb') as towns FROM planet_osm_line As lg WHERE lg.route = 'bicycle') As f) As fc";
var points_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry, row_to_json((osm_id, name)) As properties FROM planet_osm_point As lg WHERE lg.amenity = 'restaurant') As f) As fc";
/* GET home page. */
router.get('/data', function(req, res, next) {
  var client = new Client(conString);
  client.connect();
  var query = client.query(new Query(coffee_query));
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
      res.send(result.rows[0].row_to_json);
      res.end();
  });
});

router.get('/point', function(req, res, next) {
    var client = new Client(conString);
    client.connect();
    var point_query = "SELECT count(* FROM planet_osm_point p WHERE ST_DWithin(ST_AsGeoJSON(p.way), 'SRID=3857;POINT(3072163.4 7159374.1)', 4000)";
    var query = client.query(new Query(points_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
  });

router.get('/points', function(req, res, next) {
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(points_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
  });

module.exports = router;