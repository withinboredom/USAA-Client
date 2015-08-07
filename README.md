# USAA-Client
A docker client that can interact with a USAA account

//todo:
./run.sh myfile.json

where myfile.json is a file like

``` json
{
    "username": "username",
    "password": "apassword",
    "pin": "1234",
    "questions": [
        {
            "question": "First name of first girlfriend?",
            "answer": "answer"
        },
        {
            "question": "Name of first elementary school?",
            "answer": "answer"
        },
        {
            "question": "City of first elementary school?",
            "answer": "answer"
        }
    ],
    "transfer": [
        {
            "from": "Holdings",
            "to": "Spending",
            "amount": ">1.00"
        },
        {
            "from": "Holdings",
            "to": "Keesha",
            "setAmount": "50.00"
        }
    ]
}
```

This will return a json object in the form:

``` json
{
    "username": "username",
    "password": "apassword",
    "pin": "1234",
    "questions": [
        {
            "question": "First name of first girlfriend?",
            "answer": "answer"
        },
        {
            "question": "Name of first elementary school?",
            "answer": "answer"
        },
        {
            "question": "City of first elementary school?",
            "answer": "answer"
        }
    ],
    "transfer": [
        {
            "from": "Holdings",
            "to": "Spending",
            "amount": "=1.00"
        },
        {
            "from": "Holdings",
            "to": "Keesha",
            "setAmount": "50.00",
            "amount": "=0.00"
        }
    ],
    "accts": [
        {
            "name": "Credit Card",
            "bal": "70.00",
            "available": "9030.00",
            "limit": "10000.00",
            "credit": true,
            "checking": true
        },
        {
            "name": "Checking Acct",
            "bal": "50.84",
            "checking": true
        },
        {
            "name": "Savings",
            "bal": "7.45"
        },
        {
            "name": "Auto & Property Bill",
            "bal": "500.00",
            "bill": true
        }
    ],
    "status": {
        "timems": 94718,
        "code": 200
    }
}
```

This is a huge work in progress..
