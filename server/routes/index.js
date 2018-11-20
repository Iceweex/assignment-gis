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

var coffee_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry,ST_Length(geography(lg.way)) as length, row_to_json((osm_id, z_order, name)) As properties, ARRAY(SELECT json_build_object('name', p.name, 'distance', ST_Distance(geography(lg.way), geography(p.way))) FROM planet_osm_point p WHERE ST_DWithin(geography(p.way), geography(lg.way), 1000) AND  p.amenity = 'restaurant') as restaurants, ARRAY(SELECT p.name FROM planet_osm_polygon p WHERE ST_Intersects(geography(p.way), geography(lg.way)) AND  p.place IN ('suburb', 'village', 'town') AND p.osm_id > 0 AND p.name IS NOT NULL ) as towns,  ABS(lg.osm_id) AS id FROM planet_osm_line As lg WHERE lg.route = 'bicycle') As f) As fc";
var points_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry, row_to_json((osm_id, name)) As properties FROM planet_osm_point As lg WHERE lg.amenity = 'restaurant' AND lg.osm_id > 0) As f) As fc";
var polygons_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry, row_to_json((osm_id, name)) As properties FROM planet_osm_polygon As lg WHERE  lg.place IN ('suburb', 'village', 'town') AND lg.osm_id > 0 AND lg.name IS NOT NULL ) As f) As fc";

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

/* Touch data of touching routes */
router.post('/touchdata', function(req, res, next) {
    console.log("ID: ", req.body.id)
    var touch_query = "SELECT ABS(p.osm_id) AS id FROM planet_osm_line p, planet_osm_line b WHERE  ST_Touches(p.way, b.way) AND ABS(b.osm_id) = "+req.body.id+" AND p.route = 'bicycle' AND p.osm_id != b.osm_id";
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(touch_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows);
        res.end();
    });
  });


/* Update data when town filter is selected */
router.post('/updatedata', function(req, res, next) {
    console.log(req.body.data)
    var update_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry,ST_Length(geography(lg.way)) as length,row_to_json((lg.osm_id, lg.z_order, lg.name)) As properties,ARRAY(SELECT json_build_object('name', p.name, 'distance', ST_Distance(geography(lg.way), geography(p.way))) FROM planet_osm_point p WHERE ST_DWithin(geography(p.way), geography(lg.way), 1000) AND  p.amenity = 'restaurant') as restaurants,ARRAY(SELECT p.name FROM planet_osm_polygon p WHERE ST_Intersects(geography(p.way), geography(lg.way)) AND  p.place = 'suburb') as towns,  ABS(lg.osm_id) AS id FROM planet_osm_polygon, planet_osm_line As lg WHERE lg.route = 'bicycle' AND ST_Contains(planet_osm_polygon.way, lg.way) AND planet_osm_polygon.osm_id = any( array ["+req.body.data+"])) As f) As fc";
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(update_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
  });

  /* Get towns, villages and suburbs */
  router.get('/polygons', function(req, res, next) {
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(polygons_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
  });

/* Get all restaurants */
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