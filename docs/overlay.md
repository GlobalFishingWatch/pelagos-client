---
---

Pelagos Client supports overlaying the map with static/semi static
content from various sources.

# MapsEngine

MapsEngine has been discontinued and this code is no longer supported.

# CartoDB

A CartoDB layer can be added by setting the animation type to CartoDB,
to data format to EmptyFormat and the url to the CartoDB.JS url from
the "publish" dialog in CartoDB.

## Torque Layers

CartoDB supports maps with a temporal component. These maps can be
used in Pelagos Client. However they do suffer from one limitation:
They do not support arbitrary time windows, but instead shows a set
amount of time around the current time slider position. Pelagos Client
maps the *center* of the time slider to the CartoDB time slider
position.

To create such a layer you need to

* Create / upload the dataset with a column with TIMESTAMP data type,
  containing dates/times of the rows. Note: This can NOT be a STRING
  type column, it must have the right data type!
* When creating the map
  * Go to the "Wizards" tab in the sidebar
  * Select "Torque" as the template
  * Select your date column defined above as the "Time column" in the
    dropdown for that.

Alternatively, if your table is already uploaded, and the date column
has the wrong type, say string, you can "fix" that by editing the SQL
query in the SQL tab in the sidebar och your map to look something
like this:

    select my_date_column::timestamp as my_fixed_date_column,* from mytable;

And then selecting my_fixed_date_column from the dropdown for column
in the torque layer wizard. This way of doing it is not recommended,
since it's slower and more error prone, buf if the data is already
there, this allows you to use it without re-uploading it.
