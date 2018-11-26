# Opis projektu

Doménu, ktorú som si v tomto projekte zvolil je práca s cyklotrasami. Aplikácia by mala slúžiť na vyhľadávanie cyklotrás vo zvolených oblastiach, pričom ukazuje aj reštaurácie v blízkosti každej cyklostrasy v okruhu 1km. V aplikácií sa vyhľadané cyklotrasy zoraďujú podľa vzdialenosti od miesta, ktoré si používateľ zvolí vo vyhľadávacom formuláry. Vyhľadané cyklotrasy sa dajú zvýrazňovať, pričom sú zvýraznené aj také cyklotrasy, s ktorými sa požadovaná cyklotrasa dotýka. Ku každej cyklotrase sa uvádza aj jej dĺžka a obce, cez ktoré prechádza. 

## Opis scenárov 

- Základné zobrazenie dát
Prvým scénarom je samotné zobrazenie všetkých cyklotrás, reštaurácií a obcí.

Príklad query pre zobrazenie všetkých cyklotrás:

Použité geografické funkcie:
ST_Length() - zísakanie dĺžky cyklotrasy

```javascript
var default_query = `SELECT row_to_json(fc)
FROM (
    SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (
        SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry, ST_Length(geography(lg.way)) as length, row_to_json((osm_id, z_order, name)) As properties, lg.id AS id
        FROM planet_osm_line As lg
        WHERE lg.route = 'bicycle'
    ) As f)
As fc`
```

- Získanie všetkých reštaurácií v okolí 1km od zvolenej cyklotrasy

Použité geografické funkcie:
ST_Distance() - získanie vzdialenosti kažej reštaurácie od zvolenej cyklotrasy
ST_DWithin() - získanie len takých reštaurácií, ktoré sú v určitej vzdilanosti (1km)

```javascript
var restaurant_query = {
    text: `SELECT  b.name, ST_Distance(geography(p.way), geography(b.way)) as distance
    FROM planet_osm_line p, planet_osm_point b
    WHERE  ST_DWithin(geography(p.way), geography(b.way), 1000) AND  b.amenity = 'restaurant' AND p.id= $1 AND p.route = 'bicycle'`,
    values: [req.body.id]
}
```

- Získanie všetkých obcí, cez ktoré zvolená cyklotrasa prechádza

Použité geografické funkcie:
ST_Intersects() - získanie len takých obcí, cez ktoré zvolená cyklotrasa prechádza

```javascript
var town_query ={
    text: `SELECT  b.name
    FROM planet_osm_line p, planet_osm_polygon b
    WHERE  ST_Intersects(geography(b.way), geography(p.way)) AND  b.boundary = 'administrative' AND b.admin_level = '10' AND p.id = $1 AND p.route = 'bicycle' GROUP BY b.name`,
    values: [req.body.id]
}
```

- Získanie všetkých cyklotrás, s ktorými sa zvolená cyklotrasa dotýka 

Použité geografické funkcie:
ST_Touches() - získanie len takých cyklotrás, s ktorými sa zvolená cyklotrasa dotýka 

```javascript
var touch_query = {
    text: `SELECT p.id AS id
    FROM planet_osm_line p, planet_osm_line b
    WHERE  ST_Touches(p.way, b.way) AND b.id = $1 AND p.route = 'bicycle' AND p.id != b.id`,
    values: [req.body.id]
}
```


- Vyfiltrovanie len takých cyklotrás, ktoré sa nachádzajú len vo vybratých obciach

Použité geografické funkcie:
ST_Contains() - získanie len takých cyklotrás, ktoré sa nachádzajú len vo vybratých obciach

```javascript
var update_query ={
    text: `SELECT row_to_json(fc)
    FROM (
        SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
        FROM (
            SELECT 'Feature' As type, ST_AsGeoJSON(lg.way)::json As geometry,ST_Length(geography(lg.way)) as length,row_to_json((lg.osm_id, lg.z_order, lg.name)) As properties, lg.id AS id
            FROM planet_osm_polygon pl
            JOIN planet_osm_line As lg
            ON ST_Contains(pl.way, lg.way) 
            WHERE lg.route = 'bicycle' AND pl.osm_id = any($1)
        )
        As f)
    As fc`,
    values: [req.body.data]
    }
```

## Data sources

- [Open Street Maps](https://www.openstreetmap.org/)

## My project

Fill in (either in English, or in Slovak):

**Application description**: `<fill in>`

**Data source**: `<fill in>`

**Technologies used**: `<fill in>`
