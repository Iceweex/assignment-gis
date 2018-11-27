var express = require('express'); // require Express
var router = express.Router(); // setup usage of the Express router engine

/* PostgreSQL and PostGIS module and connection setup */
const { Client, Query } = require('pg')
var pgp = require('pg-promise')

// Setup connection
var username = "postgres" // sandbox username
var password = "" // read only privileges on our table
var host = "localhost:5432"
var database = "gis3" // database name
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database; // Your Database Connection
// var db = pgp('postgres://postgres:@localhost:5432/postgis_24_sample');

// Set up your database query to display GeoJSON

//var coffee_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry,ST_Length(geography(lg.way)) as length, row_to_json((osm_id, z_order, name)) As properties, lg.id AS id FROM planet_osm_line As lg WHERE lg.route = 'bicycle' ) As f) As fc";
var points_query = `SELECT row_to_json(fc)
FROM (
    SELECT 'FeatureCollection' As type, array_agg(f) As features
    FROM (
        SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry, row_to_json((osm_id, name)) As properties
        FROM planet_osm_point As lg
        WHERE lg.amenity = 'restaurant' AND lg.osm_id > 0)
    As f)
As fc`;

var polygons_query = `SELECT row_to_json(fc)
FROM (
    SELECT 'FeatureCollection' As type, array_agg(f) As features
    FROM (
        SELECT 'Feature' As type, ST_AsGeoJSON(ST_Union(ST_Simplify(lg.way, 0.001)))::json As geometry, row_to_json((osm_id, name)) As properties, ABS(lg.osm_id) AS id
        FROM planet_osm_polygon As lg
        WHERE  lg.boundary = 'administrative' AND lg.admin_level = '10' GROUP BY (lg.osm_id,lg.name))
    As f)
As fc`;


var default_query = `SELECT row_to_json(fc)
FROM (
    SELECT 'FeatureCollection' As type, array_agg(f) As features
    FROM (
        SELECT 'Feature' As type, ST_AsGeoJSON(ST_Union(lg.way))::json As geometry, ST_Length(geography(ST_Union(lg.way))) as length, row_to_json((osm_id, name)) As properties, ABS(lg.osm_id) AS id
        FROM planet_osm_line As lg
        WHERE lg.route = 'bicycle' GROUP BY (lg.osm_id,lg.name)
    ) As f)
As fc`
/* GET home page. */
router.get('/data', function(req, res, next) {
  var client = new Client(conString);
  client.connect();
  var query = client.query(new Query(default_query));
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
      res.send(result.rows[0].row_to_json);
      res.end();
  });
});

/* Route detail information restaurants */
router.post('/routedata', function(req, res, next) {
    var restaurant_query = {
    text: `SELECT  b.name, ST_Distance(geography(p.way), geography(b.way)) as distance
    FROM planet_osm_line p, planet_osm_point b
    WHERE  ST_DWithin(geography(p.way), geography(b.way), 1000) AND  b.amenity = 'restaurant' AND p.osm_id= $1 AND p.route = 'bicycle'`,
    values: [req.body.id]
    };
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(restaurant_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows);
        res.end();
    });
});

/* Towns detail information towns */
router.post('/towndata', function(req, res, next) {
    var town_query ={
    text: `SELECT  b.name
    FROM planet_osm_line p, planet_osm_polygon b
    WHERE  ST_Intersects(b.way,p.way) AND  b.boundary = 'administrative' AND b.admin_level = '10' AND p.osm_id = $1 AND p.route = 'bicycle' GROUP BY b.name`,
    values: [req.body.id]
    }
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(town_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows);
        res.end();
    });
});

/* Touch data of touching routes */
router.post('/touchdata', function(req, res, next) {
    var touch_query = {
    text: `SELECT ABS(p.osm_id) AS id
    FROM planet_osm_line p, planet_osm_line b
    WHERE  ST_Touches(p.way, b.way) AND b.osm_id = $1 AND p.route = 'bicycle' AND p.osm_id != b.osm_id`,
    values: [req.body.id]
    }
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

  /* Sort data by distance from point*/
router.post('/sortdata', function(req, res, next) {
    console.log("REQ:", req.body.data.coordinates[0])
    var sort_query = {
    text: `SELECT row_to_json(fc)
    FROM (
        SELECT 'FeatureCollection' As type, array_agg(f) As features
        FROM (
            SELECT 'Feature' As type, ST_AsGeoJSON(ST_Union(lg.way))::json As geometry, ST_Length(geography(ST_Union(lg.way))) as length, ST_Distance(geography(ST_Union(lg.way)), ST_MakePoint($1, $2)) as distance, row_to_json((osm_id, name)) As properties, ABS(lg.osm_id) AS id
            FROM planet_osm_line As lg
            WHERE lg.route = 'bicycle' GROUP BY (lg.osm_id,lg.name)
            ORDER BY distance
        ) As f)
    As fc`,
    values: [ req.body.data.coordinates[0],  req.body.data.coordinates[1]]
    }
    var client = new Client(conString);
    client.connect();
    var query = client.query(new Query(sort_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
  });


/* Update data when town filter is selected */
router.post('/updatedata', function(req, res, next) {
    var update_query ={
    text: `SELECT row_to_json(fc)
    FROM (
        SELECT 'FeatureCollection' As type, array_agg(f) As features
        FROM (
            SELECT 'Feature' As type, ST_AsGeoJSON(ST_Union(lg.way))::json As geometry, ST_Length(geography(ST_Union(lg.way))) as length,row_to_json((lg.osm_id, lg.name)) As properties, ABS(lg.osm_id) AS id
            FROM planet_osm_polygon pl
            JOIN planet_osm_line As lg
            ON ST_Contains(pl.way, lg.way) 
            WHERE lg.route = 'bicycle' AND pl.osm_id = any($1)
            GROUP BY (lg.osm_id, lg.name)
        )
        As f)
    As fc`,
    values: [req.body.data]
    }
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