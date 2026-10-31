-- Real administrative region names and approximate region centers, not farm locations.
insert into public.regions(name,latitude,longitude) values
 ('Guntur',16.3067,80.4365),('Krishna',16.175,81.134),('Prakasam',15.5057,80.0499),('Chittoor',13.2172,79.1003)
on conflict(name) do nothing;
