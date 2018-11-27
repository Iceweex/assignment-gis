Meno: Miloslav Smetana

AIS: 72360

# Opis projektu

Doménu, ktorú som si v tomto projekte zvolil je práca s cyklotrasami. Aplikácia by mala slúžiť na vyhľadávanie cyklotrás vo zvolených oblastiach, pričom ukazuje aj reštaurácie v blízkosti každej cyklostrasy v okruhu 1km. V aplikácií sa vyhľadané cyklotrasy zoraďujú podľa vzdialenosti od miesta, ktoré si používateľ zvolí vo vyhľadávacom formuláry. Vyhľadané cyklotrasy sa dajú zvýrazňovať, pričom sú zvýraznené aj také cyklotrasy, s ktorými sa požadovaná cyklotrasa dotýka. Ku každej cyklotrase sa uvádza aj jej dĺžka a obce, cez ktoré prechádza. 

## Opis scenárov 

### Základné zobrazenie cyklotrás, reštaurácií a obcí

#### Príklad query pre získanie všetkých cyklotrás:

```javascript
var default_query = `SELECT row_to_json(fc)
FROM (
    SELECT 'FeatureCollection' As type, array_agg(f) As features
    FROM (
        SELECT 'Feature' As type, ST_AsGeoJSON(ST_Union(lg.way))::json As geometry, ST_Length(geography(ST_Union(lg.way))) as length, row_to_json((osm_id, name)) As properties, ABS(lg.osm_id) AS id
        FROM planet_osm_line As lg
        WHERE lg.route = 'bicycle'
        GROUP BY (lg.osm_id,lg.name)
    ) As f)
As fc`
```

#### Použité geografické funkcie:
- `ST_Length` - vráti dĺžku cyklotrasy
- `ST_Union` - zjednotí cyklotrasy s rovnakým osm_id
- `ST_Simplify` - zjednodušenie polygónov pre rýchejšie spracovanie

### Získanie všetkých reštaurácií v okolí 1km od zvolenej cyklotrasy

#### Príklad query:
```javascript
var restaurant_query = {
    text: `SELECT  b.name, ST_Distance(geography(p.way), geography(b.way)) as distance
    FROM planet_osm_line p, planet_osm_point b
    WHERE  ST_DWithin(geography(p.way), geography(b.way), 1000) AND  b.amenity = 'restaurant' AND p.osm_id= $1 AND p.route = 'bicycle'`,
    values: [req.body.id]
}
```

#### Použité geografické funkcie:
- `ST_Distance` - vráti vzdialenosť reštaurácie od zvolenej cyklotrasy
- `ST_DWithin` - vráti kladnú odpoveď ak sa reštaurácia nachádza 1km od zvolenej cyklotrasy

### Získanie všetkých obcí, cez ktoré zvolená cyklotrasa prechádza

#### Príklad query:
```javascript
var town_query ={
    text: `SELECT  b.name
    FROM planet_osm_line p, planet_osm_polygon b
    WHERE  ST_Intersects(geography(b.way), geography(p.way)) AND  b.boundary = 'administrative' AND b.admin_level = '10' AND p.id = $1 AND p.route = 'bicycle' GROUP BY b.name`,
    values: [req.body.id]
}
```

#### Použité geografické funkcie:
- `ST_Intersects` - vráti kladnú odpoveď, ak cez obec prechádza zvolená cyklotrasa

### Získanie všetkých cyklotrás, s ktorými sa zvolená cyklotrasa dotýka 

#### Príklad query:
```javascript
var touch_query = {
    text: `SELECT ABS(p.osm_id) AS id
    FROM planet_osm_line p, planet_osm_line b
    WHERE  ST_Touches(p.way, b.way) AND b.osm_id = $1 AND p.route = 'bicycle' AND p.osm_id != b.osm_id`,
    values: [req.body.id]
}
```

#### Použité geografické funkcie:
- `ST_Touches` - vráti kladnú odpoveď, ak sa cyklotrasy dotýka zvolená cyklotrasa 

### Vyfiltrovanie len takých cyklotrás, ktoré sa nachádzajú len vo vybratých obciach

#### Príklad query:
```javascript
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
```

#### Použité geografické funkcie:
- `ST_Contains` - vráti kladnú podpoveď, ak sa cyklotrasa nachádza vo zvolenej obci

### Zoradenie cyklotrás podľa vzdialenosti od bodu určenia

#### Príklad query:
```javascript
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
```

#### Použité geografické funkcie:

- `ST_Distance` - slúží na výpočet vzdialenosti požadovaného bodu od cyklotrasy
- `ST_Length` - vráti dĺžku cyklotrasy
- `ST_Union` - zjednotí cyklotrasy s rovnakým osm_id 
- `ST_MakePoint` - vráti geografický bod zo súradníc


## Informácie o dátach

V rámci projektu som pracoval len s dátami získanými z [Open Street Maps](https://www.openstreetmap.org/). Ako oblasť som si zvolil  skoro celé západné Slovensko (1.36 GB). Na importovanie stiahnutého súboru .osm som použil nástroj `osm2pgsql`. Generovanie GeoJSON je zabezpečené pomocou funkcie `ST_AsGeoJSON`, ktorá je potrebná aby dáta boli v správnom formáte pre zobrazenie. Pri analyzovaní dát som zistil, že niektoré osm_id, teda identifikačné čísla záznamov sa opakujú a preto som v rámci query využil aj `ST_UNION` funkciu, ktorá zjednocuje geografické dáta.  

#### Použité dáta:

- planet_osm_line - tabuľku čiar som použil pre zísaknie dát o cyklotrasách (way, osm_id, name, route)
- planet_osm_point - tabuľku bodov som použil pre zísaknie dát o reštauráciach (way, osm_id, name, amenity)
- planet_osm_polygon - tabuľku polygónov som použil pre zísaknie dát o obciach (way, osm_id, name, boundary, admin_level)

## Indexy

```
CREATE INDEX point_amenity_index ON planet_osm_point (amenity);
```
```
CREATE INDEX line_route_index ON planet_osm_line (route);
```
```
CREATE INDEX line_bicycle_index ON planet_osm_line USING gist(way) WHERE route = 'bicycle';
```
```
CREATE INDEX polygon_admin_index ON planet_osm_polygon USING gist(way) WHERE boundary = 'administrative' AND admin_level = '10';
```

## Použité technológie

- [Express](https://expressjs.com/) (Node.js framework) - serverová časť
- [Quasar](https://quasar-framework.org/) (Vue.js framework) - klientská časť
- [Mapbox](https://www.mapbox.com/) - interaktívna mapa na zobrazovanie dát 
- [PostGis](https://postgis.net/) - priestorové rozšírenie databázy [PostgreSQL](https://www.postgresql.org/)

## Screenshoty z aplikácie

![aplication screenshot1][screenshot1]

[screenshot1]: https://github.com/Iceweex/assignment-gis/blob/master/Capture1.PNG "Aplication screenshot1"

![aplication screenshot2][screenshot2]

[screenshot2]: https://github.com/Iceweex/assignment-gis/blob/master/Capture2.PNG "Aplication screenshot2"
