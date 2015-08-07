var casper = require('casper').create({
    pageSettings: {
        userAgent: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36"
    }
});

var dir = '/home/casperjs-files/slides/';

var makeNeg = function(number) {
    if (typeof number === "undefined") return number;
    if (number[0] == "(") {
        number = "-" + number.replace(/\)/g, "").replace(/\(/g, "");
    }
    return number;
};

var login = function(casper, proof) {
    casper.start('https://mobile.usaa.com/inet/ent_logon/Logon');
    /*casper.wait(2000, function () {
        this.capture('/home/casperjs-files/slides/home.png');
    });*/
    casper.waitForSelector(".button-logon",function () {
        this.click(".button-logon");
    });
    /*casper.wait(100, function () {
        this.capture(dir + 'login.png')
    });*/
    casper.waitForSelector("form[name='Logon']", function () {
        this.fill("form[name='Logon']", {
            j_username: proof.username,
            j_password: proof.password
        }, true)
    });
    /*casper.wait(100, function () {
        this.capture(dir + "pin.png");
    });*/
    casper.waitForSelector("form#id4", function () {
        this.fill("form#id4", {
            "table:row1:pin1": proof.pin
        }, true)
    });
    /*casper.wait(100, function () {
        this.capture(dir + "question.png");
    });*/
    casper.waitForSelector(".firstRow .label label", function () {
        var question = this.fetchText(".firstRow .label label");
        //console.log("got question: " + question);
        var answer;
        for(var i = 0; i < proof.questions.length; i++) {
            if (proof.questions[i].question == question) {
                answer = proof.questions[i].answer;
                //console.log("Giving answer: " + answer);
                break;
            }
        }
        this.fill("form#id4", {
            "table:table_body:questionRow:section:questionRow_body:answer": answer
        }, true);
    });
    casper.wait(1500, function () {
        this.capture(dir + "menu.png");
    });
    return casper;
};

var getBalances = function(casper, proof) {
    casper.then(function() {
        this.clickLabel("My Accounts");
    });
    casper.wait(200, function() {
        this.capture(dir + "accounts.png");
    });
    var acctNames = [];
    var acctBals = [];

    casper.then(function() {
        var nodes = this.getElementsInfo('.acct-name');
        for(var i = 0; i < nodes.length; i++) {
            acctNames.push(nodes[i].text);
        }
    });

    casper.then(function() {
        var nodes = this.getElementsInfo('.acct-bal');
        for(var i = 0; i < nodes.length; i++) {
            acctBals.push(nodes[i].text);
        }
    });

    casper.then(function() {
        proof.accts = [];
        var acct;
        for(var i = 0; i < acctNames.length; i++) {
            acct = {};
            acct.name = acctNames[i];
            acct.bal = acctBals[i];
            proof.accts.push(acct);
        }
        //require('utils').dump(proof.accts);
    });

    casper.then(function() {
        for(var i = 0; i < proof.accts.length; i++) {
            (function(acct) {
                casper.thenOpen("https://mobile.usaa.com/inet/ent_home/MbCpHome?channel=mobile");
                casper.then(function() {
                    this.clickLabel("My Accounts");
                });
                casper.wait(500, function () {
                    this.capture(dir + "current.png");
                    this.clickLabel(acct.name);
                    //this.click("a .acct-name[text='" + acct.name + "']")
                });
                casper.wait(500, function () {
                    if (this.exists(".details")) {
                        var details = this.getElementsInfo(".details");
                        //require('utils').dump(details);
                        for (var i = 0; i < details.length; i++) {
                            if (typeof details[i].text !== "string") continue;
                            var deet = details[i].text.replace(/\n/g, "").replace(/\t/g, "").split(":");
                            var property = deet[0].trim();
                            if (typeof deet[1] === 'undefined') deet[1] = '';
                            var value = deet[1].trim().replace(new RegExp(String.fromCharCode(160), 'g'), "").replace(/\$/g, "").replace(/ /g, "");
                            switch (property) {
                                case "Current Balance":
                                    acct.bal = value;
                                    break;
                                case "Credit Limit":
                                    acct.limit = value;
                                    acct.credit = true;
                                    break;
                                case "Available Credit":
                                    acct.available = value;
                                    break;
                                case "Last Payment Amount":
                                    acct.bill = true;
                                    break;
                                case "Available Balance":
                                    acct.bal = value;
                                    break;
                                case "Card Number":
                                    acct.checking = true;
                                    break;
                                default:
                                    //console.log("saw: " + deet[0] + " = " + deet[1]);
                                    break;
                            }
                            acct.bal = makeNeg(acct.bal);
                            acct.available = makeNeg(acct.available);
                            acct.bal = acct.bal.replace(/\$/g, "").replace(/,/g, "");
                            if (acct.name == "Keesha") {
                                acct.checking = true;
                            }
                        }
                    }
                });
                casper.then(function () {
                    this.back();
                });
                casper.wait(300, function() {
                    this.capture(dir + "current.png");
                });
            })(proof.accts[i]);
        }
    });

    return casper;
};

var transferFunds = function(casper, proof, transfer, attempt) {
    if (typeof attempt === 'undefined') attempt = 1;
    if (attempt > 3) {
        transfer.amount = "=0.00";
        return casper;
    }
    var tr;
    var amount, to, from;
    casper.thenOpen("https://mobile.usaa.com/inet/ent_home/MbCpHome?channel=mobile&akredirect=true");
    casper.then(function() {
        this.clickLabel("Transfer Funds");
    });
    casper.wait(500, function() {
        //console.log("Setting up transfer");
        from = this.getElementInfo("option[value^='" + transfer.from + "']").attributes.value;
        to = this.getElementInfo("option[value^='" + transfer.to + "']").attributes.value;
        //require('utils').dump(from);

        if (transfer.amount) {
            tr = transfer.amount[0];
            amount = transfer.amount.slice(1);
        }

        if (transfer.setAmount) {
            tr = ">";
            amount = transfer.setAmount - find(proof.accts, 'name', transfer.to).bal;
            if (amount < 0) {
                var temp = to;
                to = from;
                from = temp;
                temp = transfer.from.toString();
                transfer.from = transfer.to.toString();
                transfer.to = transfer.from;
                amount = -1 * amount;
            }
            else if (amount == 0) {
                // casper skip next couple
                this.bypass(3);
                tr = "=";
            }
            amount = amount.toString();
            if (amount.indexOf('.') < 0) {
                amount += ".00";
            }

            transfer.amount = tr + amount;
        }

        amount = amount.toString().split(".");
        amount[1] = amount[1].slice(0, 2);
    });
    casper.then(function() {
        //console.log("trying to set from: " + from);
        //console.log("trying to set to: " + to);
        this.fill("form[name='TransferDetail_Mobile']", {
            "mobilefundstransferdisplayobject.selectedfromacctkey": from,
            "mobilefundstransferdisplayobject.selectedtoacctkey": to,
            "mobilefundstransferdisplayobject.dollaramt": amount[0],
            "mobilefundstransferdisplayobject.centamt": amount[1],
            "mobilefundstransferdisplayobject.memo": "health transfer"
        });
    });
    casper.then(function() {
        this.capture(dir + "doingTransfer.png");
        this.click("input[value='Next']");
    });
    casper.wait(1500, function() {
        amount = amount[0] + "." + amount[1];
        this.capture(dir + "submittingTransfer.png");
        if (this.exists("input[name='PsButton_[action]UPDATE[/action]']")) {
            this.click("input[value='Submit']")
            transfer.amount = "=" + amount;
        }
        else {
            if (tr == ">") {
                transfer.amount = tr + (parseFloat(amount) + 0.01).toString();
            }
            else {
                transfer.amount = tr + (parseFloat(amount) - 0.01).toString();
            }

            transferFunds(casper, proof, transfer, attempt + 1);
            this.capture(dir + "failed_transfer.png");
            //console.log("would try to transfer: " + transfer.amount);
        }
    });
    casper.then(function() {
        this.capture(dir + "done.png");
    });

    return casper;
};

var find = function(arr, key, value) {
    for(var i = 0; i < arr.length; i++) {

        if(typeof arr[i][key] !== 'undefined' && arr[i][key] == value) {
            return arr[i];
        }
    }
};

proof = {
    username: "a user name",
    password: "a password",
    pin: " a pin",
    questions: [
        {
            question: "First name of first girlfriend?",
            answer: "answer"
        },
        {
            question: "Name of first elementary school?",
            answer: "answer"
        },
        {
            question: "City of first elementary school?",
            answer: "answer"
        }
    ],
    needBalances: true,
    transfer: [
        {
            from: "Holdings",
            to: "Spending",
            amount: ">1.00"
        },
        {
            from: "Holdings",
            to: "Keesha",
            setAmount: "50.00"
        }
    ]
};

casper = login(casper, proof);
casper = getBalances(casper, proof);
if (typeof proof.transfer !== 'undefined') {
    for (var i = 0; i < proof.transfer.length; i++) {
        casper = transferFunds(casper, proof, proof.transfer[i]);
    }
}

casper.then(function() {
    end = Date.now();
    proof.status = {};
    proof.status.timems = end - start;
    proof.status.code = 200;
    require('utils').dump(proof);
    //console.log ("took " + (end - start) + "ms");
});

setTimeout(function() {
    proof.status.code = 503;
    proof.status.message = "Timed out";
    casper.exit();
}, 120000);

start = Date.now();
casper.run();
