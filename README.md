# Scoring model API

[![Maintainability](https://api.codeclimate.com/v1/badges/e74308bdc62b801f3112/maintainability)](https://codeclimate.com/github/Neurus1970/models/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/e74308bdc62b801f3112/test_coverage)](https://codeclimate.com/github/Neurus1970/models/test_coverage)

## Individuals

An API exposing the credit score for the 


### Performing a request

Example request

```bash
curl -X GET http://<base_url>/models/scoring/individuals

```
Response

```JSON
{
  "searchTime": 0,
  "hits": 1073,
  "pageSize": 50,
  "dataPages": 22,
  "nextPage": "/models/scoring/individuals?page=2",
  "debtors": [
    {
      "id": "3890089",
      "name": "DOS SANTOS QUESADA, ALICIA LORENZA",
      "default_probability": {
        "within_3_months": 0,
        "within_6_months": 0,
        "within_9_months": 0,
        "within_12_months": 0.018247683
      },
      "_links": {
        "href": "/models/scoring/individuals/3890089"
      },
      "median": 0.045284033,
      "mean": 0.09683235834389563,
      "stdDev": 0.1357565412061047,
      "rank": 1
    },
    {
      "id": "238408432",
      "name": "PEREZ FELIX, FRANCISCO ALBERTO",
      "default_probability": {
        "within_3_months": 0,
        "within_6_months": 0,
        "within_9_months": 0,
        "within_12_months": 0.018247683
      },
      "_links": {
        "href": "/models/scoring/individuals/238408432"
      },
      "median": 0.045284033,
      "mean": 0.09683235834389563,
      "stdDev": 0.1357565412061047,
      "rank": 1
    },
    {
      "id": "92389874",
      "name": "PUENTE RAMIREZ, MARIA JOSEFA",
      "default_probability": {
        "within_3_months": 0,
        "within_6_months": 0,
        "within_9_months": 0,
        "within_12_months": 0.018247683
      },
      "_links": {
        "href": "/models/scoring/individuals/92389874"
      },
      "median": 0.045284033,
      "mean": 0.09683235834389563,
      "stdDev": 0.1357565412061047,
      "rank": 1
    }
  ]
}

```


## Pymes

