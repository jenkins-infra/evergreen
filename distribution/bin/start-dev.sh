#!/usr/bin/env bash

{
make run
} &
{
sleep 20
until $(curl --output /dev/null --silent --head --fail http://localhost:3030); do
    sleep 3
done
}

echo "*** backend is up - executing curl command ***"
curl --data-raw "{\"commit\":\"container-tests\",\"manifest\":$(cat ../services/ingest.json)}" \
-H 'Authorization: the API calls are coming from inside the house' \
-H 'Content-Type: application/json' \
http://localhost:3030/update

wait
