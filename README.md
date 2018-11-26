# Opis projektu

Doménu, ktorú som si v tomto projekte zvolil je práca s cyklotrasami. Aplikácia by mala slúžiť na vyhľadávanie cyklotrás vo zvolených oblastiach, pričom ukazuje aj reštaurácie v blízkosti každej cyklostrasy v okruhu 1km. V aplikácií sa vyhľadané cyklotrasy zoraďujú od podľa vzdialenosti od miesta, ktoré si používateľ zvolí vo vyhľadávacom formuláry. Vyhľadané cyklotrasy sa dajú zvýrazňovať, pričom sú zvýraznené aj také cyklotrasy, s ktorými sa požadovaná cyklotrasa dotýka. Ku každej cyklotrase sa uvádza aj jej dĺžka a obce, cez ktoré prechádza. 

## Opis scenárov 

-Základné zobrazenie dát

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

## Data sources

- [Open Street Maps](https://www.openstreetmap.org/)

## My project

Fill in (either in English, or in Slovak):

**Application description**: `<fill in>`

**Data source**: `<fill in>`

**Technologies used**: `<fill in>`
