# WT Update API

API written in node.js to facilitate publish / subscribe
communication within the WT platform.

## Purpose

We expect that some of the data that is available through the WT
platform will be very short-lived in nature. This includes hotel
availability data but it might also include other information,
such as price data. The crucial question is: how can a WT data
consumer keep track of all the changes without resorting to
polling all resources all the time?

The solution lies in a publish / subscribe mechanism that works
as follows:

1. There is an API specification for update publication
   / subscription together with a reference implementation.
2. Hotel data structure within WT contains an optional reference
   to an instance of this service. It is assumed that update
   notifications will be pushed there actively by the actors
   representing the hotels. (If `wt-js-libs` or `wt-write-api`
   are used for data publication, things should work out of the
   box.)
3. Data consumers can subscribe to update notifications and
   receive them via webhooks.

This solution is decentralized in nature as it allows multiple
independent publish / subscribe channel providers to coexist and
be easily discovered via the WT index.

This repository contains both the API specification (in
`docs/swagger.yml`) as well as the reference implementation.

## How to run this API server

### Requirements
- Nodejs 10.10.x

### Getting stared
In order to install and run tests, we must:
```
git clone git@github.com:windingtree/wt-update-api.git
nvm install
npm install
npm test
```

### Running in dev mode
With all the dependencies installed, you can start the dev server.

First step is to initialize the SQLite database used to store
subscriptions. If you want to use a different database, feel
free to change the connection settings in the appropriate
configuration file in `src/config/`.

```bash
npm run createdb-dev
```

If you'd like to start afresh later, just delete the `.dev.sqlite` file.

### Running in production

To run this "seriously", you will need to go through several steps:

1. Set up an SQL database somewhere (most common SQL databases,
   such as Postgres, MariaDB, MS SQL or Oracle can be used).
2. Prepare a new config, similar to `config/dev.js`. Specify the
   database connection options there (for detailed
   documentation, see https://knexjs.org/).
3. Create the database:
    ```
    WT_CONFIG=<config> node management/createdb.js
    ```
4. Run the server:
    ```
    WT_CONFIG=<config> npm start
    ```

## Publishing notifications

Currently, no authentication is needed when publishing update
notifications.

When sending an update notification, you should specify:

- WT Index address the update pertains to.
- Type of WT resource (currently, "hotel" is the only allowed
  value, but we expect this to be extended in the near future).
- WT Resource address (e.g. hotel address).
- Scope (what has changed).

The purpose of `scope` is twofold:

1. Allow consumers to subscribe only to a subset of updates
   (e.g. updates of prices).
2. Enable consumers to keep track of which remote resources can
   be kept in local cache. For example, if updates keep coming
   without the `dataIndex` subject, the consumer knows the old
   URL of, say, ratePlans is still valid and can be simply
   fetched again to get the newest data.

### Example

```sh
$ curl -X POST localhost:8080/notifications -H 'Content-Type: application/json' -d '
{
    "wtIndex": "0x3b476ac17ffea8dcf2dbd5ef787a5baeeebe9984",
    "resourceType": "hotel",
    "resourceAddress": "0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a",
    "scope": {
        "action": "update",
        "subjects": ["dataIndex", "ratePlans"]
    }
}'
```

## Consuming notifications

If you want to consume notifications, you need to prepare
a publicly accessible http(s) endpoint where you can accept the
notifications. The notifications will come as json-encoded data
via POST HTTP requests. Notification data will be unchanged
(i.e. what the publisher sends will be broadcast to consumers.)
Make sure the endpoint responds to notifications with HTTP
status 200 and the response body is the text `notification
accepted`.

Once you have this endpoint ready, you can subscribe for
notifications of interest:

```sh
$ curl -X POST localhost:8080/subscriptions -H 'Content-Type: application/json' -d '
{
    "wtIndex": "0x3b476ac17ffea8dcf2dbd5ef787a5baeeebe9984",
    "resourceType": "hotel",
    "scope": {
        "action": "update",
        "subjects": ["dataIndex", "ratePlans"]
    },
    "url": "https://my-server.example.com/wt-callbacks/"
}'

# ID of the created subscription will be returned.
{"subscriptionId": "63ccc93d66321f37a7203a26567fd1b0"}
```

`resourceAddress` as well as `scope` are optional. If you do not
specify them, all notifications that fulfill the remaining
criteria will be broadcast to you.

If possible, consider using unique webhook URLs for individual
subscriptions to make eventual cancelling of selected
subscriptions easier in case you lose / do not store
subscription IDs (see the next section for more information).

### Cancelling a subscription

If you want to cancel a subscription, you have two
possibilities:

1. Stop sending the `notification accepted` response from the
   endpoint. (To prevent abuse of our service, subscription is
   deactivated as soon as the recipient stops replying with
   confirmations.)
2. Actively unsubscribe like this (using the correct
   subscription ID):

```sh
$ curl -X DELETE localhost:8080/subscriptions/63ccc93d66321f37a7203a26567fd1b0
```

### Validating subscription status

Sometimes you might need to validate what the status of your
subscription is, for instance when you are not sure whether the
subscription has been cancelled according to rule 1 in the
previous section or not. This is how you can retrieve the data
related to your subscription:

```sh
$ curl localhost:8080/subscriptions/63ccc93d66321f37a7203a26567fd1b0 | python -m json.tool
# JSON representation of the subscription will be returned:
{
    "id": "63ccc93d66321f37a7203a26567fd1b0",
    "active": true,
    "wtIndex": "0x3b476ac17ffea8dcf2dbd5ef787a5baeeebe9984",
    "resourceType": "hotel",
    "scope": {
        "action": "update",
        "subjects": ["dataIndex", "ratePlans"]
    },
    "url": "https://my-server.example.com/wt-callbacks/"
}
```

Note the `active` attribute denoting the subscription status.
