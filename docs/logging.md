---
---

# Data model

A logging entry consists of a category and an argument object. The
category is a dot-separated path, e.g. "Data.DataManager.full-tile".
The arguments object can be any object, but it must be possible both
to convert to JSON using JSON.stringify() and to a human readable
string using .toString(). The JSON representation need not be
convertible back to the same object.

# Rules

Logging of events can be turned on and off for grouyps of event
categories using prefix-mathcing rules.

A rule-set consists of a list of categories, some of which might be
prefixed with a minus sign "-". This rule-set is evaluated top to
bottom, and the first entry in list with a category that is a prefix
of the event category, is used to determine whether to log the event
or not. If the rule item is prefixed by a minus sign, the event is
discarded, otherwize it is logged. If no rule item matches the event
category, it is discarded.

Example rules:

    -Data.DataManager.full-tile
    Data.DataManager
    Data.BaseTiledFormat

Example event category:

    Data.DataManager.load

The event category does not match the first rule entry, but matches
the second one, which does not have a - prefix, so the event is
logged. The third rule entry is not relevant, as the event has already
beren acted on in the second rule entry.


# Back-ends

Logging can be done to one of several logging back-ends. It is even
possible to simultanelously log different subsets of event categories
to several back ends.

A full logging configuration consists of a mapping from backend name
to arguments and rules.

    visualization.state.setValue(
      "logging", {
        "screen":{
          "args": {},
          "rules":[
            "-Data.DataManager.full-tile",
            "Data.DataManager",
            "Data.BaseTiledFormat"]}});


## Logging to screen

The name of this back-end is "screen", and it logs to the debugging
console using console.log().


## Logging to a javascript variable

Logged events can be appended to a list and later retrieved using the interactive javascript console. Use the backend name "store" to do this. The log entries can be retrieved from the variable require("app/Logging").main.destinations.store.storage. More realistic example usage retrieving the two last logging messages:

    require("app/Logging").main.destinations.store.storage.slice(-2).map(
      function (entry) { return entry.toString(); }
    ).join("\n")

## Server logging

Events can be logged using HTTP POST to an arbitrary URL using the
destination name "server". The url should be given in the "url" back
end argument. The event is encoded as JSON in the HTTP body.

## Logging to Loggly

The destination name should be set to "loggly" and the argument
logglyKey must be set to the loggly API key.

## Logging to Google Analytics

Pageviews are being tracked automatically as soon as you enable
logging to Google Analytics. Additionally, logging events can be
converted tyo GA events and logged.

Here is an example configuration logging Data.DataManager.full-tile
events to screen and GA:

    visualization.state.setValue(
      "logging", {
        "screen":{
          "rules":["Data.DataManager.full-tile"]},
        "googleAnalytics": {
          "args":{"trackingID":"UA-12345678-9"},
          "rules":["Data.DataManager.full-tile"]}});
